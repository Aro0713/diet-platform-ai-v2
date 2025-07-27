import OpenAI from "openai";
import { Meal } from "@/types";
import { calculateMealMacros } from "@/utils/nutrition/calculateMealMacros";
import { validateDietWithModel } from "@/utils/validateDiet";
import { nutrientRequirementsMap, type NutrientRequirements } from "@/utils/nutrientRequirementsMap";

function convertStructuredToFlatPlan(
  structuredPlan: Record<string, Record<string, Meal>>
): Record<string, Meal[]> {
  const flat: Record<string, Meal[]> = {};
  for (const day in structuredPlan) {
    flat[day] = Object.values(structuredPlan[day]);
  }
  return flat;
}

function calculateAverages(diet: Record<string, Record<string, Meal>>) {
  const total: Record<string, number> = {};
  let mealCount = 0;

  for (const day of Object.values(diet)) {
    for (const meal of Object.values(day)) {
      if (meal.macros) {
        for (const [key, value] of Object.entries(meal.macros)) {
          if (typeof value === 'number') {
            total[key] = (total[key] ?? 0) + value;
          }
        }
        mealCount++;
      }
    }
  }

  const avg: Record<string, number> = {};
  for (const [key, value] of Object.entries(total)) {
    avg[key] = typeof value === 'number' ? parseFloat((value / 7).toFixed(1)) : 0;
  }

  return avg;
}

function mergeRequirements(models: string[]): NutrientRequirements | null {
  const merged: Partial<NutrientRequirements> = {};

  for (const model of models) {
    const req = nutrientRequirementsMap[model];
    if (!req) continue;

    for (const [key, range] of Object.entries(req)) {
      const k = key as keyof NutrientRequirements;
      if (!merged[k]) {
        merged[k] = { min: range.min, max: range.max };
      } else {
        merged[k]!.min = Math.max(merged[k]!.min, range.min);
        merged[k]!.max = Math.min(merged[k]!.max, range.max);
      }
    }
  }

  const allKeys = [
    "protein", "fat", "carbs", "fiber", "sodium", "potassium", "magnesium",
    "iron", "zinc", "calcium", "vitaminD", "vitaminB12", "vitaminC",
    "vitaminA", "vitaminE", "vitaminK"
  ];
  const result = Object.fromEntries(
    allKeys.map(k => [k, merged[k as keyof NutrientRequirements] ?? { min: 0, max: 999999 }])
  );

  return result as NutrientRequirements;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dqAgent = {
  run: async ({
    dietPlan,
    model,
    goal,
    cpm,
    weightKg,
    conditions
  }: {
    dietPlan: Record<string, Record<string, Meal>>;
    model: string;
    goal?: string;
    cpm?: number | null;
    weightKg?: number | null;
    conditions?: string[];
  }) => {
    const safeCpm = cpm ?? undefined;
    const safeWeight = weightKg ?? undefined;

    const enrichedPlan: Record<string, Record<string, Meal>> = JSON.parse(JSON.stringify(dietPlan));
    for (const day of Object.keys(enrichedPlan)) {
      const meals = enrichedPlan[day];
      for (const mealKey of Object.keys(meals)) {
        const meal = meals[mealKey];
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
          const validIngredients = meal.ingredients.filter((i: any) => typeof i.product === 'string' && typeof i.weight === 'number');
          meal.macros = await calculateMealMacros(validIngredients);
        } else {
          meal.macros = await calculateMealMacros([]);
        }
      }
    }

    const mergedRequirements = mergeRequirements([
      model,
      ...(conditions ?? [])
    ]);

    const avg = calculateAverages(enrichedPlan);
    const violations: string[] = [];

    if (mergedRequirements) {
      for (const [key, { min, max }] of Object.entries(mergedRequirements)) {
        const val = avg[key];
        if (val != null) {
          if (val < min) violations.push(`⬇️ ${key}: ${val} < ${min}`);
          if (val > max) violations.push(`⬆️ ${key}: ${val} > ${max}`);
        }
      }
    }

    if (violations.length > 0) {
      console.warn("📛 Naruszenia składników:", violations);
    }

    const prompt = `
You are a clinical AI diet quality controller.

Your task is to validate and optionally fix a 7-day meal plan based on the following:

- Diet model: "${model}"
- Goal: "${goal}"
- Target energy requirement (CPM): ${safeCpm} kcal
- Patient weight: ${safeWeight} kg

Analyze the plan by:
1. Checking total daily and weekly kcal vs CPM (±10% acceptable)
2. Verifying macronutrient and micronutrient structure based on ranges
3. Detecting unrealistic nutrient gaps or excess
4. Checking consistent number of meals per day

Additional context:
- Average daily nutrients (all): ${JSON.stringify(avg, null, 2)}
- Nutrient range violations: ${violations.join("; ") || "None"}
- Target nutrient ranges (merged from model + conditions):
${JSON.stringify(mergedRequirements, null, 2)}

Return one of the following:
✅ VALID — if all rules are met
⚠️ Issues found:
- List of specific problems

📋 CORRECTED_JSON:
{
  "dietPlan": {
    "Monday": {
      "Breakfast": {
        "time": "07:30",
        "menu": "Oatmeal with apple",
        "kcal": 400,
        "ingredients": [ { "product": "...", "weight": 100 } ],
        "macros": { "protein": 20, "fat": 10, "carbs": 40 }
      }
    }
  }
}

⚠️ Return ONLY the JSON object without markdown or comments.
Here is the plan:
${JSON.stringify(enrichedPlan, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a clinical diet quality controller for structured JSON plans."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    });

    const text = completion.choices[0].message.content ?? "";
    const clean = text.replace(/```json|```/g, "").trim();

    if (clean.includes("CORRECTED_JSON")) {
      const startIndex = clean.indexOf("{");
      const correctedJson = clean.slice(startIndex).trim();

      try {
        const parsed = JSON.parse(correctedJson);
        const correctedStructured = parsed?.dietPlan as Record<string, Record<string, Meal>>;
        if (!correctedStructured) throw new Error("Brak dietPlan");

        for (const day of Object.keys(correctedStructured)) {
          const meals = correctedStructured[day];
          for (const mealKey of Object.keys(meals)) {
            const meal = meals[mealKey];
            if (!meal.macros || Object.keys(meal.macros).length === 0) {
              meal.macros = await calculateMealMacros(meal.ingredients);
            }
          }
        }

        const originalMeals: Meal[] = Object.values(enrichedPlan).flatMap(day => Object.values(day));
        const correctedMeals: Meal[] = Object.values(correctedStructured).flatMap(day => Object.values(day));

        const issuesOriginal = validateDietWithModel(originalMeals, model);
        const issuesCorrected = validateDietWithModel(correctedMeals, model);

        if (issuesCorrected.length < issuesOriginal.length) {
          console.log("✅ Ulepszony plan wybrany przez dqAgent:", issuesCorrected);
          return {
            type: "dietPlan",
            plan: convertStructuredToFlatPlan(correctedStructured),
            violations
          };
        }
      } catch (e) {
        console.warn("❌ Nie udało się sparsować JSON:", e);
      }
    }

    return {
      type: "dietPlan",
      plan: convertStructuredToFlatPlan(enrichedPlan),
      violations
    };
  }
};
