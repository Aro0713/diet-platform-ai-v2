import OpenAI from "openai";
import { Meal } from "@/types";
import { calculateMealMacros } from "@/utils/nutrition/calculateMealMacros";
import { validateDietWithModel } from "@/utils/validateDiet";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dqAgent = {
  run: async ({
    dietPlan,
    model,
    goal,
    cpm,
    weightKg
  }: {
    dietPlan: Record<string, Record<string, Meal>>; // ✅ poprawiony typ
    model: string;
    goal?: string;
    cpm?: number | null;
    weightKg?: number | null;
  }) => {
    const safeCpm = cpm ?? undefined;
    const safeWeight = weightKg ?? undefined;

    // 🔁 Uzupełnij brakujące makroskładniki
    const enrichedPlan: Record<string, Record<string, Meal>> = JSON.parse(JSON.stringify(dietPlan)); // deep clone
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
2. Verifying macronutrient structure per model:
   - ketogenic → high fat, low carb
   - high-protein → ≥25% protein
   - vegan → no animal products
   - low-carb → < 100g carbs/day
   - mediterranean → olive oil, fish, legumes, diversity
3. Detecting unrealistic nutrient gaps or excess
4. Checking consistent number of meals per day

Return one of the following:

✅ VALID — if all rules are met

⚠️ Issues found:
- List of specific problems (e.g. "Tuesday exceeds carbs limit for keto")

📋 CORRECTED_JSON:
- Return ONLY valid JSON, strictly wrapped in a "dietPlan" field, like:

{
  "dietPlan": {
    "Monday": {
      "Śniadanie": {
        "time": "07:30",
        "menu": "Owsianka z jabłkiem",
        "kcal": 400,
        "ingredients": [ { "product": "...", "weight": 100 } ],
        "macros": { "protein": 20, "fat": 10, "carbs": 40 }
      }
    }
  }
}

🚫 DO NOT include:
- markdown (e.g. \`\`\`json)
- ellipsis (...), comments (//), or Note:
- any explanation, continuation hints, or formatting outside the JSON object

⚠️ Return ONLY the JSON object.
⚠️ If unsure, omit uncertain values instead of guessing.

Here is the plan to analyze:
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
        const correctedPlan = parsed?.dietPlan as Record<string, Record<string, Meal>>;
        if (!correctedPlan) throw new Error("Brak dietPlan");

        // 🔍 Porównaj jakość
        const originalMeals: Meal[] = Object.values(enrichedPlan).flatMap(day => Object.values(day));
        const correctedMeals: Meal[] = Object.values(correctedPlan).flatMap(day => Object.values(day));

        const issuesOriginal = validateDietWithModel(originalMeals, model);
        const issuesCorrected = validateDietWithModel(correctedMeals, model);

        if (issuesCorrected.length < issuesOriginal.length) {
          console.log("✅ Zwrot poprawionej diety (mniej błędów):", issuesCorrected);
          return {
            type: "text",
            content: correctedJson
          };
        } else {
          console.log("ℹ️ Poprawiona dieta nie jest lepsza – zwracam oryginał.");
        }
      } catch (e) {
        console.warn("❌ Nie udało się sparsować poprawionego planu:", e);
      }
    }

    // Jeśli nie rozpoznano JSON lub dieta nie była lepsza → zwróć oryginał
    return {
      type: "text",
      content: JSON.stringify({ dietPlan: enrichedPlan }, null, 2)
    };
  }
};
