import OpenAI from "openai";
import { Meal, Ingredient } from "@/types";
import { validateDietWithModel } from "@/utils/validateDiet";
import { nutrientRequirementsMap, type NutrientRequirements } from "@/utils/nutrientRequirementsMap";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const nutrientKeys = [
  "kcal", "protein", "fat", "carbs", "fiber",
  "sodium", "potassium", "magnesium", "iron", "zinc", "calcium",
  "vitaminD", "vitaminB12", "vitaminC", "vitaminA", "vitaminE", "vitaminK"
] as const;

type NutrientKey = typeof nutrientKeys[number];

type NutrientTotals = Record<NutrientKey, number>;

function convertStructuredToFlatPlan(
  structuredPlan: Record<string, Record<string, Meal>>
): Record<string, Meal[]> {
  const flat: Record<string, Meal[]> = {};
  for (const day in structuredPlan) {
    flat[day] = Object.values(structuredPlan[day]);
  }
  return flat;
}

function calculateAverages(diet: Record<string, Record<string, Meal>>): NutrientTotals {
  const total: Partial<NutrientTotals> = {};
  for (const day of Object.values(diet)) {
    for (const meal of Object.values(day)) {
      if (meal.macros) {
        for (const key of nutrientKeys) {
          total[key] = (total[key] ?? 0) + (meal.macros[key] ?? 0);
        }
      }
    }
  }
  const avg: NutrientTotals = {} as NutrientTotals;
  for (const key of nutrientKeys) {
    avg[key] = parseFloat(((total[key] ?? 0) / 7).toFixed(1));
  }
  return avg;
}

function mergeRequirements(models: string[]): NutrientRequirements {
  const merged: Partial<NutrientRequirements> = {};

  for (const model of models) {
    const req = nutrientRequirementsMap[model];
    if (!req) continue;

    for (const [key, range] of Object.entries(req)) {
      if (!merged[key as keyof NutrientRequirements]) {
        merged[key as keyof NutrientRequirements] = {
          min: range.min,
          max: range.max
        };
      } else {
        const existing = merged[key as keyof NutrientRequirements]!;
        merged[key as keyof NutrientRequirements] = {
          min: Math.max(existing.min, range.min),
          max: Math.min(existing.max, range.max)
        };
      }
    }
  }

  return Object.fromEntries(
    Object.entries(merged).map(([k, v]) => [k, v ?? { min: 0, max: 999999 }])
  ) as NutrientRequirements;
}


async function fetchUSDAForIngredient(ingredient: Ingredient): Promise<NutrientTotals> {
  const totals: NutrientTotals = Object.fromEntries(
    nutrientKeys.map(k => [k, 0])
  ) as NutrientTotals;

  const query = `Return nutritional values for 100g of ${ingredient.product} as JSON with the following fields: ${nutrientKeys.join(", ")}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a USDA nutrition database AI. Respond only with JSON." },
      { role: "user", content: query }
    ],
    temperature: 0.2
  });

  const response = completion.choices[0].message.content ?? "";
  try {
    const jsonStart = response.indexOf("{");
    const jsonEnd = response.lastIndexOf("}") + 1;
    const clean = response.slice(jsonStart, jsonEnd);
    const data = JSON.parse(clean);

    for (const key of nutrientKeys) {
      const value = data[key];
      if (typeof value === "number") {
        totals[key] = parseFloat((value * ingredient.weight / 100).toFixed(1));
      }
    }
  } catch (err) {
    console.warn(`⚠️ Brak danych USDA dla: ${ingredient.product}`);
  }

  return totals;
}

async function applyMacros(plan: Record<string, Record<string, Meal>>): Promise<void> {
  for (const day of Object.keys(plan)) {
    for (const mealKey of Object.keys(plan[day])) {
      const meal = plan[day][mealKey];
      const ingredients = Array.isArray(meal.ingredients)
        ? meal.ingredients.filter(i => typeof i.product === 'string' && typeof i.weight === 'number')
        : [];

      const totals: NutrientTotals = Object.fromEntries(
        nutrientKeys.map(k => [k, 0])
      ) as NutrientTotals;

      for (const ing of ingredients) {
        const usda = await fetchUSDAForIngredient(ing);
        for (const key of nutrientKeys) {
          totals[key] += usda[key];
        }
      }

      meal.macros = totals;
    }
  }
}

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
    const enrichedPlan = JSON.parse(JSON.stringify(dietPlan));
    await applyMacros(enrichedPlan);

    const mergedRequirements = mergeRequirements([model, ...(conditions ?? [])]);
    const avg = calculateAverages(enrichedPlan);
    const violations: string[] = [];
    for (const [key, { min, max }] of Object.entries(mergedRequirements)) {
      const val = avg[key as NutrientKey];
      if (val != null) {
        if (val < min) violations.push(`⬇️ ${key}: ${val} < ${min}`);
        if (val > max) violations.push(`⬆️ ${key}: ${val} > ${max}`);
      }
    }

    if (violations.length > 0) {
      console.warn("📛 Naruszenia składników:", violations);
    }

    const prompt = `You are a clinical AI diet quality controller.\n\nAnalyze the following 7-day diet plan and return a corrected JSON if issues are found.\n\nPlan:\n${JSON.stringify(enrichedPlan, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a clinical diet quality controller for structured JSON plans." },
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

        await applyMacros(correctedStructured);

       const originalMeals: Meal[] = Object.values(enrichedPlan).flatMap(day =>
          Object.values(day as Record<string, Meal>)
        );
        const correctedMeals = Object.values(correctedStructured).flatMap(day => Object.values(day));

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
        console.warn("❌ Nie udało się sparsować poprawionego JSON od GPT:", e);
      }
    }

    return {
      type: "dietPlan",
      plan: convertStructuredToFlatPlan(enrichedPlan),
      violations
    };
  }
};