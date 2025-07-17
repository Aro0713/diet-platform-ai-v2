import OpenAI from "openai";
import { Meal } from "@/types";
import { calculateMealMacros } from "@/utils/nutrition/calculateMealMacros";
import { validateDietWithModel } from "@/utils/validateDiet";

const dietModelMap: Record<string, {
  macros: { protein: string; fat: string; carbs: string };
  notes?: string[];
}> = {
  "ketogenic": {
    macros: { protein: "15–25%", fat: "70–80%", carbs: "5–10%" }
  },
  "high protein": {
    macros: { protein: "25–35%", fat: "25–35%", carbs: "30–45%" }
  },
  "vegan": {
    macros: { protein: "15–20%", fat: "25–35%", carbs: "45–60%" }
  },
  "low carb": {
    macros: { protein: "25–35%", fat: "40–60%", carbs: "10–30%" }
  },
  "mediterranean": {
    macros: { protein: "15–20%", fat: "30–40%", carbs: "40–55%" }
  },
  "gluten free": {
    macros: { protein: "15–20%", fat: "30–40%", carbs: "40–55%" }
  },
  "fodmap": {
    macros: { protein: "20–25%", fat: "30–35%", carbs: "40–50%" },
    notes: ["Use only Low FODMAP ingredients"]
  },
  "renal": {
    macros: { protein: "10–12%", fat: "30–35%", carbs: "50–60%" }
  },
  "liver": {
    macros: { protein: "15–20%", fat: "20–30%", carbs: "50–60%" }
  },
  "anti-inflammatory": {
    macros: { protein: "15–25%", fat: "30–40%", carbs: "35–50%" }
  },
  "low fat": {
    macros: { protein: "15–25%", fat: "15–25%", carbs: "50–65%" }
  },
  "low sugar": {
    macros: { protein: "20–30%", fat: "30–40%", carbs: "35–50%" }
  },
  "diabetes": {
    macros: { protein: "15–20%", fat: "25–35%", carbs: "40–50%" },
    notes: ["Use low glycemic index"]
  },
  "insulin resistance": {
    macros: { protein: "20–30%", fat: "30–40%", carbs: "30–40%" }
  },
  "hypertension": {
    macros: { protein: "15–20%", fat: "25–35%", carbs: "45–55%" }
  }
  // możesz uzupełnić więcej modeli w razie potrzeby
};

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
    const modelKey = model?.toLowerCase()?.trim() || "";
      const modelDefinition = dietModelMap[modelKey];
      const macroInfo = modelDefinition?.macros
        ? Object.entries(modelDefinition.macros)
            .map(([k, v]) => `- ${k}: ${v}`).join('\n')
        : "No macro data available.";

      const notesInfo = modelDefinition?.notes?.join('\n') || "";
      const modelDetails = `

      📊 Diet Model Expected Structure (${model}):
      ${macroInfo}
      ${notesInfo ? `\n📝 Notes:\n${notesInfo}` : ""}
      `;
      // 🔒 Walidacja diety eliminacyjnej bez wywiadu
if (modelKey === 'dieta eliminacyjna') {
  const totalMeals = Object.values(dietPlan).flatMap(day => Object.values(day));
  const riskyIngredients = ["nabiał", "jaja", "gluten", "soja", "orzech", "migdał", "krewetki", "łosoś", "tuńczyk", "owoc morza"];

  const hasPotentialAllergens = totalMeals.some(meal =>
    meal.ingredients?.some(ing =>
      riskyIngredients.some(allergen =>
        ing.product.toLowerCase().includes(allergen)
      )
    )
  );

  if (hasPotentialAllergens) {
    return {
      type: "text",
      content: "⚠️ Cannot validate elimination diet: potential allergens detected and no interview data provided."
    };
  }
}

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

${modelDetails}

Analyze the plan by:
1. Checking total daily and weekly kcal vs CPM (±10% acceptable)
2. Verifying macronutrient structure per model
3. Detecting unrealistic nutrient gaps or excess
4. Checking consistent number of meals per day

Return one of the following:
...


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
