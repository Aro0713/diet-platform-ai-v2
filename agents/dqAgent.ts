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
// ── Ingredient rules: small, precise expansions ─────────────────────────────
function buildIngredientRules(dqChecks?: {
  avoidIngredients?: string[];
  recommendIngredients?: string[];
}) {
  const forbiddenBase = dqChecks?.avoidIngredients ?? [];
  const preferredBase = dqChecks?.recommendIngredients ?? [];

  const f = new Set<string>();
  for (const raw of forbiddenBase) {
    const k = String(raw).toLowerCase();
    if (k.includes("laktoz")) {
      ["mleko","mleko krowie","jogurt","kefir","ser","śmietana"].forEach(v => f.add(v));
    } else if (k.includes("soja")) {
      ["soja","tofu","tempeh","sos sojowy","mleko sojowe","edamame"].forEach(v => f.add(v));
    } else if (k.includes("orzechy ziemne") || k.includes("arachid") || k.includes("peanut")) {
      ["orzechy ziemne","masło orzechowe","olej arachidowy","peanut","peanut butter"].forEach(v => f.add(v));
    } else if (k.includes("krewetk") || k.includes("skorupiak")) {
      ["krewetki","skorupiaki","krab","homar","langustynki"].forEach(v => f.add(v));
    } else if (k.includes("gluten")) {
      ["pszenica","jęczmień","żyto","słód jęczmienny"].forEach(v => f.add(v));
    } else {
      f.add(String(raw));
    }
  }
  const preferred = Array.from(new Set(preferredBase.map(String)));
  return { forbidden: Array.from(f), preferred };
}

function findForbiddenHits(
  plan: Record<string, Record<string, Meal>>,
  forbidden: string[]
) {
  const hits: { day: string; mealKey: string; ingredient: string }[] = [];
  if (!forbidden.length) return hits;
  const fLow = forbidden.map(s => s.toLowerCase());

  for (const day of Object.keys(plan)) {
    const meals = plan[day];
    for (const mealKey of Object.keys(meals)) {
      const ings = (meals[mealKey]?.ingredients ?? []) as any[];
      for (const it of ings) {
        const name = String(it?.product ?? it?.name ?? "").toLowerCase();
        if (fLow.some(f => f && name.includes(f))) {
          hits.push({ day, mealKey, ingredient: String(it?.product ?? it?.name ?? "") });
        }
      }
    }
  }
  return hits;
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
  recommendIngredients?: string[];   // ← DODANE
  recommendMicros?: string[];
  recommendMacros?: string[];
  preferModels?: string[];
};

  }) => {
    
const { forbidden, preferred } = buildIngredientRules(dqChecks);

// ⛳ Szybka ścieżka: bez LLM tylko jeśli NIE ma zakazanych składników
if (process.env.USE_DQ_LLM !== "1") {
  const hits = findForbiddenHits(dietPlan, forbidden);
  if (hits.length === 0) {
    return {
      type: "dietPlan",
      plan: convertStructuredToFlatPlan(dietPlan),
      violations: []
    };
  }
  // są naruszenia → przechodzimy do ścieżki LLM z korektą
}


    const mergedRequirements = mergeRequirements([model, ...(conditions ?? [])]);
    // ── Lists from checks (generic; per-user) ─────────────────────────────────────
const forbiddenList = (dqChecks?.avoidIngredients ?? []).map(String);
const preferredList = (dqChecks?.recommendIngredients ?? []).map(String);

// ── Generic, role-based substitution policy (cuisine+model aware) ────────────
const substitutionPolicy = `
SUBSTITUTION POLICY (generic, applies to any user):
- If a forbidden item appears in any meal, REPLACE it with a safe alternative that plays the SAME CULINARY ROLE within the SAME CUISINE and DIET MODEL. Do not change meal times, meal count or cuisine.
- Prioritise items from the Preferred list when suitable.
- Keep calories and macros approximately unchanged (±5–10%), keep sodium low when required, keep GI low for diabetes/IR models.
- Examples by role (use only if that role is present in the meal):
  • Protein role → use lean poultry, white fish, eggs, or non-soy legumes that are NOT forbidden.
  • Dairy role → use lactose-free dairy OR plant-based alternatives (almond/oat/coconut/soy only if soy is not forbidden).
  • Grain role → use whole-grain options; if gluten is forbidden, use gluten-free grains (rice, buckwheat, corn, quinoa).
  • Shellfish role → replace with white fish or poultry.
  • Soy role → replace with non-soy legumes or lactose-free/plant dairy.
  • Nut/seed role → use non-forbidden nuts; if all nuts are forbidden, use seeds (sunflower, pumpkin, chia), fruit, or granola (non-forbidden).
  • Sauce/condiment role → replace high-sodium or forbidden bases with herb, citrus, tomato, yogurt (lactose-free/plant) or tahini (if sesame allowed).
- Never introduce new allergens or items from the Forbidden list. Do not switch cuisine or model.
`;

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
${forbidden.length ? `Strictly avoid the following ingredients: ${forbidden.join(", ")}` : ""}

STRICT FOOD CONSTRAINTS:
- Forbidden ingredients (never allowed): ${forbidden.join(", ") || "none"}.
- Preferred ingredients (use when appropriate): ${preferred.join(", ") || "none"}.
${substitutionPolicy}

- When a forbidden item is present, REPLACE it with a safe alternative of similar culinary role:
  • lactose dairy → lactose-free dairy or plant milk,
  • soy products → non-soy legumes or dairy-free options,
  • peanuts/peanut butter → seeds or nut butters (if tree nuts are allowed),
  • shrimps/shellfish → white fish or poultry.
- Do not change the cuisine or diet model context while fixing.

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

    for (const day of Object.keys(correctedStructured)) {
      const mealsForDay = correctedStructured[day];
      for (const mealKey of Object.keys(mealsForDay)) {
        const meal = mealsForDay[mealKey];
        mealsForDay[mealKey] = {
          ...meal,
          ingredients: normalizeIngredients(meal.ingredients)
        };
      }
    }

    const hasAnyMacros = Object.values(correctedStructured)
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
