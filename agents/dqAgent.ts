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
      ["mleko","mleko krowie","jogurt","kefir","ser","śmietana","maślanka","serwatka"]
        .forEach(v => f.add(v));
    } else if (k.includes("soja")) {
      ["soja","tofu","tempeh","sos sojowy","tamari","miso","mleko sojowe","edamame",
       "izolat białka sojowego","lecytyna sojowa"].forEach(v => f.add(v));
    } else if (k.includes("orzechy ziemne") || k.includes("arachid") || k.includes("peanut")) {
      ["orzechy ziemne","masło orzechowe","olej arachidowy","peanut","peanut butter"]
        .forEach(v => f.add(v));
    } else if (k.includes("krewetk") || k.includes("skorupiak")) {
      ["krewetki","skorupiaki","krab","homar","langustynki"].forEach(v => f.add(v));
    } else if (k.includes("gluten")) {
      ["pszenica","jęczmień","żyto","słód jęczmienny"].forEach(v => f.add(v));
    } else if (k.includes("broku")) {
      ["brokuł","brokuły"].forEach(v => f.add(v)); // awersja
    } else if (k.includes("butterfish") || k.includes("ryba maślana") || k.includes("escolar") || k.includes("oilfish")) {
      ["ryba maślana","butterfish","escolar","oilfish"].forEach(v => f.add(v));
    } else {
      f.add(String(raw));
    }
  }
  const preferred = Array.from(new Set(preferredBase.map(String)));
  return { forbidden: Array.from(f), preferred };
}
type Violation = { code: string; severity: "error"|"warn"; day: string; mealKey?: string; detail: string };

function mval(meal: any, keys: string[]): number {
  const m = meal?.macros ?? {};
  for (const k of keys) if (typeof m[k] === "number") return m[k];
  return 0;
}

const K = {
  kcal:      ["kcal","calories"],
  protein:   ["protein","protein_g"],
  fat:       ["fat","fat_g"],
  carbs:     ["carbs","carbohydrates","carbs_g","carbohydrates_g"],
  fiber:     ["fiber","fiber_g"],
  sodium:    ["sodium_mg","sodium","na_mg"],
  potassium: ["potassium_mg","potassium","k_mg"]
};

function sumDayMacros(dayMeals: Record<string, Meal>) {
  const t = { kcal:0, protein:0, fat:0, carbs:0, fiber:0, sodium:0, potassium:0 };
  for (const mk of Object.keys(dayMeals)) {
    const meal = (dayMeals as any)[mk];
    t.kcal      += mval(meal, K.kcal);
    t.protein   += mval(meal, K.protein);
    t.fat       += mval(meal, K.fat);
    t.carbs     += mval(meal, K.carbs);
    t.fiber     += mval(meal, K.fiber);
    t.sodium    += mval(meal, K.sodium);
    t.potassium += mval(meal, K.potassium);
  }
  return t;
}
function parseHHMM(s?: string): number | null {
  if (!s || typeof s !== "string") return null;
  const m = s.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function checkMealTimes(meals: Record<string, any>, expected: string[], toleranceMin = 60): string[] {
  const issues: string[] = [];
  const actual = Object.values(meals)
    .map((m: any) => parseHHMM(m?.time))
    .filter((t: number|null): t is number => t !== null)
    .sort((a,b) => a-b);

  const exp = (expected || []).map(parseHHMM).filter((x): x is number => x !== null).sort((a,b)=>a-b);
  if (!exp.length || !actual.length) return issues;

  if (actual.length !== exp.length) {
    issues.push(`czasy posiłków: ${actual.length} ≠ oczekiwane ${exp.length}`);
    return issues;
  }
  for (let i=0;i<exp.length;i++) {
    if (Math.abs(actual[i]-exp[i]) > toleranceMin) {
      issues.push(`posiłek #${i+1} poza oknem ±${toleranceMin} min`);
    }
  }
  return issues;
}
function computeStaticViolations(
  plan: Record<string, Record<string, Meal>>,
  opts: {
    expectedMealsPerDay?: number;
    expectedMealTimes?: string[];
    insulinResistance?: boolean;
    sodiumMax?: number;
    potassiumMin?: number;
    fiberMin?: number;
    proteinRange?: { min:number; max:number } | null;
    carbsCaps?: [number,number,number,number] | null; // per posiłek
  }
): Violation[] {
  const v: Violation[] = [];

  for (const day of Object.keys(plan)) {
    const meals = plan[day];

    if (opts.expectedMealsPerDay && Object.keys(meals).length !== opts.expectedMealsPerDay) {
      v.push({ code:"MEALS_COUNT", severity:"warn", day, detail:`${Object.keys(meals).length} pos./d vs oczekiwane ${opts.expectedMealsPerDay}` });
    }

    (checkMealTimes(meals as any, opts.expectedMealTimes ?? [], 60))
      .forEach(msg => v.push({ code:"MEAL_TIME", severity:"warn", day, detail: msg }));

    if (opts.carbsCaps) {
      const sorted = Object.entries(meals).sort((a,b)=>{
        const ta = parseHHMM((a[1] as any)?.time) ?? 0;
        const tb = parseHHMM((b[1] as any)?.time) ?? 0;
        return ta - tb;
      });
      sorted.forEach(([mealKey, meal], i) => {
        const cap = opts.carbsCaps![Math.min(i, opts.carbsCaps!.length-1)];
        const carbs = mval(meal, K.carbs);
        if (cap && carbs > cap) {
          v.push({ code:"MEAL_CARBS_CAP", severity:"warn", day, mealKey, detail:`${carbs} g > cap ${cap} g` });
        }
      });
    }

    const t = sumDayMacros(meals);
    if (opts.fiberMin && t.fiber < opts.fiberMin) {
      v.push({ code:"FIBER_LOW", severity:"warn", day, detail:`błonnik ${t.fiber} g < ${opts.fiberMin} g` });
    }
    if (opts.sodiumMax && t.sodium > opts.sodiumMax) {
      v.push({ code:"SODIUM_HIGH", severity:"error", day, detail:`sód ${Math.round(t.sodium)} mg > ${opts.sodiumMax} mg` });
    }
    if (opts.potassiumMin && t.potassium && t.potassium < opts.potassiumMin) {
      v.push({ code:"POTASSIUM_LOW", severity:"warn", day, detail:`potas ${Math.round(t.potassium)} mg < ${opts.potassiumMin} mg` });
    }
    if (opts.proteinRange) {
      if (t.protein < opts.proteinRange.min || t.protein > opts.proteinRange.max) {
        v.push({ code:"PROTEIN_RANGE", severity:"warn", day, detail:`białko ${Math.round(t.protein)} g poza ${opts.proteinRange.min}-${opts.proteinRange.max} g` });
      }
    }
  }
  return v;
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
    dqChecks,
    interviewData,
    medicalData
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
      recommendIngredients?: string[];
      recommendMicros?: string[];
      recommendMacros?: string[];
      preferModels?: string[];
    };
    interviewData?: any; // allergies,intolerances,dislikes,likes,mealTimes,mealsPerDay
    medicalData?: any;   // allergies,intolerances,diagnoses,labs
  }): Promise<{
    type: "dietPlan";
    plan: Record<string, Meal[]>;
    violations: Array<{ code: string; severity: "error" | "warn"; day: string; mealKey?: string; detail: string }>;
  }> => {

    
// 0) Zbierz ograniczenia z wywiadu/medycznych i scal z dqChecks
const derivedForbidden: string[] = [];
const derivedPreferred: string[] = [];
if (interviewData?.allergies)     derivedForbidden.push(...[].concat(interviewData.allergies));
if (interviewData?.intolerances)  derivedForbidden.push(...[].concat(interviewData.intolerances));
if (interviewData?.dislikes)      derivedForbidden.push(...[].concat(interviewData.dislikes));
if (interviewData?.likes)         derivedPreferred.push(...[].concat(interviewData.likes));
if (medicalData?.allergies)       derivedForbidden.push(...[].concat(medicalData.allergies));
if (medicalData?.intolerances)    derivedForbidden.push(...[].concat(medicalData.intolerances));

const mergedDQ = {
  avoidIngredients: [...(dqChecks?.avoidIngredients ?? []), ...derivedForbidden],
  recommendIngredients: [...(dqChecks?.recommendIngredients ?? []), ...derivedPreferred],
};
const { forbidden, preferred } = buildIngredientRules(mergedDQ);

// 1) Parametry walidacji klinicznej
const expectedMealsPerDay = interviewData?.mealsPerDay ?? 4;
const expectedMealTimes: string[] = Array.isArray(interviewData?.mealTimes)
  ? interviewData.mealTimes
  : ["07:00","12:00","16:00","19:00"];
const insulinResistance = (conditions ?? []).some(c => /insulin|diabet/i.test(String(c)));
const sodiumMax = 1800;           // HTN/udar
const potassiumMin = 3500;
const fiberMin = 30;
const proteinRange = weightKg
  ? { min: Math.round(weightKg*1.2), max: Math.round(weightKg*1.6) }
  : { min: 100, max: 130 };
const carbsCaps: [number,number,number,number] | null = insulinResistance ? [45,40,40,40] : null;

// 2) Walidacja statyczna – zawsze
const staticViolations = computeStaticViolations(dietPlan, {
  expectedMealsPerDay, expectedMealTimes, insulinResistance,
  sodiumMax, potassiumMin, fiberMin, proteinRange, carbsCaps
});

// 3) Twarde naruszenia składników + brak makr?
const forbiddenHits = findForbiddenHits(dietPlan, forbidden);
const macrosMissing = Object.values(dietPlan).flatMap(d=>Object.values(d))
  .some((m:any)=>!m?.macros || Object.values(m.macros).every((x:any)=>!x || Number(x)===0));

// 4) Szybka ścieżka: bez LLM jeśli brak krytyków i mamy makra
if (process.env.USE_DQ_LLM !== "1" && forbiddenHits.length === 0 && !macrosMissing) {
  return {
    type: "dietPlan",
    plan: convertStructuredToFlatPlan(dietPlan),
    violations: staticViolations
  };
}

    const mergedRequirements = mergeRequirements([model, ...(conditions ?? [])]);

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

const hasAnyMacros = Object.values(correctedStructured as Record<string, Record<string, Meal>>)
  .flatMap(day => Object.values(day))
  .some((meal: any) =>
    meal?.macros && Object.values(meal.macros).some((v: any) => typeof v === "number" && v > 0)
  );

if (!hasAnyMacros) {
  console.warn("❌ GPT zwrócił dietę bez wartości odżywczych (macros all 0)");
  throw new Error("Poprawiona dieta nie zawiera makroskładników");
}

// porównanie naruszeń statycznych
const vBefore = staticViolations.length;
const vAfter = computeStaticViolations(correctedStructured as Record<string, Record<string, Meal>>, {
  expectedMealsPerDay, expectedMealTimes, insulinResistance,
  sodiumMax, potassiumMin, fiberMin, proteinRange, carbsCaps
}).length;

// tie-breaker: stary walidator modelowy
const originalMeals: Meal[] = Object.values(dietPlan).flatMap(day => Object.values(day));
const correctedMeals: Meal[] = Object.values(correctedStructured as Record<string, Record<string, Meal>>).flatMap(day => Object.values(day));
const issuesOriginal = validateDietWithModel(originalMeals, model).length;
const issuesCorrected = validateDietWithModel(correctedMeals, model).length;

if (vAfter < vBefore || issuesCorrected < issuesOriginal) {
  return {
    type: "dietPlan",
    plan: convertStructuredToFlatPlan(correctedStructured as Record<string, Record<string, Meal>>),
    violations: computeStaticViolations(correctedStructured as Record<string, Record<string, Meal>>, {
      expectedMealsPerDay, expectedMealTimes, insulinResistance,
      sodiumMax, potassiumMin, fiberMin, proteinRange, carbsCaps
    })
  };
}

  } catch (e) {
    console.warn("❌ Nie udało się sparsować poprawionego JSON od GPT:", e);
  }
}
return {
  type: "dietPlan",
  plan: convertStructuredToFlatPlan(dietPlan),
  violations: staticViolations
};

  }
};
