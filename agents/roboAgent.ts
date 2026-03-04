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

type SupabaseMeal = {
  day?: string;
  menu?: string;
  name?: string;
  time?: string;
  ingredients?: Array<{
    product?: string;
    name?: string;
    weight?: number;
    quantity?: number;
    unit?: string;
  }>;
  macros?: unknown;
  glycemicIndex?: unknown;
};

type DietMeta = {
  goal?: string;
  model?: string;
  cuisine?: string;
  mealsPerDay?: number;
};

export type DietPlan =
  | Record<string, Record<string, DietMeal>>
  | Record<string, SupabaseMeal[] | DietMeta>;

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
  meal: string; // mealKey (0..n)
  meal_label?: string; // Śniadanie/Obiad...
  title: string; // nazwa dania (menu/name)
  time?: string;
  ingredients: RoboIngredient[];
  instructions: string[]; // „dla człowieka”
  robotSteps: RoboStep[]; // „dla robota” (strukturalne)
  cookSteps: string[]; // XLSX-compatible (cookStep_1..N)
  warnings?: string[];
  profile?: { model: string };
};

type PlDay =
  | "Poniedziałek"
  | "Wtorek"
  | "Środa"
  | "Czwartek"
  | "Piątek"
  | "Sobota"
  | "Niedziela";

const PL_DAY_ORDER: PlDay[] = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela"
];

function normalizePlDay(day: string): PlDay | null {
  const d = String(day || "").trim().toLowerCase();
  const map: Record<string, PlDay> = {
    "poniedziałek": "Poniedziałek",
    "poniedzialek": "Poniedziałek",
    "wtorek": "Wtorek",
    "środa": "Środa",
    "sroda": "Środa",
    "czwartek": "Czwartek",
    "piątek": "Piątek",
    "piatek": "Piątek",
    "sobota": "Sobota",
    "niedziela": "Niedziela"
  };
  return map[d] ?? null;
}

function dayIndexFromStart(day: string, start: PlDay): number {
  const nd = normalizePlDay(day);
  if (!nd) return 999;
  const base = PL_DAY_ORDER.indexOf(start);
  const idx = PL_DAY_ORDER.indexOf(nd);
  if (base < 0 || idx < 0) return 999;
  // rotacja tygodnia
  return (idx - base + 7) % 7;
}

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
  startDay?: PlDay; // <- DODANE: sort tygodnia od tego dnia (np. "Czwartek")
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
  mealKey: string; // "0".."n"
  mealName?: string; // menu/name
  time?: string;
  ingredients: RoboIngredient[];
};

function flattenDietPlan(dietPlan: DietPlan): FlatMeal[] {
  const out: FlatMeal[] = [];
  if (!dietPlan || typeof dietPlan !== "object") return out;

  for (const [dayKey, mealsAny] of Object.entries(dietPlan as any)) {
    if (!mealsAny) continue;
    if (String(dayKey) === "__meta") continue;

    // FORMAT A: Supabase => day -> array
    if (Array.isArray(mealsAny)) {
      mealsAny.forEach((m: any, idx: number) => {
        if (!m || typeof m !== "object") return;

       const ingredients = Array.isArray((m as any).ingredients)
  ? (((m as any).ingredients as unknown[])
      .map((x: unknown) => normalizeDietIngredient(x))
      .filter((x): x is RoboIngredient => Boolean(x)))
  : [];

        if (!ingredients.length) return;

        out.push({
          day: String(m.day ?? dayKey).trim(),
          mealKey: String(idx),
          mealName: optString(m.menu ?? m.name ?? m.mealName) ?? undefined,
          time: optString(m.time) ?? undefined,
          ingredients
        });
      });
      continue;
    }

    // FORMAT B: legacy => day -> object map
    if (typeof mealsAny === "object") {
      for (const [mealKey, m] of Object.entries(mealsAny as any)) {
        if (!m || typeof m !== "object") continue;

        const ingredients = Array.isArray((m as any).ingredients)
        ? (((m as any).ingredients as unknown[])
            .map((x: unknown) => normalizeDietIngredient(x))
            .filter((x): x is RoboIngredient => Boolean(x)))
        : [];

        if (!ingredients.length) continue;

        out.push({
          day: String(dayKey).trim(),
          mealKey: String(mealKey).trim(),
          mealName: optString((m as any).menu ?? (m as any).name ?? (m as any).mealName) ?? undefined,
          time: optString((m as any).time) ?? undefined,
          ingredients
        });
      }
    }
  }

  return out;
}

/** -------------------- Meal label -------------------- **/
function mealLabelFromTimeOrIndex(time: string | undefined, idx: number, lang: string): string {
  const t = (time || "").trim();

  const labelsPl = ["Śniadanie", "II śniadanie", "Obiad", "Kolacja"];
  const labelsEn = ["Breakfast", "Second breakfast", "Lunch", "Dinner"];
  const labels = lang === "en" ? labelsEn : labelsPl;

  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (m) {
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (Number.isFinite(hh) && Number.isFinite(mm)) {
      const minutes = hh * 60 + mm;
      if (minutes >= 300 && minutes <= 599) return labels[0];
      if (minutes >= 600 && minutes <= 779) return labels[1];
      if (minutes >= 780 && minutes <= 1019) return labels[2];
      if (minutes >= 1020 && minutes <= 1320) return labels[3];
    }
  }

  const j = Math.min(Math.max(idx, 0), labels.length - 1);
  return labels[j] ?? labels[0];
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
    if (!Number.isFinite(timeSec) || timeSec <= 0) timeSec = 30;

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
        warnings.push(`Cobbo: speed limited to level ${limit} at temp >= 60°C (requested ${speedLevel}).`);
        speedLevel = limit;
      }
    }

    out.push({
      kind: "run",
      timeSec,
      tempC,
      speedLevel,
      mode: optString((s as any).mode) ?? null,
      note: optString((s as any).note) ?? undefined,
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
  return (ings || [])
    .map(i => `${String(i.name).trim()} (${i.amount}${i.unit})`)
    .join(", ");
}

function emitCookSteps(steps: RoboStep[], _lang: string): string[] {
  const out: string[] = [];

  for (const s of steps || []) {
    if (!s) continue;

    if (s.kind === "add") {
      const tail = optString((s as any).tail) ?? "";
      out.push(`Dodaj składniki:${String((s as any).text || "").trim()}.końcówka:${tail}`.trim());
      continue;
    }

    if (s.kind === "manual") {
      out.push(`Obsłuż ręcznie:${String((s as any).text || "").trim()}`.trim());
      continue;
    }

    if (s.kind === "wait") {
      const t = Math.max(1, Math.round((s as any).timeSec));
      const tail = optString((s as any).tail) ?? "";
      out.push(`Działamy Szefie!:${t}sekund/0 Prędkość/0℃.tryb:0.końcówka:${tail}`.trim());
      continue;
    }

    if (s.kind === "run") {
      const t = Math.max(1, Math.round((s as any).timeSec));
      const speedLevel = (s as any).speedLevel != null ? Math.max(0, Math.round((s as any).speedLevel)) : 0;
      const temp = (s as any).tempC != null ? Math.round((s as any).tempC) : 0;
      const tail = optString((s as any).tail) ?? "";
      out.push(`Działamy Szefie!:${t}sekund/${speedLevel} Prędkość/${temp}℃.tryb:0.końcówka:${tail}`.trim());
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
  if (s.includes("smoothie") || s.includes("koktajl")) return "smoothie";
  if (s.includes("kanapk") || s.includes("tost") || s.includes("hummus") || s.includes("awokado")) return "sandwich";
  if (s.includes("jaj") || s.includes("omlet") || s.includes("jajeczn")) return "eggs";
  if (s.includes("sałatk")) return "salad";
  if (s.includes("zupa") || s.includes("krem")) return "soup";
  if (s.includes("makaron")) return "pasta";
  if (s.includes("łoso") || s.includes("dorsz") || s.includes("tuńczyk") || s.includes("ryba")) return "fish";
  if (s.includes("wołow") || s.includes("kurcz") || s.includes("indyk") || s.includes("schab")) return "meat_grain";
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
  const exists = base.some(i => (i.name || "").toLowerCase() === name.toLowerCase());
  if (exists) return base;
  return [...base, { name, amount, unit }];
}

function buildDeterministicRecipe(meal: FlatMeal, lang: string): RoboRecipe {
  const title = meal.mealName || "Posiłek";
  const idx = Number.isFinite(Number(meal.mealKey)) ? Number(meal.mealKey) : 0;
  const meal_label = mealLabelFromTimeOrIndex(meal.time, idx, lang);

  const kind = detectMealKind(title);

  let ingredients = [...meal.ingredients];

  const mayNeedSalt = !hasIngredient(ingredients, "sól");
  const mayNeedPepper = !hasIngredient(ingredients, "pieprz");

  const shouldAddWater =
    kind === "soup" || kind === "pasta" || kind === "meat_grain" || kind === "steam_veg";

  if (shouldAddWater && !hasIngredient(ingredients, "woda")) {
    ingredients = addOptionalIngredient(ingredients, "Woda", 500, "ml");
  }
  if (mayNeedSalt) ingredients = addOptionalIngredient(ingredients, "Sól", 1, "g");
  if (mayNeedPepper) ingredients = addOptionalIngredient(ingredients, "Pieprz", 1, "g");

  if (!hasIngredient(ingredients, "zioła") && (kind === "meat_grain" || kind === "fish" || kind === "soup")) {
    ingredients = addOptionalIngredient(ingredients, "Zioła (np. prowansalskie)", 1, "g");
  }

  const ingText = fmtIngredientList(ingredients);
  const baseTime = meal.time;

  const instructions: string[] = [];
  const robotSteps: RoboStep[] = [];

  function stepAdd(tail: string) {
    instructions.push(tail);
    robotSteps.push({ kind: "add", text: ingText, tail });
  }

  function stepRun(timeSec: number, tempC: number | null, speedLevel: number | null, tail: string) {
    instructions.push(tail);
    robotSteps.push({ kind: "run", timeSec, tempC, speedLevel, mode: null, tail });
  }

  function stepManual(text: string) {
    instructions.push(text);
    robotSteps.push({ kind: "manual", text });
  }
    const isColdBowl =
    hasIngredient(ingredients, "jogurt") ||
    hasIngredient(ingredients, "musli") ||
    hasIngredient(ingredients, "owoce") ||
    hasIngredient(ingredients, "orzech") ||
    hasIngredient(ingredients, "jagody") ||
    hasIngredient(ingredients, "truskaw") ||
    hasIngredient(ingredients, "banan") ||
    hasIngredient(ingredients, "jabłko") ||
    hasIngredient(ingredients, "pomarańcz");

  // Jeśli to zimny posiłek (np. jogurt + orzechy / musli), nie gotujemy.
  // Mieszamy krótko bez grzania.
  if (isColdBowl && (kind === "other" || kind === "oatmeal")) {
    stepAdd("Dodaj składniki do misy.");
    stepRun(8, 30, 2, "Wymieszaj krótko.");
    stepManual("Przełóż do miski i podawaj.");

    return {
      day: meal.day,
      meal: meal.mealKey,
      meal_label,
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

  if (kind === "oatmeal") {
    stepAdd("Wlej/dodaj składniki do misy (bez owoców i orzechów, jeśli wolisz je na wierzch).");
    stepRun(300, 95, 2, "Gotuj 5 minut do zmięknięcia płatków.");
    stepManual("Przełóż do miski, dodaj owoce/orzechy na wierzch i podawaj.");
  } else if (kind === "sandwich") {
    const canBlendPaste = hasIngredient(ingredients, "awokado") || hasIngredient(ingredients, "hummus");
    if (canBlendPaste) {
      stepAdd("Dodaj składniki pasty do misy (np. awokado/hummus + przyprawy).");
      stepRun(10, 30, 4, "Zblenduj krótko do uzyskania pasty.");
      stepManual("Rozsmaruj pastę na pieczywie i dodaj warzywa. Podawaj.");
    } else {
      stepManual("To danie przygotuj ręcznie: posmaruj pieczywo dodatkiem i ułóż warzywa. Podawaj.");
    }
  } else if (kind === "eggs") {
    stepAdd("Dodaj składniki do misy (jajka + warzywa + tłuszcz + przyprawy).");
    stepRun(120, 95, 2, "Podgrzewaj i mieszaj do ścięcia jajek.");
    stepManual("Wyłóż na talerz i podawaj.");
  } else if (kind === "smoothie") {
    stepAdd("Dodaj składniki do misy (owoce/warzywa + płyn).");
    stepRun(30, 30, 8, "Blenduj na gładko.");
    stepManual("Przelej do szklanki i podawaj.");
  } else if (kind === "salad") {
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
    stepAdd("Dodaj składniki do misy (kasza/ryż + woda + przyprawy).");
    stepRun(900, 100, 2, "Gotuj kaszę/ryż do miękkości.");
    stepManual("Mięso przygotuj osobno (smaż/piecz) i podaj z ugotowaną kaszą oraz warzywami.");
  } else if (kind === "steam_veg") {
    stepAdd("Dodaj warzywa i wodę do misy.");
    stepRun(1200, 100, 2, "Gotuj do miękkości.");
    stepManual("Podawaj na ciepło.");
  } else {
    stepAdd("Dodaj składniki do misy.");
    stepRun(300, 95, 2, "Podgrzewaj i mieszaj do uzyskania pożądanej konsystencji.");
    stepManual("Podawaj.");
  }

  return {
    day: meal.day,
    meal: meal.mealKey,
    meal_label,
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

              if (kind === "add")
                return { kind: "add", text: String(ss.text ?? "").trim().slice(0, 500), tail };
              if (kind === "manual")
                return { kind: "manual", text: String(ss.text ?? "").trim().slice(0, 500), tail };
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
    modelHint = "quality",
    startDay = "Czwartek"
  } = input || ({} as GenerateRoboInput);

  const meals = flattenDietPlan(dietPlan);
  if (!meals.length) return { recipes: [] };

  // sort posiłków: dni od startDay, a w dniu po czasie rosnąco (fallback po indeksie mealKey)
  const mealsSorted = [...meals].sort((a, b) => {
    const da = dayIndexFromStart(a.day, startDay);
    const db = dayIndexFromStart(b.day, startDay);
    if (da !== db) return da - db;

    const ta = optString(a.time) ?? "";
    const tb = optString(b.time) ?? "";
    if (ta && tb) return ta.localeCompare(tb);

    const ia = Number.isFinite(Number(a.mealKey)) ? Number(a.mealKey) : 0;
    const ib = Number.isFinite(Number(b.mealKey)) ? Number(b.mealKey) : 0;
    return ia - ib;
  });

  /**
   * IMPORTANT:
   * Domyślnie działamy deterministycznie (NO LLM) => brak halucynacji.
   */
  const deterministicRecipes: RoboRecipe[] = mealsSorted.slice(0, 42).map(m => buildDeterministicRecipe(m, lang));

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