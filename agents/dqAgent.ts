import OpenAI from "openai";
import { Meal } from "@/types";
import { calculateMealMacros } from "@/utils/nutrition/calculateMealMacros";
import { validateDietWithModel } from "@/utils/validateDiet";

// Uproszczony helper do konwersji struktury
function convertStructuredToFlatPlan(
  structuredPlan: Record<string, Record<string, Meal>>
): Record<string, Meal[]> {
  const flat: Record<string, Meal[]> = {};
  for (const day in structuredPlan) {
    flat[day] = Object.values(structuredPlan[day]);
  }
  return flat;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dqAgent = {
  run: async ({
    dietPlan,
    model,
    goal,
    cpm,
    weightKg
  }: {
    dietPlan: Record<string, Record<string, Meal>>;
    model: string;
    goal?: string;
    cpm?: number | null;
    weightKg?: number | null;
  }) => {
    const safeCpm = cpm ?? undefined;
    const safeWeight = weightKg ?? undefined;

    // 🔁 Uzupełnij brakujące makroskładniki
    const enrichedPlan: Record<string, Record<string, Meal>> = JSON.parse(JSON.stringify(dietPlan));
    for (const day of Object.keys(enrichedPlan)) {
      const meals = enrichedPlan[day];
      for (const mealKey of Object.keys(meals)) {
        const meal = meals[mealKey];
        if (!meal.macros || Object.keys(meal.macros).length === 0) {
          meal.macros = calculateMealMacros(meal.ingredients);
        }
      }
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
2. Verifying macronutrient structure per model
3. Detecting unrealistic nutrient gaps or excess
4. Checking consistent number of meals per day

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

    // 🔎 Spróbuj sparsować poprawiony plan
    if (clean.includes("CORRECTED_JSON")) {
      const startIndex = clean.indexOf("{");
      const correctedJson = clean.slice(startIndex).trim();

      try {
        const parsed = JSON.parse(correctedJson);
        const correctedStructured = parsed?.dietPlan as Record<string, Record<string, Meal>>;
        if (!correctedStructured) throw new Error("Brak dietPlan");

        const originalMeals: Meal[] = Object.values(enrichedPlan).flatMap(day => Object.values(day));
        const correctedMeals: Meal[] = Object.values(correctedStructured).flatMap(day => Object.values(day));

        const issuesOriginal = validateDietWithModel(originalMeals, model);
        const issuesCorrected = validateDietWithModel(correctedMeals, model);

        if (issuesCorrected.length < issuesOriginal.length) {
          console.log("✅ Ulepszony plan wybrany przez dqAgent:", issuesCorrected);
          return {
            type: "dietPlan",
            plan: convertStructuredToFlatPlan(correctedStructured)
          };
        }
      } catch (e) {
        console.warn("❌ Nie udało się sparsować JSON:", e);
      }
    }

    // Jeśli nie było poprawki lub poprawka gorsza → zwróć oryginał
    return {
      type: "dietPlan",
      plan: convertStructuredToFlatPlan(enrichedPlan)
    };
  }
};
