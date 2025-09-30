import OpenAI from "openai";
import { Meal } from "@/types";
import { validateDietWithModel } from "@/utils/validateDiet";
import { nutrientRequirementsMap, type NutrientRequirements } from "@/utils/nutrientRequirementsMap";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MEAL_KEYS = [
  "breakfast","second_breakfast","lunch","afternoon_snack","dinner","snack"
];

function toKeyedMeals(dayValue: any): Record<string, Meal> {
  if (Array.isArray(dayValue)) {
    const entries = dayValue.map((m, idx) => [MEAL_KEYS[idx] ?? `meal_${idx+1}`, m]);
    return Object.fromEntries(entries) as Record<string, Meal>;
  }
  return dayValue as Record<string, Meal>;
}

function normalizeIngredients(ingredients: any[]) {
  return (ingredients || []).map(i => ({
    product: i.product ?? i.name ?? "",
    weight: i.weight ?? i.quantity ?? null,
    unit: i.unit || "g"
  }));
}

function normalizeStructuredPlan(plan: Record<string, any>): Record<string, Record<string, Meal>> {
  const out: Record<string, Record<string, Meal>> = {};
  for (const day of Object.keys(plan)) {
    const keyed = toKeyedMeals(plan[day]);
    const meals: Record<string, Meal> = {};
    for (const k of Object.keys(keyed)) {
      const meal = keyed[k] as Meal;
      meals[k] = { ...meal, ingredients: normalizeIngredients((meal as any)?.ingredients) };
    }
    out[day] = meals;
  }
  return out;
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
    conditions,
    dqChecks
  }: {
    dietPlan: Record<string, Record<string, Meal>>;
    model: string;
    goal?: string;
    cpm?: number | null;
    weightKg?: number | null;
    conditions?: string[];
    dqChecks?: {
      avoidMacros?: string[];
      avoidMicros?: string[];
      avoidIngredients?: string[];
      recommendMicros?: string[];
      recommendMacros?: string[];
      preferModels?: string[];
    };
  }) => {
    
// ⛳ Szybka ścieżka: bez LLM zwróć znormalizowany structured plan (panel-ready)
if (process.env.USE_DQ_LLM !== "1") {
  return {
    type: "dietPlan",
    plan: normalizeStructuredPlan(dietPlan),
    violations: []
  };
}

    const mergedRequirements = mergeRequirements([model, ...(conditions ?? [])]);
 const prompt = `You are a clinical dietitian AI and diet quality controller.

Evaluate the following 7-day diet plan for a patient with the following clinical conditions:
${conditions?.join(", ") || "no medical conditions"}

Their goal is: ${goal || "not specified"}.
Their CPM is: ${cpm || "not specified"}.
Their weight is: ${weightKg || "not specified"}.

You must respect clinical constraints from the following merged requirements:
${JSON.stringify(mergedRequirements, null, 2)}

${dqChecks?.avoidMacros?.length ? `Avoid these macronutrient profiles: ${dqChecks.avoidMacros.join(", ")}` : ""}
${dqChecks?.avoidMicros?.length ? `Avoid these micronutrients: ${dqChecks.avoidMicros.join(", ")}` : ""}
${dqChecks?.recommendMicros?.length ? `Prefer these micronutrients: ${dqChecks.recommendMicros.join(", ")}` : ""}
${dqChecks?.recommendMacros?.length ? `Prefer macronutrient profiles: ${dqChecks.recommendMacros.join(", ")}` : ""}
${dqChecks?.avoidIngredients?.length ? `Strictly avoid the following ingredients: ${dqChecks.avoidIngredients.join(", ")}` : ""}

You already know the nutritional value of standard foods (e.g. chicken, broccoli, oats, olive oil, etc.). You do NOT need to ask any database.

Your task:
- Check if the diet is realistic and nutritionally balanced
- Ensure macro and micronutrients (including vitamins) are present for every meal
- If "macros" object is missing or contains only zeros, recalculate and insert accurate values
- Each "macros" field (e.g., kcal, protein, vitaminD) must reflect the known nutrition of ingredients and their weights

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
    console.warn("📥 GPT response (raw):", clean);

if (clean.includes("CORRECTED_JSON")) {
  const startIndex = clean.indexOf("{");
  const correctedJson = clean.slice(startIndex).trim();
  try {
    const parsed = JSON.parse(correctedJson);

    let correctedStructured: Record<string, Record<string, Meal>> | null = null;

    if (parsed?.dietPlan) {
      correctedStructured = parsed.dietPlan;
    } else if (parsed?.CORRECTED_JSON?.dietPlan) {
      correctedStructured = parsed.CORRECTED_JSON.dietPlan;
    } else if (parsed?.CORRECTED_JSON) {
      correctedStructured = parsed.CORRECTED_JSON;
    } else if (
      parsed &&
      Object.keys(parsed).some(day => typeof parsed[day] === 'object')
    ) {
      correctedStructured = parsed as Record<string, Record<string, Meal>>;
    }

    if (!correctedStructured || typeof correctedStructured !== 'object') {
      console.warn("❌ GPT odpowiedź nie zawiera dietPlan:", parsed);
      throw new Error("Brak dietPlan");
    }
    // 🔹 Normalizacja składników — quantity → weight, name → product
    function normalizeIngredients(ingredients: any[]) {
      return (ingredients || []).map(i => ({
        product: i.product ?? i.name ?? "",
        weight: i.weight ?? i.quantity ?? null,
        unit: i.unit || "g"
      }));
    }

const normalizedCorrected = normalizeStructuredPlan(correctedStructured);

const hasAnyMacros = Object.values(normalizedCorrected)
  .flatMap(day => Object.values(day))
  .some(meal =>
    meal.macros &&
    Object.values(meal.macros).some(v => typeof v === 'number' && v > 0)
  );

if (!hasAnyMacros) {
  console.warn("❌ GPT zwrócił dietę bez wartości odżywczych (macros all 0)");
  throw new Error("Poprawiona dieta nie zawiera makroskładników");
}

const originalMeals: Meal[] = Object.values(dietPlan).flatMap(day => Object.values(day));
const correctedMeals: Meal[] = Object.values(normalizedCorrected).flatMap(day => Object.values(day));

const issuesOriginal = validateDietWithModel(originalMeals, model);
const issuesCorrected = validateDietWithModel(correctedMeals, model);

if (issuesCorrected.length < issuesOriginal.length) {
  return {
    type: "dietPlan",
    plan: normalizedCorrected,
    violations: []
  };
}

  } catch (e) {
    console.warn("❌ Nie udało się sparsować poprawionego JSON od GPT:", e);
  }
}

    // jeśli nie udało się poprawić lub wynik jest gorszy → wróć do wejściowego structured
return {
  type: "dietPlan",
  plan: normalizeStructuredPlan(dietPlan),
  violations: []
};

  }
};
