import OpenAI from "openai";
import { Meal } from "@/types";
import { validateDietWithModel } from "@/utils/validateDiet";
import { nutrientRequirementsMap, type NutrientRequirements } from "@/utils/nutrientRequirementsMap";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function convertStructuredToFlatPlan(
  structuredPlan: Record<string, Record<string, Meal>>
): Record<string, Meal[]> {
  const flat: Record<string, Meal[]> = {};
  for (const day in structuredPlan) {
    flat[day] = Object.values(structuredPlan[day]);
  }
  return flat;
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
    const mergedRequirements = mergeRequirements([model, ...(conditions ?? [])]);
    const prompt = `You are a clinical dietitian AI and diet quality controller.

Evaluate the following 7-day diet plan.

You already know the nutritional value of standard foods (e.g. chicken, broccoli, oats, olive oil, etc.). You do NOT need to ask any database.

Your task:
- Check if the diet is realistic and nutritionally balanced
- Ensure macro and micronutrients (including vitamins) are within healthy ranges
- If any part is unrealistic, nutritionally incorrect, or missing macros – correct the plan and return updated JSON
- Always fill in the "macros" object for each meal with realistic, scientifically accurate values based on known nutritional content
- All values must be calculated based on ingredient weight and known composition (do not guess or invent values)

DO NOT explain anything. Return only:
- Original JSON if valid
- OR CORRECTED_JSON = { ... } if you modified it

Plan:
${JSON.stringify(dietPlan, null, 2)}`;

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

        const originalMeals: Meal[] = Object.values(dietPlan).flatMap(day => Object.values(day));
        const correctedMeals: Meal[] = Object.values(correctedStructured).flatMap(day => Object.values(day));

        const issuesOriginal = validateDietWithModel(originalMeals, model);
        const issuesCorrected = validateDietWithModel(correctedMeals, model);

        if (issuesCorrected.length < issuesOriginal.length) {
          console.log("✅ Ulepszony plan wybrany przez dqAgent:", issuesCorrected);
          return {
            type: "dietPlan",
            plan: convertStructuredToFlatPlan(correctedStructured),
            violations: []
          };
        }
      } catch (e) {
        console.warn("❌ Nie udało się sparsować poprawionego JSON od GPT:", e);
      }
    }

    return {
      type: "dietPlan",
      plan: convertStructuredToFlatPlan(dietPlan),
      violations: []
    };
  }
};