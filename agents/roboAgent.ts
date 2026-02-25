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

/**
 * XLSX-compatible cook step patterns (Cobbo):
 * - Dodaj składniki:...końcówka:<recipeStepText>
 * - Działamy Szefie!:<sekund>/<speed> Prędkość/<temp>℃.tryb:0.końcówka:<recipeStepText>
 * - Obsłuż ręcznie:<recipeStepText>
 *
 * Uwaga: w XLSX "tryb" jest liczbą (często 0). Trzymamy 0, dopóki nie dostaniesz mapy trybów Cobbo.
 */
export type RoboStep =
  | { kind: "add"; text: string; tail?: string }
  | { kind: "manual"; text: string; tail?: string }
  | { kind: "wait"; timeSec: number; note?: string; tail?: string }
  | {
      kind: "run";
      timeSec: number;
      tempC?: number | null;
      speedLevel?: number | null;
      mode?: string | null; // obecnie niewykorzystywane w cookSteps (XLSX ma tryb:0)
      note?: string;
      tail?: string;
    };

export type RoboIngredient = { name: string; amount: number; unit: "g" | "ml" | "pcs" };

export type RoboRecipe = {
  day: string;
  meal: string; // mealKey z dietPlan
  meal_label?: string;
  title: string;
  time?: string;
  ingredients: RoboIngredient[];
  instructions: string[]; // „dla człowieka”
  robotSteps: RoboStep[]; // „dla robota” (strukturalne)
  cookSteps: string[]; // XLSX-compatible (cookStep_1..N)
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
    unitRaw === "ml"
      ? "ml"
      : unitRaw === "pcs" || unitRaw === "pc" || unitRaw.startsWith("szt")
        ? "pcs"
        : "g";

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

function applyCobboConstraints(
  steps: RoboStep[],
  profile: CobboProfile
): { steps: RoboStep[]; warnings: string[] } {
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
      const tempNum = tempC;
      const limit =
        profile.speed.constraints.find(c => c.ifTempGteC <= tempNum)?.maxLevel ?? null;
      if (limit != null && speedLevel > limit) {
        warnings.push(
          `Cobbo: speed limited to level ${limit} at temp >= 60°C (requested ${speedLevel}).`
        );
        speedLevel = limit;
      }
    }

    out.push({
      kind: "run",
      timeSec,
      tempC,
      speedLevel,
      mode: optString(s.mode) ?? null,
      note: optString(s.note) ?? undefined,
      tail: optString((s as any).tail) ?? undefined
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

/** -------------------- XLSX-compatible cookStep emitter -------------------- **/
function fmtIngredientList(ings: RoboIngredient[]): string {
  // XLSX: "marchewkę (100g), mleko (1400g), jajko (1 sztukę)"
  // Trzymamy prosto: "<name> (<amount><unit>)"
  return (ings || [])
    .map(i => `${String(i.name).trim()} (${i.amount}${i.unit})`)
    .join(", ");
}

function emitCookSteps(steps: RoboStep[], _lang: string): string[] {
  const out: string[] = [];

  for (const s of steps || []) {
    if (!s) continue;

    if (s.kind === "add") {
      const tail = optString(s.tail) ?? "";
      out.push(`Dodaj składniki:${String(s.text || "").trim()}.końcówka:${tail}`.trim());
      continue;
    }

    if (s.kind === "manual") {
      out.push(`Obsłuż ręcznie:${String(s.text || "").trim()}`.trim());
      continue;
    }

    if (s.kind === "wait") {
      const t = Math.max(1, Math.round(s.timeSec));
      const tail = optString(s.tail) ?? "";
      out.push(`Działamy Szefie!:${t}sekund/0 Prędkość/0℃.tryb:0.końcówka:${tail}`.trim());
      continue;
    }

    if (s.kind === "run") {
      const t = Math.max(1, Math.round(s.timeSec));
      const speedLevel = s.speedLevel != null ? Math.max(0, Math.round(s.speedLevel)) : 0;
      const temp = s.tempC != null ? Math.round(s.tempC) : 0;
      const tail = optString(s.tail) ?? "";
      out.push(
        `Działamy Szefie!:${t}sekund/${speedLevel} Prędkość/${temp}℃.tryb:0.końcówka:${tail}`.trim()
      );
      continue;
    }
  }

  return out.map(s => String(s || "").trim()).filter(Boolean);
}

/** -------------------- Deterministic recipe builder (NO LLM) -------------------- **/
type MealKind =
  | "oatmeal"
  | "sandwich"
  | "eggs"
  | "smoothie"
  | "salad"
  | "soup"
  | "pasta"
  | "fish"
  | "meat_grain"
  | "steam_veg"
  | "other";

function detectMealKind(nameOrKey: string): MealKind {
  const s = (nameOrKey || "").toLowerCase();

  if (s.includes("owsian") || s.includes("musli") || s.includes("płatki")) return "oatmeal";
  if (s.includes("kanapk") || s.includes("tost") || s.includes("hummus") || s.includes("awokado"))
    return "sandwich";
  if (s.includes("jaj") || s.includes("omlet") || s.includes("jajeczn")) return "eggs";
  if (s.includes("smoothie") || s.includes("koktajl")) return "smoothie";
  if (s.includes("sałatk")) return "salad";
  if (s.includes("zupa") || s.includes("krem")) return "soup";
  if (s.includes("makaron")) return "pasta";
  if (s.includes("łoso") || s.includes("dorsz") || s.includes("tuńczyk") || s.includes("ryba"))
    return "fish";
  if (s.includes("wołow") || s.includes("kurcz") || s.includes("indyk") || s.includes("schab"))
    return "meat_grain";
  if (s.includes("parze") || s.includes("gotowane") || s.includes("warzywa")) return "steam_veg";

  return "other";
}

function hasIngredient(ings: RoboIngredient[], needle: string): boolean {
  const n = needle.toLowerCase();
  return (ings || []).some(i => (i.name || "").toLowerCase().includes(n));
}

function addOptionalIngredient(
  base: RoboIngredient[],
  name: string,
  amount: number,
  unit: "g" | "ml" | "pcs"
): RoboIngredient[] {
  // nie duplikuj, jeśli już jest podobny składnik
  const exists = base.some(i => (i.name || "").toLowerCase() === name.toLowerCase());
  if (exists) return base;
  return [...base, { name, amount, unit }];
}

function buildDeterministicRecipe(meal: FlatMeal, lang: string): RoboRecipe {
  const title = meal.mealName || meal.mealKey || "Posiłek";
  const kind = detectMealKind(title || meal.mealKey);

  // Bazowe składniki: 1:1 z dietPlan
  let ingredients = [...meal.ingredients];

  // Opcjonalne dodatki technologiczne (dozwolone)
  const mayNeedSalt = !hasIngredient(ingredients, "sól");
  const mayNeedPepper = !hasIngredient(ingredients, "pieprz");

  // Woda tylko, gdy typ potrawy jej wymaga (zupa/kasze/makaron/gotowanie na parze)
  const shouldAddWater =
    kind === "soup" || kind === "pasta" || kind === "meat_grain" || kind === "steam_veg";

  if (shouldAddWater && !hasIngredient(ingredients, "woda")) {
    // konserwatywnie: 500 ml (nie rozwali misy), ewentualnie użytkownik doprecyzuje później
    ingredients = addOptionalIngredient(ingredients, "Woda", 500, "ml");
  }
  if (mayNeedSalt) ingredients = addOptionalIngredient(ingredients, "Sól", 1, "g");
  if (mayNeedPepper) ingredients = addOptionalIngredient(ingredients, "Pieprz", 1, "g");

  // Zioła tylko jako 1g (bezpiecznie)
  if (!hasIngredient(ingredients, "zioła") && (kind === "meat_grain" || kind === "fish" || kind === "soup")) {
    ingredients = addOptionalIngredient(ingredients, "Zioła (np. prowansalskie)", 1, "g");
  }

  const ingText = fmtIngredientList(ingredients);
  const baseTime = meal.time;

  // recipeStep_* (dla człowieka) + robotSteps z tail do cookSteps
  const instructions: string[] = [];
  const robotSteps: RoboStep[] = [];

  function stepAdd(tail: string) {
    instructions.push(tail);
    robotSteps.push({
      kind: "add",
      text: ingText,
      tail
    });
  }

  function stepRun(timeSec: number, tempC: number | null, speedLevel: number | null, tail: string) {
    instructions.push(tail);
    robotSteps.push({
      kind: "run",
      timeSec,
      tempC,
      speedLevel,
      mode: null,
      tail
    });
  }

  function stepManual(text: string) {
    instructions.push(text);
    robotSteps.push({ kind: "manual", text });
  }

  // Deterministic templates (minimalne, realistyczne)
  if (kind === "oatmeal") {
    stepAdd("Wlej/dodaj składniki do misy (bez owoców i orzechów, jeśli wolisz je na wierzch).");
    stepRun(300, 95, 2, "Gotuj 5 minut do zmięknięcia płatków.");
    stepManual("Przełóż do miski, dodaj owoce/orzechy na wierzch i podawaj.");
  } else if (kind === "sandwich") {
    // Robot nie zrobi chleba — opcjonalnie może tylko „zmiksować” pastę (awokado/hummus)
    const canBlendPaste = hasIngredient(ingredients, "awokado") || hasIngredient(ingredients, "hummus");
    if (canBlendPaste) {
      stepAdd("Dodaj składniki pasty do misy (np. awokado/hummus + przyprawy).");
      stepRun(10, 30, 4, "Zblenduj krótko do uzyskania pasty.");
      stepManual("Rozsmaruj pastę na pieczywie i dodaj warzywa. Podawaj.");
    } else {
      stepManual("To danie przygotuj ręcznie: posmaruj pieczywo dodatkiem i ułóż warzywa. Podawaj.");
    }
  } else if (kind === "eggs") {
    // Jajka: delikatne mieszanie na temp 90–95, speed 1–2
    stepAdd("Dodaj składniki do misy (jajka + warzywa + tłuszcz + przyprawy).");
    stepRun(120, 95, 2, "Podgrzewaj i mieszaj do ścięcia jajek.");
    stepManual("Wyłóż na talerz i podawaj.");
  } else if (kind === "smoothie") {
    stepAdd("Dodaj składniki do misy (owoce/warzywa + płyn).");
    stepRun(30, 30, 8, "Blenduj na gładko.");
    stepManual("Przelej do szklanki i podawaj.");
  } else if (kind === "salad") {
    // Sałatka: robot może tylko posiekać/mieszać (temp 0)
    stepAdd("Dodaj składniki do misy (bez delikatnych dodatków, jeśli chcesz je dodać na końcu).");
    stepRun(8, 30, 4, "Wymieszaj/posiekaj krótko.");
    stepManual("Wyłóż do miski, dopraw do smaku i podawaj.");
  } else if (kind === "soup") {
    stepAdd("Dodaj składniki do misy.");
    stepRun(10, 30, 5, "Rozdrobnij warzywa.");
    stepRun(900, 100, 2, "Gotuj do miękkości.");
    stepRun(30, 30, 8, "Zblenduj do kremu.");
    stepManual("Podawaj na ciepło.");
  } else if (kind === "pasta") {
    stepAdd("Dodaj wodę i składniki sosu do misy (makaron ugotuj osobno, jeśli to możliwe).");
    stepRun(600, 100, 2, "Gotuj sos 10 minut.");
    stepManual("Ugotuj makaron osobno i połącz z sosem. Podawaj.");
  } else if (kind === "fish") {
    stepAdd("Dodaj składniki do misy (warzywa + tłuszcz + przyprawy).");
    stepRun(900, 100, 2, "Gotuj/duś warzywa do miękkości.");
    stepManual("Rybę przygotuj na patelni lub w piekarniku (wg zaleceń diety) i podaj z warzywami.");
  } else if (kind === "meat_grain") {
    // Bezpieczny template: kasza/ryż w robocie, mięso często ręcznie (żeby nie ryzykować tekstury)
    stepAdd("Dodaj składniki do misy (kasza/ryż + woda + przyprawy).");
    stepRun(900, 100, 2, "Gotuj kaszę/ryż do miękkości.");
    stepManual("Mięso przygotuj osobno (smaż/piecz) i podaj z ugotowaną kaszą oraz warzywami.");
  } else if (kind === "steam_veg") {
    stepAdd("Dodaj warzywa i wodę do misy.");
    stepRun(1200, 100, 2, "Gotuj do miękkości.");
    stepManual("Podawaj na ciepło.");
  } else {
    // fallback minimalny (bezpieczny)
    stepAdd("Dodaj składniki do misy.");
    stepRun(300, 95, 2, "Podgrzewaj i mieszaj do uzyskania pożądanej konsystencji.");
    stepManual("Podawaj.");
  }

  return {
    day: meal.day,
    meal: meal.mealKey,
    meal_label: meal.mealName,
    title,
    time: baseTime,
    ingredients,
    instructions,
    robotSteps,
    cookSteps: [],
    warnings: [],
    profile: { model: cobboProfileV0.model }
  };
}

/** -------------------- Agent prompt (kept, but NOT used by default) -------------------- **/
const ROBO_BASE_INSTRUCTIONS = `
You are a clinical cooking automation agent for a kitchen robot (Cobbo/Tuya).
Your job: generate ROBOT-EXECUTABLE recipes from a given dietPlan meal specification.

STRICT JSON MODE:
- OUTPUT MUST BE PURE JSON. No prose. No markdown fences.
- If you cannot produce output, return {"recipes": []}.
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

/** -------------------- sanitize output (only for optional LLM mode) -------------------- **/
function cleanUnit(u: unknown): "g" | "ml" | "pcs" {
  const x = String(u || "").toLowerCase();
  if (x === "ml" || x.startsWith("millil")) return "ml";
  if (
    x === "pcs" ||
    x === "pc" ||
    x === "piece" ||
    x === "pieces" ||
    x.startsWith("szt") ||
    x === "ud" ||
    x === "uds" ||
    x === "stk" ||
    x === "st."
  )
    return "pcs";
  return "g";
}

function sanitizeRoboRecipes(obj: unknown): { recipes: RoboRecipe[] } {
  const root = obj && typeof obj === "object" ? (obj as Record<string, unknown>) : null;
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
              const tail = optString((ss as any).tail) ?? undefined;

              if (kind === "add") return { kind: "add", text: String(ss.text ?? "").trim().slice(0, 500), tail };
              if (kind === "manual") return { kind: "manual", text: String(ss.text ?? "").trim().slice(0, 500), tail };
              if (kind === "wait") {
                return {
                  kind: "wait",
                  timeSec: Math.max(1, Math.round(optNumber(ss.timeSec) ?? 60)),
                  note: optString(ss.note) ?? undefined,
                  tail
                };
              }

              return {
                kind: "run",
                timeSec: Math.max(1, Math.round(optNumber(ss.timeSec) ?? 60)),
                tempC: ss.tempC == null ? null : Math.round(optNumber(ss.tempC) ?? 0),
                speedLevel: ss.speedLevel == null ? null : Math.round(optNumber(ss.speedLevel) ?? 0),
                mode: optString(ss.mode) ?? null,
                note: optString(ss.note) ?? undefined,
                tail
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
    .filter(
      (r: RoboRecipe) =>
        r.day && r.meal && r.title && r.ingredients.length > 0 && r.instructions.length > 0 && r.robotSteps.length > 0
    );

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

  /**
   * IMPORTANT:
   * Domyślnie działamy deterministycznie (NO LLM) => brak halucynacji.
   * Jeśli kiedyś będziesz chciał LLM jako fallback, dodamy flagę (np. modelHint === "llm").
   */
  const deterministicRecipes: RoboRecipe[] = meals.slice(0, 42).map(m => buildDeterministicRecipe(m, lang));

  const final: RoboRecipe[] = deterministicRecipes.map((r: RoboRecipe) => {
    const { steps, warnings: w1 } = applyCobboConstraints(r.robotSteps, profile);

    const volMl = estimateVolumeMl(r.ingredients);
    const w2: string[] = [];
    if (volMl > profile.bowl.workingL * 1000) {
      const liters = Math.round((volMl / 1000) * 10) / 10;
      w2.push(
        `Pojemność robocza misy ${profile.bowl.workingL}L może zostać przekroczona (~${liters}L). Rozważ podział na 2 tury.`
      );
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