import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent";

/** ————————————— Helpers ————————————— */

function isNumericKeyObject(o: any): boolean {
  return !!(o && typeof o === "object" && !Array.isArray(o) &&
    Object.keys(o).some(k => /^\d+$/.test(k)));
}

function isTimeKey(k: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(k); // np. 7:30 lub 07:30
}

function toArrayFromTimeMap(obj: Record<string, any>): any[] {
  return Object.entries(obj)
    .filter(([_, v]) => v && typeof v === "object")
    .sort(([a], [b]) => (isTimeKey(a) && isTimeKey(b)) ? a.localeCompare(b) : 0)
    .map(([_, v]) => v);
}

function coerceNumber(n: any): number | null {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string") {
    const parsed = parseFloat(n.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeIngredients(ingredients: any[]) {
  return (ingredients || []).map(i => {
    const weightRaw = i?.weight ?? i?.quantity ?? null;
    const weight = coerceNumber(weightRaw);
    const unit = i?.unit || (weight !== null ? "g" : undefined);
    return {
      product: i?.product ?? i?.name ?? "",
      weight,
      unit
    };
  });
}

/**
 * Naprawia „kształt” planu zanim przejdziemy do normalizacji składników:
 *  - { day: { meals: [...] } }           -> { day: [...] }
 *  - { day: [ { "0": {...}, ... } ] }    -> { day: [...] }
 *  - { day: { "07:30": {...}, ... } }    -> { day: [...] }
 *  - { day: [...poprawne... ] }          -> bez zmian
 */
function repairDietPlanShape(plan: any): Record<string, any[]> {
  if (!plan || typeof plan !== "object") return {};
  const out: Record<string, any[]> = {};

  for (const [day, val] of Object.entries(plan)) {
    // CASE 1: { meals: [...] }
    if (val && typeof val === "object" && !Array.isArray(val) && Array.isArray((val as any).meals)) {
      out[day] = (val as any).meals;
      continue;
    }

    // CASE 2: [ { "0": {...}, "1": {...}, ..., "ingredients": [] } ]
    if (Array.isArray(val) && val.length === 1 && isNumericKeyObject(val[0])) {
      const obj = val[0] as Record<string, any>;
      const meals = Object.keys(obj)
        .filter(k => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b))
        .map(k => obj[k])
        .filter(Boolean);
      out[day] = meals;
      continue;
    }

    // CASE 3: mapa godzin { "07:30": {...}, ... }
    if (val && typeof val === "object" && !Array.isArray(val) && Object.keys(val).some(isTimeKey)) {
      out[day] = toArrayFromTimeMap(val as Record<string, any>);
      continue;
    }

    // CASE 4: już poprawna tablica
    if (Array.isArray(val)) {
      out[day] = val as any[];
      continue;
    }

    // Ostateczny fallback: pojedynczy obiekt -> tablica
    out[day] = [val as any];
  }

  return out;
}

/** ————————————— API Handler ————————————— */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (!req.body?.form || !req.body?.interviewData) {
    return res.status(400).send("Brakuje wymaganych danych wejściowych.");
  }

  try {
    const result = await generateDiet(req.body);

    if (!result || typeof result !== "object" || !result.dietPlan) {
      console.error("❌ Błąd: brak dietPlan w wyniku generateDiet");
      return res.status(500).send("Nie udało się wygenerować planu diety.");
    }

    // 🔧 1) Najpierw wyprostuj „kształty” dnia → wszędzie: day -> Meal[]
    result.dietPlan = repairDietPlanShape(result.dietPlan);

    // 🔧 2) Normalizacja składników (po naprawie kształtu), bez dotykania macros
    for (const day of Object.keys(result.dietPlan)) {
      // zabezpieczenie: jeśli coś popłynie, zrzuć do []
      if (!Array.isArray(result.dietPlan[day])) {
        console.warn(`⚠️  Dzień "${day}" nie jest tablicą po naprawie kształtu. Fallback do [].`);
        result.dietPlan[day] = [];
        continue;
      }

      result.dietPlan[day] = result.dietPlan[day].map((meal: any) => {
        const normalized = {
          ...meal,
          // zachowaj nazwy, ale ustaw sensowne fallbacki
          name: meal?.name ?? meal?.mealName ?? "Posiłek",
          menu: meal?.menu ?? meal?.mealName ?? meal?.name ?? "Posiłek",
          time: meal?.time ?? "",
          ingredients: normalizeIngredients(meal?.ingredients),
          // 🧪 makra zostają jakie były — niczego nie zerujemy.
          macros: meal?.macros ?? meal?.nutrition ?? undefined,
          glycemicIndex: meal?.glycemicIndex ?? meal?.gi ?? 0,
        };
        return normalized;
      });
    }

    // ✅ Diagnostyka — pokaż już naprawiony i znormalizowany plan
    console.log("✅ Zwrócony plan diety (po naprawie i normalizacji):",
      JSON.stringify(result.dietPlan, null, 2)
    );

    // 🔍 Dodatkowa, miękka walidacja (log only): czy jakiekolwiek macros istnieją?
    const hasAnyMacros =
      Object.values(result.dietPlan)
        .flat()
        .some((m: any) => m?.macros && Object.values(m.macros).some((v: any) => coerceNumber(v) !== null && coerceNumber(v)! > 0));

    if (!hasAnyMacros) {
      console.warn("⚠️  Plan wygląda na pozbawiony wartości odżywczych (wszystko puste/0). Sprawdź źródło GPT.");
      // Nie przerywamy — frontend i tak pokaże, a dqAgent/calculateMealMacros mogą uzupełnić.
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Błąd generateDiet:", err);
    res.status(500).send("Błąd generowania diety.");
  }
}

