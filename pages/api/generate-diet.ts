import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent";

/* =========================
   Helpers: JSON & Normalizacja
   ========================= */

type Macros = {
  kcal: number; protein: number; fat: number; carbs: number; fiber: number;
  sodium: number; potassium: number; calcium: number; magnesium: number;
  iron: number; zinc: number; vitaminD: number; vitaminB12: number;
  vitaminC: number; vitaminA: number; vitaminE: number; vitaminK: number;
};

const MACRO_KEYS: (keyof Macros)[] = [
  "kcal","protein","fat","carbs","fiber","sodium","potassium","calcium","magnesium",
  "iron","zinc","vitaminD","vitaminB12","vitaminC","vitaminA","vitaminE","vitaminK"
];

const toNum = (v: any, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

// ➤ Wyciągnij czysty JSON z odpowiedzi LLM (obsługa ```json, //, /* */, dopisków po }).
function extractJsonFromLLM(text: string) {
  if (typeof text !== "string") throw new Error("Input is not text.");

  let s = text
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "");

  // Usuń komentarze
  s = s.replace(/^\s*\/\/.*$/gm, "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");

  const first = s.indexOf("{");
  const last  = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Nie znaleziono pełnego bloku JSON.");
  }

  let candidate = s.slice(first, last + 1);

  // Usuń trailing commas: ,}
  candidate = candidate.replace(/,\s*([}\]])/g, "$1");

  return JSON.parse(candidate);
}

// ➤ Normalizacja składników
function normalizeIngredients(ingredients: any[]) {
  return (ingredients || [])
    .map((i: any) => {
      const weightRaw = i?.weight ?? i?.quantity ?? null;
      const weight = weightRaw === null ? null : toNum(weightRaw, 0);
      const unit = i?.unit || (weight !== null ? "g" : undefined);
      return {
        product: String(i?.product ?? i?.name ?? "").trim(),
        weight,
        unit
      };
    })
    .filter((x: any) => x.product && x.product.toLowerCase() !== "name");
}

// ➤ Normalizacja makr (wymusza liczby)
function normalizeMacros(macros: any): Macros {
  const m: Partial<Macros> = {};
  for (const k of MACRO_KEYS) m[k] = toNum(macros?.[k], 0);
  return m as Macros;
}

// ➤ Normalizacja pojedynczego posiłku
function normalizeMeal(mealKey: string, raw: any) {
  const menu = String(raw?.mealName ?? raw?.name ?? raw?.menu ?? "Posiłek");
  const name = String(mealKey || "Posiłek"); // typ: Śniadanie/Obiad...
  const time = String(raw?.time ?? "00:00");
  return {
    name,         // typ posiłku
    menu,         // nazwa dania
    time,
    glycemicIndex: toNum(raw?.glycemicIndex, 0),
    ingredients: normalizeIngredients(raw?.ingredients || []),
    macros: normalizeMacros(raw?.macros || {})
  };
}

// ➤ Dzień może być tablicą posiłków albo obiektem {Śniadanie:{...}, Obiad:{...}}
function normalizeMealsForDay(dayData: any) {
  if (Array.isArray(dayData)) {
    return dayData
      .filter(x => x && typeof x === "object")
      .map((m, i) => normalizeMeal(String(i + 1), m));
  }
  if (dayData && typeof dayData === "object") {
    return Object.entries(dayData).map(([k, v]) => normalizeMeal(k, v));
  }
  return [];
}

// ➤ Cały plan → { dzień: Meal[] }
function normalizeDietPlan(plan: any): Record<string, any[]> {
  const out: Record<string, any[]> = {};
  if (!plan || typeof plan !== "object") return out;
  for (const day of Object.keys(plan)) {
    out[day] = normalizeMealsForDay(plan[day]);
  }
  return out;
}

// ➤ Ujednolicenie wyniku z różnych kształtów generateDiet
function pickPlanFromResult(rawResult: any) {
  if (!rawResult) return null;

  // 1) { type:"json", content:{ dietPlan } }
  if (rawResult?.type === "json" && rawResult?.content) {
    const c = rawResult.content;
    return c?.dietPlan || c?.correctedDietPlan || null;
  }

  // 2) { dietPlan } lub { correctedDietPlan }
  if (rawResult?.dietPlan || rawResult?.correctedDietPlan) {
    return rawResult.dietPlan || rawResult.correctedDietPlan;
  }

  // 3) { type:"text", content:"```json {...} ..." }
  if (rawResult?.type === "text" && typeof rawResult?.content === "string") {
    const parsed = extractJsonFromLLM(rawResult.content);
    return parsed?.dietPlan || parsed?.correctedDietPlan || parsed;
  }

  // 4) string z JSON-em
  if (typeof rawResult === "string") {
    try {
      const parsed = extractJsonFromLLM(rawResult);
      return parsed?.dietPlan || parsed?.correctedDietPlan || parsed;
    } catch {
      try {
        const parsed = JSON.parse(rawResult);
        return parsed?.dietPlan || parsed?.correctedDietPlan || parsed;
      } catch {
        /* fallthrough */
      }
    }
  }

  return null;
}

/* =========================
   API Handler
   ========================= */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (!req.body?.form || !req.body?.interviewData) {
    return res.status(400).send("Brakuje wymaganych danych wejściowych.");
  }

  try {
    // Główne wywołanie generatora (agent)
    const rawResult = await generateDiet(req.body);

    // Spróbuj wydobyć plan w możliwych kształtach
    let rawPlan = pickPlanFromResult(rawResult);

    if (!rawPlan || typeof rawPlan !== "object") {
      // Czasem agent zwraca treść w polu .content jako string z JSON-em
      if (rawResult?.content && typeof rawResult.content === "string") {
        try {
          const parsed = extractJsonFromLLM(rawResult.content);
          rawPlan = parsed?.dietPlan || parsed?.correctedDietPlan || parsed;
        } catch (e) {
          /* ignore; wpadnie w błąd poniżej */
        }
      }
    }

    if (!rawPlan || typeof rawPlan !== "object") {
      console.error("❌ Brak poprawnego `dietPlan` po generateDiet. Klucze wyniku:", Object.keys(rawResult || {}));
      return res.status(502).json({
        error: "MODEL_INVALID_JSON",
        message: "Model nie zwrócił poprawnego JSON-a z planem diety."
      });
    }

    // Normalizacja do formatu zgodnego z Twoją tabelą (dzień -> Meal[])
    const normalizedPlan = normalizeDietPlan(rawPlan);

    // Diagnostyka zwięzła
    const days = Object.keys(normalizedPlan);
    const meals = days.reduce((a, d) => a + (normalizedPlan[d]?.length || 0), 0);
    console.log(`✅ Plan diety: dni=${days.length}, posiłków=${meals}`);

    // Zwróć wynik – zachowaj inne pola (shoppingList/weeklyOverview), jeśli są
    const base =
      rawResult?.type === "json" && rawResult?.content
        ? rawResult.content
        : rawResult;
    const weeklyOverview = base?.weeklyOverview ?? null;
    const shoppingList = base?.shoppingList ?? null;
    const nutritionalSummary = base?.nutritionalSummary ?? null;

    return res.status(200).json({
      dietPlan: normalizedPlan,
      ...(weeklyOverview ? { weeklyOverview } : {}),
      ...(shoppingList ? { shoppingList } : {}),
      ...(nutritionalSummary ? { nutritionalSummary } : {})
    });
  } catch (err: any) {
    const msg = (err?.message || err || "Błąd generowania diety").toString();
    console.error("❌ generate-diet API error:", msg);

    const isJsonErr = /not valid json|nie znaleziono.*json|json parse/i.test(msg);
    return res.status(isJsonErr ? 502 : 500).json({
      error: isJsonErr ? "MODEL_INVALID_JSON" : "GENERATION_ERROR",
      message: msg
    });
  }
}
