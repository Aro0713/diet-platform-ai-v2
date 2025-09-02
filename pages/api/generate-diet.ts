import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

/** ───────────────────── Helpers ───────────────────── */

function isNumericKeyObject(o: any): boolean {
  return !!(o && typeof o === "object" && !Array.isArray(o) &&
    Object.keys(o).some(k => /^\d+$/.test(k)));
}

function isTimeKey(k: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(k);
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

/** ── Dni tygodnia: kanoniczne klucze EN (dolny zapis) ───────────────── */

const DAYS_EN = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
type DayKeyEn = typeof DAYS_EN[number];

function normalizeDayKeyRaw(s: any): string {
  return (s ?? "").toString().trim().toLowerCase()
    .normalize("NFD")
    // @ts-ignore
    .replace(/\p{Diacritic}/gu, "");
}

const DAY_ALIASES_TO_EN: Record<string, DayKeyEn> = {
  // EN
  "monday":"monday","mon":"monday","1":"monday","01":"monday",
  "tuesday":"tuesday","tue":"tuesday","2":"tuesday","02":"tuesday",
  "wednesday":"wednesday","wed":"wednesday","3":"wednesday","03":"wednesday",
  "thursday":"thursday","thu":"thursday","thur":"thursday","4":"thursday","04":"thursday",
  "friday":"friday","fri":"friday","5":"friday","05":"friday",
  "saturday":"saturday","sat":"saturday","6":"saturday","06":"saturday",
  "sunday":"sunday","sun":"sunday","7":"sunday","07":"sunday",
  // PL (bez znaków)
  "poniedzialek":"monday",
  "wtorek":"tuesday",
  "sroda":"wednesday",
  "czwartek":"thursday",
  "piatek":"friday",
  "sobota":"saturday",
  "niedziela":"sunday",
};

function toEnglishDayKey(input: any): DayKeyEn {
  const raw = normalizeDayKeyRaw(input);
  if ((DAYS_EN as readonly string[]).includes(raw)) return raw as DayKeyEn;
  return DAY_ALIASES_TO_EN[raw] ?? "monday";
}

// Rekey: dowolne klucze → EN, oraz dopełnij brakujące dni pustą tablicą
function rekeyDietPlanToEnglish(dietPlan: Record<string, any[]>): Record<DayKeyEn, any[]> {
  const tmp: Partial<Record<DayKeyEn, any[]>> = {};
  for (const [k, v] of Object.entries(dietPlan || {})) {
    tmp[toEnglishDayKey(k)] = Array.isArray(v) ? v : [];
  }
  const out = {} as Record<DayKeyEn, any[]>;
  for (const d of DAYS_EN) out[d] = tmp[d] ?? [];
  return out;
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
    // { meals: [...] }
    if (val && typeof val === "object" && !Array.isArray(val) && Array.isArray((val as any).meals)) {
      out[day] = (val as any).meals;
      continue;
    }
    // [ { "0": {...}, "1": {...}, ... } ]
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
    // mapa godzin
    if (val && typeof val === "object" && !Array.isArray(val) && Object.keys(val).some(isTimeKey)) {
      out[day] = toArrayFromTimeMap(val as Record<string, any>);
      continue;
    }
    // już tablica
    if (Array.isArray(val)) {
      out[day] = val as any[];
      continue;
    }
    // fallback
    out[day] = [val as any];
  }

  return out;
}

function sseWrite(res: NextApiResponse, payload: any) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function extractJSONObject(raw: string): any {
  const clean = raw
    .replace(/^\s*CORRECTED_JSON\s*=\s*/i, "")
    .replace(/```(?:json)?/g, "")
    .trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM did not return a JSON object");
  }
  const slice = clean.slice(start, end + 1);
  try { return JSON.parse(slice); }
  catch { return JSON.parse(JSON.parse(slice)); }
}

/** ───────────────────── Next API config ───────────────────── */
export const config = {
  api: { bodyParser: true },
};

/** ───────────────────── API Handler (SSE streaming) ───────────────────── */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { form, interviewData, testResults, medicalDescription, lang = "pl" } = req.body || {};
  if (!form || !interviewData) {
    return res.status(400).end("Brakuje wymaganych danych wejściowych.");
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof (res as any).flushHeaders === "function") (res as any).flushHeaders();
  sseWrite(res, { type: "status", phase: "sse-open", t: Date.now() });

  const ping = setInterval(() => sseWrite(res, { type: "ping", t: Date.now() }), 15000);

  try {
    sseWrite(res, { type: "start" });

    const mealsPerDay = Number(interviewData?.mealsPerDay) || 4;

    // ——— PROMPT: kanoniczne dni EN + 7-dni + liczba posiłków
    const prompt = `
You are a clinical dietitian AI. Return valid JSON ONLY (no code fences, no labels).

Requirements:
- Produce a complete 7-day plan.
- Use day keys EXACTLY as: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] (lowercase English).
- For EACH day, include EXACTLY ${mealsPerDay} meals.
- Each meal must be an object with:
  { name, mealType ("breakfast"|"lunch"|"dinner"|"snack"), time ("HH:MM"),
    ingredients: [{ product, weight (number), unit ("g"|"ml") }],
    macros (optional numeric fields if provided) }
- Do NOT use "items"; only "ingredients".
- Top-level MUST be: { "dietPlan": { "<day>": [ ... ] } }

Input (JSON):
${JSON.stringify({ form, interviewData, testResults, medicalDescription, lang })}
`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ——— Strumień od OpenAI
    sseWrite(res, { type: "status", phase: "openai-call-start" });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a clinical dietitian AI. Return valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      stream: true
    });

    let fullContent = "";
    let sawChunk = false;
    for await (const chunk of stream) {
      const delta = (chunk as any)?.choices?.[0]?.delta?.content;
      if (!sawChunk) {
        sawChunk = true;
        sseWrite(res, { type: "status", phase: "openai-stream-first-chunk" });
      }
      if (delta) {
        fullContent += delta;
        sseWrite(res, { type: "delta", text: delta });
      }
    }
    if (!sawChunk) sseWrite(res, { type: "warn", message: "OpenAI stream returned no chunks" });
    sseWrite(res, { type: "status", phase: "openai-stream-end" });

    if (!fullContent.trim()) {
      sseWrite(res, { type: "error", message: "LLM returned empty response" });
      clearInterval(ping);
      return res.end();
    }

    // ——— Parsowanie
    let parsed: any = null;
    try { parsed = extractJSONObject(fullContent); }
    catch {
      sseWrite(res, { type: "error", message: "❌ GPT zwrócił niepoprawny JSON — parsowanie nieudane." });
      clearInterval(ping);
      return res.end();
    }

    // ——— Wyciągnięcie planu
    let dietPlan: any =
      parsed?.dietPlan ??
      parsed?.CORRECTED_JSON?.dietPlan ??
      parsed?.CORRECTED_JSON;

    if (!dietPlan && Array.isArray(parsed?.meals)) {
      dietPlan = parsed.meals;
    }
    if (!dietPlan) {
      sseWrite(res, { type: "error", message: "❌ JSON nie zawiera pola 'dietPlan' ani 'meals'." });
      clearInterval(ping);
      return res.end();
    }

    // ——— Zamiana płaskiego na słownik dni
    if (Array.isArray(dietPlan)) {
      const byDay: Record<string, any[]> = {};
      for (const m of dietPlan) {
        const d = toEnglishDayKey(m?.day ?? "monday");
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(m);
      }
      dietPlan = byDay;
    }

    // ——— Naprawy i normalizacja
    dietPlan = repairDietPlanShape(dietPlan);
    dietPlan = rekeyDietPlanToEnglish(dietPlan); // ✅ zawsze 7 kluczy: monday..sunday

    for (const day of Object.keys(dietPlan)) {
      if (!Array.isArray(dietPlan[day])) { dietPlan[day] = []; continue; }

      dietPlan[day] = dietPlan[day].map((meal: any) => {
        let macros = meal?.macros ?? meal?.nutrition ?? meal?.nutrients ?? undefined;
        if (macros && typeof macros === "object") {
          const cleanNum = (v: any) => {
            if (typeof v === "number") return v;
            if (typeof v === "string") {
              const m = v.replace(",", ".").match(/-?\d+(\.\d+)?/);
              return m ? parseFloat(m[0]) : undefined;
            }
            return undefined;
          };
          macros = {
            calories:    cleanNum((macros as any).calories ?? (macros as any).kcal),
            protein:     cleanNum((macros as any).protein),
            fat:         cleanNum((macros as any).fat),
            carbs:       cleanNum((macros as any).carbohydrates ?? (macros as any).carbs),
            fiber:       cleanNum((macros as any).fiber),
            sodium:      cleanNum((macros as any).sodium),
            potassium:   cleanNum((macros as any).potassium),
            magnesium:   cleanNum((macros as any).magnesium),
            iron:        cleanNum((macros as any).iron),
            zinc:        cleanNum((macros as any).zinc),
            calcium:     cleanNum((macros as any).calcium),
            vitaminD:    cleanNum((macros as any).vitaminD),
            vitaminB12:  cleanNum((macros as any).vitaminB12),
            vitaminC:    cleanNum((macros as any).vitaminC),
            vitaminA:    cleanNum((macros as any).vitaminA),
            vitaminE:    cleanNum((macros as any).vitaminE),
            vitaminK:    cleanNum((macros as any).vitaminK),
          };
        }

        return {
          ...meal,
          // dzień zostaje w kluczu słownika — nie nadpisujemy
          name: meal?.name ?? meal?.mealName ?? "Posiłek",
          menu: meal?.menu ?? meal?.mealName ?? meal?.name ?? "Posiłek",
          mealType: meal?.mealType ?? meal?.type ?? undefined,
          time: meal?.time ?? "",
          ingredients: normalizeIngredients(meal?.ingredients),
          macros,
          glycemicIndex: meal?.glycemicIndex ?? meal?.gi ?? 0,
        };
      });
    }

    // ——— dqAgent tylko jeśli mamy dane
    const everyMealEmpty = Object.values(dietPlan).every((arr: any) =>
      Array.isArray(arr) && arr.every((m: any) => {
        const hasIngr = Array.isArray(m?.ingredients) && m.ingredients.length > 0;
        const hasMacros = m?.macros && typeof m.macros === "object" &&
          Object.values(m.macros).some((v: any) => typeof v === "number" && isFinite(v));
        return !hasIngr && !hasMacros;
      })
    );

    if (everyMealEmpty) {
      sseWrite(res, { type: "warn", message: "⚠️ Plan nie zawiera składników ani makr – pomijam dqAgent." });
    } else {
      // dqAgent expects: Record<string, Record<string, Meal>>
      const structuredForDQ: Record<string, Record<string, any>> = {};
      for (const day of Object.keys(dietPlan)) {
        const arr = Array.isArray(dietPlan[day]) ? dietPlan[day] : [];
        structuredForDQ[day] = {};
        arr.forEach((meal: any, idx: number) => {
          const key = (meal?.mealType && typeof meal.mealType === "string")
            ? meal.mealType
            : `m${idx}`;
          structuredForDQ[day][key] = {
            ...meal,
            name: meal?.name ?? meal?.mealName ?? "Posiłek",
            time: meal?.time ?? "",
            ingredients: Array.isArray(meal?.ingredients) ? meal.ingredients : [],
            macros: meal?.macros ?? undefined,
            glycemicIndex: meal?.glycemicIndex ?? meal?.gi ?? 0,
          };
        });
      }

      try {
        const { dqAgent } = await import("@/agents/dqAgent");
        const improved = await dqAgent.run({
          dietPlan: structuredForDQ,
          model: (typeof form.model === "string" ? form.model.toLowerCase() : form.model),
          goal: interviewData.goal,
          cpm: form.cpm ?? null,
          weightKg: form.weight ?? null,
          conditions: form.conditions ?? [],
          dqChecks: form?.medical_data?.dqChecks ?? {}
        });
        if (improved?.plan && typeof improved.plan === "object") {
          // upewnij się, że pozostajemy przy EN kluczach:
          dietPlan = rekeyDietPlanToEnglish(improved.plan as any);
        }
      } catch (e: any) {
        sseWrite(res, { type: "warn", message: `⚠️ dqAgent nie powiódł się: ${e?.message || "unknown"}` });
      }
    }

    // ——— Finalny event
    sseWrite(res, { type: "final", result: { ...parsed, dietPlan } });

    clearInterval(ping);
    return res.end();
  } catch (err: any) {
    try {
      sseWrite(res, { type: "error", message: `❌ Błąd: ${err?.message || "Nieznany błąd"}` });
    } finally {
      clearInterval(ping);
      return res.end();
    }
  }
}
