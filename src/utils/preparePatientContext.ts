// utils/preparePatientContext.ts
// Spójny „adapter” danych pacjenta dla dietAgent i dqAgent.
// Łączy interviewData + medicalData, normalizuje nazwy, wylicza cele (Na/K/błonnik/kcal),
// oraz buduje listy avoid/prefer dla agentów.

// ──────────────────────────────────────────────────────────────────────────────
// Typy
// ──────────────────────────────────────────────────────────────────────────────
export type PatientContext = {
  userId?: string;
  goal: "weight_loss" | "weight_gain" | "recomposition" | "maintenance" | string;
  conditions: string[];
  allergies: string[];      // znormalizowane słowa-klucze (np. "lactose", "soy", "butterfish")
  intolerances: string[];   // jw.
  dislikes: string[];       // znormalizowane (np. "broccoli")
  likes: string[];          // wolna forma + kilka kanonicznych sugestii
  mealsPerDay: number;
  mealTimes: string[];      // HH:MM
  snacksAllowed: boolean;

  // Cele odżywcze/kliniczne
  kcalTarget?: number;
  sodiumMaxMg: number;      // ≤ 1500–1800 mg/d dla HTN/udar
  potassiumMinMg: number;   // ≥ 3500 mg/d
  fiberTargetG: { min: number; max: number }; // zwykle 30–40 g/d
  proteinRangeG?: { min: number; max: number }; // 1.2–1.6 g/kg jeśli weightKg znane

  // Dane opcjonalne do wyliczeń
  weightKg?: number | null;
  cpm?: number | null;

  // Listy dla agentów
  avoidIngredients: string[];     // rozszerzone aliasy (mleko/jogurt/kefir/… dla „lactose”, tofu/miso/tamari/… dla „soy”)
  preferIngredients: string[];    // preferencje pacjenta przetłumaczone na słowa kluczowe
};

// „surowe” struktury – dopasuj do swoich rekordów jeśli nazwy pól różnią się
export type RawInterview = Partial<{
  goal: string;
  allergies: string[] | string;
  intolerances: string[] | string;
  dislikes: string[] | string;
  likes: string[] | string;
  mealsPerDay: number;
  mealTimes: string[]; // ["07:00","12:00","16:00","19:00"]
  snacksAllowed: boolean;
  weightKg?: number | null;
  cpm?: number | null;
}>;

export type RawMedical = Partial<{
  diagnoses: string[] | string; // ["hypertension","stroke",...]
  allergies: string[] | string;
  intolerances: string[] | string;
  labs?: Record<string, unknown>;
}>;

// ──────────────────────────────────────────────────────────────────────────────
const DEF_MEAL_TIMES = ["07:00", "12:00", "16:00", "19:00"];
const ARR = (x: any): string[] =>
  Array.isArray(x) ? x : (x ? String(x).split(/[;,]|<\/?br\s*\/?>|\n/).map(s => s.trim()).filter(Boolean) : []);

// Proste kanonizowanie – zamieniamy różne warianty na wspólne etykiety.
function canonicalToken(s: string): string {
  const k = s.toLowerCase().trim();

  // alergie/nietolerancje
  if (/laktoz/.test(k) || /lactose/.test(k)) return "lactose";
  if (/soja|soy|tofu|tempeh|miso|tamari|edamame/.test(k)) return "soy";
  if (/ryba.*maślan|butterfish|escolar|oilfish/.test(k)) return "butterfish";

  // awersje / preferencje (wybrane)
  if (/broku/.test(k) || /broccoli/.test(k)) return "broccoli";
  if (/stek|rumsztyk|beef steak|sirloin|tenderloin/.test(k)) return "beef_steak";
  if (/kiszon/.test(k) || /sauerkraut/.test(k)) return "sauerkraut";
  if (/jabłk/.test(k) || /apple/.test(k)) return "apple";
  if (/banan/.test(k) || /banana/.test(k)) return "banana";
  if (/pomarańcz|orange/.test(k)) return "orange";

  // choroby (skrótowe)
  if (/nadciśn|hypertension/.test(k)) return "hypertension";
  if (/udar|stroke/.test(k)) return "stroke_history";
  if (/insulin|oporn/.test(k) || /prediabet/.test(k) || /hba1c/.test(k)) return "insulin_resistance";

  return k;
}

function uniq<T>(a: T[]) { return Array.from(new Set(a)); }

// Rozszerzenie aliastów do wykrywania składników w posiłkach (dla dqAgenta)
function expandForbiddenKeywords(keywords: string[]): string[] {
  const out = new Set<string>();
  for (const raw of keywords) {
    const k = canonicalToken(raw);
    switch (k) {
      case "lactose":
        ["mleko","mleko krowie","jogurt","kefir","ser","śmietana","maślanka","serwatka"].forEach(v=>out.add(v));
        break;
      case "soy":
        ["soja","tofu","tempeh","miso","sos sojowy","tamari","mleko sojowe","edamame","izolat białka sojowego","lecytyna sojowa"].forEach(v=>out.add(v));
        break;
      case "butterfish":
        ["ryba maślana","butterfish","escolar","oilfish"].forEach(v=>out.add(v));
        break;
      case "broccoli":
        ["brokuł","brokuły","broccoli"].forEach(v=>out.add(v));
        break;
      default:
        out.add(raw);
    }
  }
  return Array.from(out);
}

// Cele kliniczne zależne od diagnoz
function deriveClinicalTargets(conditions: string[]) {
  const hasHTN = conditions.includes("hypertension") || conditions.some(c=>/nadciśn/.test(c));
  const hasStroke = conditions.includes("stroke_history") || conditions.some(c=>/udar/.test(c));

  const sodiumMaxMg = (hasHTN || hasStroke) ? 1800 : 2300;
  const potassiumMinMg = 3500;
  const fiberTargetG = { min: 30, max: 40 };

  return { sodiumMaxMg, potassiumMinMg, fiberTargetG };
}

function deriveKcalTarget(cpm?: number | null, goal?: string): number | undefined {
  if (!cpm) return undefined;
  const g = (goal || "").toLowerCase();
  if (/loss|redukc/.test(g)) return Math.round(cpm - 500);
  if (/gain|masa/.test(g))   return Math.round(cpm + 300);
  return Math.round(cpm); // maintenance
}

function deriveProteinRange(weightKg?: number | null): { min: number; max: number } | undefined {
  if (!weightKg || weightKg <= 0) return undefined;
  return { min: Math.round(weightKg * 1.2), max: Math.round(weightKg * 1.6) };
}

// ──────────────────────────────────────────────────────────────────────────────
// GŁÓWNA FUNKCJA – używaj jej w agentach
// ──────────────────────────────────────────────────────────────────────────────
export function preparePatientContext(params: {
  userId?: string;
  interviewData?: RawInterview | null;
  medicalData?: RawMedical | null;
}): PatientContext {
  const interview = params.interviewData ?? {};
  const medical   = params.medicalData ?? {};

  // 1) Bazowe listy
  const goal = (interview.goal || "weight_loss") as PatientContext["goal"];

  const conditions = uniq([
    ...ARR(medical.diagnoses),
  ]).map(canonicalToken);

  const allergies = uniq([
    ...ARR(interview.allergies),
    ...ARR(medical.allergies),
  ]).map(canonicalToken);

  const intolerances = uniq([
    ...ARR(interview.intolerances),
    ...ARR(medical.intolerances),
  ]).map(canonicalToken);

  const dislikes = uniq(ARR(interview.dislikes).map(canonicalToken));
  const likes    = uniq(ARR(interview.likes).map(canonicalToken));

  // 2) Godziny i liczba posiłków
  const mealsPerDay = interview.mealsPerDay ?? 4;
  const mealTimes   = (Array.isArray(interview.mealTimes) && interview.mealTimes.length)
    ? interview.mealTimes
    : DEF_MEAL_TIMES;
  const snacksAllowed = Boolean(interview.snacksAllowed ?? false);

  // 3) Cele kliniczne i energetyczne
  const { sodiumMaxMg, potassiumMinMg, fiberTargetG } = deriveClinicalTargets(conditions);
  const kcalTarget = deriveKcalTarget(interview.cpm ?? null, goal);
  const proteinRangeG = deriveProteinRange(interview.weightKg ?? null);

  // 4) Listy dla agentów
  const avoidCore = uniq([...allergies, ...intolerances, ...dislikes]);
  const preferCore = likes;

  const avoidIngredients  = expandForbiddenKeywords(avoidCore);
  const preferIngredients = preferCore; // można rozwinąć mapowaniem, na razie surowe słowa-klucze

  return {
    userId: params.userId,
    goal,
    conditions,
    allergies,
    intolerances,
    dislikes,
    likes,
    mealsPerDay,
    mealTimes,
    snacksAllowed,
    kcalTarget,
    sodiumMaxMg,
    potassiumMinMg,
    fiberTargetG,
    proteinRangeG,
    weightKg: interview.weightKg ?? null,
    cpm: interview.cpm ?? null,
    avoidIngredients,
    preferIngredients,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Pomocnicze „adaptery” dla agentów
// ──────────────────────────────────────────────────────────────────────────────

// Dla dqAgenta – szybkie zbudowanie dqChecks z PatientContext
export function buildDQChecksFromContext(ctx: PatientContext) {
  return {
    avoidIngredients: ctx.avoidIngredients,
    recommendIngredients: ctx.preferIngredients,
    // Jeżeli chcesz – tu można dodać recommendMicros / recommendMacros dynamicznie
  };
}

// Dla dietAgenta – podstawowe parametry generacji
export function buildDietAgentParamsFromContext(ctx: PatientContext) {
  return {
    kcalTarget: ctx.kcalTarget,
    mealsPerDay: ctx.mealsPerDay,
    mealTimes: ctx.mealTimes,
    goal: ctx.goal,
    avoidIngredients: ctx.avoidIngredients,
    preferIngredients: ctx.preferIngredients,
    // można dodać: cuisine, dietModel – jeżeli masz je w interviewData
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// (Opcjonalnie) Loader z Supabase – jeśli chcesz pobierać dane po userId.
// Pozostawiamy zależność jako parametr, by nie wiązać się ścieżką importu.
// ──────────────────────────────────────────────────────────────────────────────
/*
import type { SupabaseClient } from "@supabase/supabase-js";

export async function preparePatientContextByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<PatientContext> {
  // TODO: dopasuj nazwy tabel i kolumn do swojego schematu:
  const { data: patient } = await supabase
    .from("patients")
    .select("interviewData, medical_data, weight, cpm")
    .eq("user_id", userId)
    .single();

  const interview: RawInterview = {
    ...(patient?.interviewData ?? {}),
    weightKg: patient?.weight ?? null,
    cpm: patient?.cpm ?? null,
  };

  const medical: RawMedical = patient?.medical_data ?? {};

  return preparePatientContext({ userId, interviewData: interview, medicalData: medical });
}
*/
