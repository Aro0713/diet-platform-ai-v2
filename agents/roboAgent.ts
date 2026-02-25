// agents/roboAgent.ts
import { Agent, run } from "@openai/agents";

/**
 * Cobbo profile v0 — na podstawie danych producenta:
 * - temp 30–140°C co 5°C
 * - speed level 1..10, level10 ~5500 RPM ±10%
 * - ramp do target speed: 6s
 * - przy temp >= 60°C -> max speed level 4
 * - temp wymaga czasu
 * - pojemność robocza 2.0L (nominal 3.2L)
 */
export const cobboProfileV0 = {
  model: "cobbo-tuya-v0",
  temperature: { minC: 30, maxC: 140, stepC: 5 },
  speed: {
    minLevel: 1,
    maxLevel: 10,
    maxRpmAtLevel10: 5500,
    rpmTolerancePct: 10,
    rampToTargetSec: 6,
    direction: "cw" as const,
    constraints: [{ ifTempGteC: 60, maxLevel: 4 }]
  },
  time: {
    stepSec: 1,
    manualMaxMin: 60,
    recipeMaxHours: 24,
    requiresTimeIfTemp: true
  },
  bowl: { nominalL: 3.2, workingL: 2.0 },
  heatControl: { mode: "continuous_to_target_then_pulse_hold" as const },
  safety: { requiresLid: true }
} as const;

type CobboProfile = typeof cobboProfileV0;

export type DietMeal = {
  mealName?: string;
  time?: string;
  ingredients?: Array<{
    product?: string;
    name?: string;
    weight?: number;
    quantity?: number;
    unit?: string;
  }>;
  macros?: unknown;
};

export type DietPlan = Record<string, Record<string, DietMeal>>;

export type RoboStep =
  | { kind: "add"; text: string }
  | { kind: "manual"; text: string }
  | { kind: "wait"; timeSec: number; note?: string }
  | {
      kind: "run";
      timeSec: number;
      tempC?: number | null;
      speedLevel?: number | null;
      mode?: string | null; // e.g. "blend", "cook", "knead", "mix"
      note?: string;
    };

export type RoboIngredient = { name: string; amount: number; unit: "g" | "ml" | "pcs" };

export type RoboRecipe = {
  day: string;
  meal: string; // zachowujemy mealKey z dietPlan (nie wymuszamy tu kanonu)
  meal_label?: string;
  title: string;
  time?: string;
  ingredients: RoboIngredient[];
  instructions: string[]; // “dla człowieka”
  robotSteps: RoboStep[]; // “dla robota”
  cookSteps: string[]; // emitter w stylu XLSX (cookStep_1..N)
  warnings?: string[];
  profile?: { model: string };
};

type GenerateRoboInput = {
  lang?: string;
  cuisine?: string;
  modelKey?: string;
  goal?: string;
  dietPlan: DietPlan;
  forbiddenIngredients?: string[];
  preferredIngredients?: string[];
  profile?: CobboProfile;
  modelHint?: "fast" | "quality";
};

function optString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function optNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function tryParseJsonLoose(text: string): unknown | null {
  if (!text) return null;
  const noBom = text.replace(/^\uFEFF/, "");
  const noFences = noBom.replace(/```(?:json)?|```/gi, "").trim();

  try {
    return JSON.parse(noFences) as unknown;
  } catch {}

  const first = noFences.indexOf("{");
  const last = noFences.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const candidate = noFences.slice(first, last + 1);
    try {
      return JSON.parse(candidate) as unknown;
    } catch {}
  }
  return null;
}

/** -------------------- DietPlan → minimal meals -------------------- **/
function normalizeDietIngredient(i: unknown): RoboIngredient | null {
  if (!i || typeof i !== "object") return null;
  const obj = i as Record<string, unknown>;

  const nameRaw = String(obj.product ?? obj.name ?? "").trim();
  if (!nameRaw) return null;

  const amount = optNumber(obj.weight ?? obj.quantity);
  if (!amount || amount <= 0) return null;

  const unitRaw = String(obj.unit ?? "g").toLowerCase().trim();
  const unit: "g" | "ml" | "pcs" =
    unitRaw === "ml" ? "ml" :
    unitRaw === "pcs" || unitRaw === "pc" || unitRaw.startsWith("szt") ? "pcs" :
    "g";

  return { name: nameRaw, amount: Math.round(amount), unit };
}

type FlatMeal = {
  day: string;
  mealKey: string;
  mealName?: string;
  time?: string;
  ingredients: RoboIngredient[];
};

function flattenDietPlan(dietPlan: DietPlan): FlatMeal[] {
  const out: FlatMeal[] = [];
  if (!dietPlan || typeof dietPlan !== "object") return out;

  for (const [day, meals] of Object.entries(dietPlan)) {
    if (!meals || typeof meals !== "object") continue;

    for (const [mealKey, m] of Object.entries(meals)) {
      if (!m || typeof m !== "object") continue;

      const ingredients = Array.isArray(m.ingredients)
        ? (m.ingredients
            .map((x: unknown) => normalizeDietIngredient(x))
            .filter((x): x is RoboIngredient => Boolean(x)))
        : [];

      if (!ingredients.length) continue;

      out.push({
        day: String(day).trim(),
        mealKey: String(mealKey).trim(),
        mealName: optString(m.mealName) ?? undefined,
        time: optString(m.time) ?? undefined,
        ingredients
      });
    }
  }
  return out;
}

/** -------------------- Constraints -------------------- **/
function clampToStep(v: number, min: number, max: number, step: number): number {
  const clamped = Math.min(Math.max(v, min), max);
  const snapped = Math.round((clamped - min) / step) * step + min;
  return Math.min(Math.max(snapped, min), max);
}

function applyCobboConstraints(steps: RoboStep[], profile: CobboProfile): { steps: RoboStep[]; warnings: string[] } {
  const warnings: string[] = [];
  const out: RoboStep[] = [];

  const tMin = profile.temperature.minC;
  const tMax = profile.temperature.maxC;
  const tStep = profile.temperature.stepC;

  const sMin = profile.speed.minLevel;
  const sMax = profile.speed.maxLevel;

  for (const s of steps || []) {
    if (!s || typeof s !== "object") continue;

    if (s.kind !== "run") {
      if (s.kind === "wait") {
        const ts = Math.max(1, Math.round(optNumber(s.timeSec) ?? 0));
        out.push({ ...s, timeSec: ts });
      } else {
        out.push(s);
      }
      continue;
    }

    let timeSec = Math.round(optNumber(s.timeSec) ?? 0);
    if (!Number.isFinite(timeSec) || timeSec <= 0) timeSec = 30; // safe fallback

    let tempC: number | null = s.tempC == null ? null : Number(s.tempC);
    tempC = tempC == null ? null : clampToStep(tempC, tMin, tMax, tStep);

    let speedLevel: number | null = s.speedLevel == null ? null : Number(s.speedLevel);
    speedLevel = speedLevel == null ? null : Math.round(Math.min(Math.max(speedLevel, sMin), sMax));

    if (profile.time.requiresTimeIfTemp && tempC != null && timeSec <= 0) {
      timeSec = 30;
      warnings.push("Cobbo: temp requires time; timeSec auto-set to 30s.");
    }

    if (tempC != null && tempC >= 60 && speedLevel != null) {
      const limit = profile.speed.constraints.find(c => c.ifTempGteC <= tempC)?.maxLevel ?? null;
      if (limit != null && speedLevel > limit) {
        warnings.push(`Cobbo: speed limited to level ${limit} at temp >= 60°C (requested ${speedLevel}).`);
        speedLevel = limit;
      }
    }

    out.push({
      kind: "run",
      timeSec,
      tempC,
      speedLevel,
      mode: optString(s.mode) ?? null,
      note: optString(s.note) ?? undefined
    });
  }

  return { steps: out, warnings };
}

/** Rough volume estimate to enforce 2.0L working limit.
 * - ml count as ml
 * - g treated ~ 1 ml (conservative)
 * - pcs treated as 80 ml each (placeholder)
 */
function estimateVolumeMl(ings: RoboIngredient[]): number {
  let ml = 0;
  for (const i of ings || []) {
    if (!i) continue;
    if (i.unit === "ml") ml += i.amount;
    else if (i.unit === "g") ml += i.amount;
    else if (i.unit === "pcs") ml += i.amount * 80;
  }
  return ml;
}

/** -------------------- Cobbo cookStep emitter -------------------- **/
function emitCookSteps(steps: RoboStep[], lang: string): string[] {
  // minimalna lokalizacja (na razie PL/EN)
  const isPL = (lang || "pl").toLowerCase().startsWith("pl");
  const L = {
    add: isPL ? "Dodaj składniki" : "Add ingredients",
    manual: isPL ? "Obsłuż ręcznie" : "Manual step",
    wait: isPL ? "Odczekaj" : "Wait",
    go: isPL ? "Działamy Szefie!" : "Let’s cook!"
  };

  const out: string[] = [];
  for (const s of steps || []) {
    if (s.kind === "add") out.push(`${L.add}: ${s.text}`);
    else if (s.kind === "manual") out.push(`${L.manual}: ${s.text}`);
    else if (s.kind === "wait") out.push(`${L.wait}: ${s.timeSec}s${s.note ? ` (${s.note})` : ""}`);
    else if (s.kind === "run") {
      const t = Math.max(1, Math.round(s.timeSec));
      const sp = s.speedLevel != null ? `${Math.round(s.speedLevel)} speed` : "0 speed";
      const temp = s.tempC != null ? `${Math.round(s.tempC)}℃` : `0℃`;
      const mode = s.mode ? `.mode:${String(s.mode).trim()}.` : `.`;
      out.push(`${L.go}:${t}sec/${sp}/${temp}${mode}`);
    }
  }
  return out.filter(Boolean);
}

/** -------------------- Agent prompt -------------------- **/
const ROBO_BASE_INSTRUCTIONS = `
You are a clinical cooking automation agent for a kitchen robot (Cobbo/Tuya).
Your job: generate ROBOT-EXECUTABLE recipes from a given dietPlan meal specification.

STRICT JSON MODE:
- OUTPUT MUST BE PURE JSON. No prose. No markdown fences.
- If you cannot produce output, return {"recipes": []}.

INPUT (single JSON string):
{
  "lang": "pl" | "en" | "de" | "fr" | "es" | "ua" | "ru" | "zh" | "hi" | "ar" | "he",
  "cuisine": "...",
  "modelKey": "...",
  "goal": "...",
  "forbiddenIngredients": ["..."],
  "preferredIngredients": ["..."],
  "robot": {
    "temperature": { "minC": 30, "maxC": 140, "stepC": 5 },
    "speed": { "minLevel": 1, "maxLevel": 10, "tempLockC": 60, "tempLockMaxLevel": 4, "rampToTargetSec": 6 },
    "time": { "requiresTimeIfTemp": true },
    "bowl": { "workingL": 2.0 }
  },
  "meals": [
    {
      "day": "<string>",
      "mealKey": "<string>",
      "mealName": "<string or null>",
      "time": "<string or null>",
      "ingredients": [{ "name": "<string>", "amount": <number>, "unit": "g"|"ml"|"pcs" }]
    }
  ]
}

CRITICAL RULES:
1) DO NOT change the core meal ingredients from input.meals[*].ingredients.
   - You may add ONLY: water/stock (if needed for cooking), herbs/spices, cooking fat, acid (lemon/vinegar) IF clinically safe.
   - Never add forbidden ingredients. Never introduce allergens. Respect modelKey/goal/cuisine.
2) Output MUST be feasible on the robot with constraints:
   - temperature 30..140 step 5
   - speed level 1..10
   - if temperature >= 60 then speedLevel must be <= 4
   - temperature cannot be used without timeSec
3) Keep steps realistic and minimal. Prefer robot steps over manual steps when possible.
4) Provide BOTH:
   - human instructions[] in input.lang
   - robotSteps[] with structured parameters.

OUTPUT SHAPE:
{
  "recipes": [
    {
      "day": "<day>",
      "meal": "<mealKey>",
      "meal_label": "<human label in input.lang>",
      "title": "<dish title in input.lang>",
      "time": "<time or null>",
      "ingredients": [{ "name": "...", "amount": 0, "unit": "g|ml|pcs" }],
      "instructions": ["..."],
      "robotSteps": [
        { "kind":"add", "text":"..." } |
        { "kind":"manual", "text":"..." } |
        { "kind":"wait", "timeSec": 60, "note":"..." } |
        { "kind":"run", "timeSec": 120, "tempC": 95, "speedLevel": 2, "mode": "cook|mix|blend|knead", "note":"..." }
      ],
      "warnings": ["..."]
    }
  ]
}
`.trim();

function buildRoboAgent(model: string, name: string) {
  return new Agent({
    name,
    model,
    instructions: ROBO_BASE_INSTRUCTIONS
  });
}

const roboAgentQuality = buildRoboAgent("gpt-4o", "Robo Agent (Quality)");
const roboAgentFast = buildRoboAgent("gpt-4o-mini", "Robo Agent (Fast)");

/** -------------------- sanitize output -------------------- **/
function cleanUnit(u: unknown): "g" | "ml" | "pcs" {
  const x = String(u || "").toLowerCase();
  if (x === "ml" || x.startsWith("millil")) return "ml";
  if (
    x === "pcs" || x === "pc" || x === "piece" || x === "pieces" ||
    x.startsWith("szt") || x === "ud" || x === "uds" || x === "stk" || x === "st."
  ) return "pcs";
  return "g";
}

function sanitizeRoboRecipes(obj: unknown): { recipes: RoboRecipe[] } {
  const root = (obj && typeof obj === "object") ? (obj as Record<string, unknown>) : null;
  const arr = Array.isArray(root?.recipes) ? (root!.recipes as unknown[]) : [];

  const out: RoboRecipe[] = arr
    .filter((r: unknown) => r && typeof r === "object")
    .map((r: unknown) => {
      const rr = r as Record<string, unknown>;

      const day = String(rr.day ?? "").trim();
      const meal = String(rr.meal ?? "").trim();
      const title = String(rr.title ?? "").trim();
      const time = optString(rr.time) ?? undefined;

      const ingredients: RoboIngredient[] = Array.isArray(rr.ingredients)
        ? (rr.ingredients as unknown[])
            .filter((i: unknown) => i && typeof i === "object" && String((i as any).name || "").trim())
            .slice(0, 60)
            .map((i: unknown): RoboIngredient => {
              const ii = i as Record<string, unknown>;
              return {
                name: String(ii.name ?? "").trim(),
                amount: Math.max(0, Math.round(optNumber(ii.amount ?? (ii as any).quantity) ?? 0)),
                unit: cleanUnit(ii.unit)
              };
            })
            .filter((i: RoboIngredient) => i.amount > 0 && Boolean(i.name))
        : [];

      const instructions: string[] = Array.isArray(rr.instructions)
        ? (rr.instructions as unknown[])
            .filter((s: unknown) => typeof s === "string" && s.trim())
            .map((s: unknown) => String(s).trim().slice(0, 240))
            .slice(0, 40)
        : [];

      const robotSteps: RoboStep[] = Array.isArray(rr.robotSteps)
        ? (rr.robotSteps as unknown[])
            .filter((s: unknown) => s && typeof s === "object" && typeof (s as any).kind === "string")
            .slice(0, 80)
            .map((s: unknown): RoboStep => {
              const ss = s as Record<string, unknown>;
              const kind = String(ss.kind ?? "").trim();

              if (kind === "add") return { kind: "add", text: String(ss.text ?? "").trim().slice(0, 500) };
              if (kind === "manual") return { kind: "manual", text: String(ss.text ?? "").trim().slice(0, 500) };
              if (kind === "wait") {
                return {
                  kind: "wait",
                  timeSec: Math.max(1, Math.round(optNumber(ss.timeSec) ?? 60)),
                  note: optString(ss.note) ?? undefined
                };
              }

              return {
                kind: "run",
                timeSec: Math.max(1, Math.round(optNumber(ss.timeSec) ?? 60)),
                tempC: ss.tempC == null ? null : Math.round(optNumber(ss.tempC) ?? 0),
                speedLevel: ss.speedLevel == null ? null : Math.round(optNumber(ss.speedLevel) ?? 0),
                mode: optString(ss.mode) ?? null,
                note: optString(ss.note) ?? undefined
              };
            })
        : [];

      const meal_label = optString(rr.meal_label) ?? undefined;
      const warnings = Array.isArray(rr.warnings)
        ? (rr.warnings as unknown[])
            .map((x: unknown) => String(x).trim())
            .filter(Boolean)
            .slice(0, 30)
        : undefined;

      return {
        day,
        meal,
        meal_label,
        title,
        time,
        ingredients,
        instructions,
        robotSteps,
        cookSteps: [],
        warnings,
        profile: { model: String((rr.profile as any)?.model || "").trim() || "cobbo-tuya-v0" }
      };
    })
    .filter((r: RoboRecipe) => r.day && r.meal && r.title && r.ingredients.length > 0 && r.instructions.length > 0 && r.robotSteps.length > 0);

  return { recipes: out };
}

/** -------------------- public API -------------------- **/
export async function generateRoboRecipes(input: GenerateRoboInput): Promise<{ recipes: RoboRecipe[] }> {
  const {
    lang = "pl",
    cuisine = "global",
    modelKey = "",
    goal = "",
    dietPlan,
    forbiddenIngredients = [],
    preferredIngredients = [],
    profile = cobboProfileV0,
    modelHint = "quality"
  } = input || ({} as GenerateRoboInput);

  const meals = flattenDietPlan(dietPlan);
  if (!meals.length) return { recipes: [] };

  const robotPayload = {
    temperature: profile.temperature,
    speed: {
      minLevel: profile.speed.minLevel,
      maxLevel: profile.speed.maxLevel,
      tempLockC: 60,
      tempLockMaxLevel: 4,
      rampToTargetSec: profile.speed.rampToTargetSec
    },
    time: { requiresTimeIfTemp: profile.time.requiresTimeIfTemp },
    bowl: { workingL: profile.bowl.workingL }
  };

  const userPayload = {
    lang,
    cuisine,
    modelKey,
    goal,
    forbiddenIngredients: (forbiddenIngredients || []).map(String).filter(Boolean).slice(0, 120),
    preferredIngredients: (preferredIngredients || []).map(String).filter(Boolean).slice(0, 120),
    robot: robotPayload,
    meals: meals.slice(0, 42) // 7 dni * do 6 posiłków
  };

  const agent = modelHint === "fast" ? roboAgentFast : roboAgentQuality;

  const result: any = await run(agent, JSON.stringify(userPayload));
  const text = String(result?.finalOutput ?? result?.output_text ?? "").trim();

  const parsed = tryParseJsonLoose(text);
  if (!parsed || typeof parsed !== "object") return { recipes: [] };

  const sanitized = sanitizeRoboRecipes(parsed);
  if (!sanitized.recipes.length) return { recipes: [] };

  const final: RoboRecipe[] = sanitized.recipes.map((r: RoboRecipe) => {
    const { steps, warnings: w1 } = applyCobboConstraints(r.robotSteps, profile);

    const volMl = estimateVolumeMl(r.ingredients);
    const w2: string[] = [];
    if (volMl > profile.bowl.workingL * 1000) {
      const liters = Math.round((volMl / 1000) * 10) / 10;
      w2.push(`Pojemność robocza misy ${profile.bowl.workingL}L może zostać przekroczona (~${liters}L). Rozważ podział na 2 tury.`);
    }

    const cookSteps = emitCookSteps(steps, lang);

    return {
      ...r,
      robotSteps: steps,
      cookSteps,
      warnings: Array.from(new Set([...(r.warnings || []), ...w1, ...w2])),
      profile: { model: profile.model }
    };
  });

  return { recipes: final };
}

export { roboAgentQuality, roboAgentFast };