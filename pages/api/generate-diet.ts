import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

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

function sseWrite(res: NextApiResponse, payload: any) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/** ————————————— Next API config —————————————
 * Pozostawiamy bodyParser włączony (parsuje JSON z POST),
 * a odpowiedź wysyłamy jako SSE (res.write + \n\n).
 */
export const config = {
  api: {
    bodyParser: true,
  },
};

/** ————————————— API Handler (SSE streaming) ————————————— */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { form, interviewData, testResults, medicalDescription, lang = "pl" } = req.body || {};
  if (!form || !interviewData) {
    return res.status(400).end("Brakuje wymaganych danych wejściowych.");
  }

  try {
    // Nagłówki SSE (utrzymują połączenie i omijają 300s timeout)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Heartbeat co 15s, żeby połączenie nie zostało ścięte przez edge/proxy
    const ping = setInterval(() => sseWrite(res, { type: "ping", t: Date.now() }), 15000);

    // sygnał startu
    sseWrite(res, { type: "start" });

    // ── Zbuduj prompt wejściowy (tu możesz podmienić na swój pełny prompt z dietAgenta)
    // aby zachować spójność, przekazujemy pełne dane — po stronie modelu masz logikę formatu JSON.
    const prompt = `
You are a clinical dietitian AI. Return valid JSON only.
Input (JSON):
${JSON.stringify({ form, interviewData, testResults, medicalDescription, lang })}
Expected top-level keys: "dietPlan", optionally "weeklyOverview", "shoppingList", "nutritionalSummary".
`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ——— Strumień od OpenAI
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

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        // wyślij „na żywo” tokeny (opcjonalnie pokazywane w UI)
        sseWrite(res, { type: "delta", text: delta });
      }
    }

    // ——— Koniec generowania: spróbuj sparsować JSON
    let parsed: any = null;
    try {
      const clean = fullContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const first = clean.indexOf("{");
      const last = clean.lastIndexOf("}");
      if (first === -1 || last === -1) throw new Error("Brak nawiasów JSON");
      parsed = JSON.parse(clean.slice(first, last + 1));
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
    } catch (e) {
      sseWrite(res, { type: "error", message: "❌ GPT zwrócił niepoprawny JSON — parsowanie nieudane." });
      clearInterval(ping);
      return res.end();
    }

    // ——— Wyciągnij dietPlan z możliwych pól
    let dietPlan = parsed?.dietPlan ?? parsed?.CORRECTED_JSON?.dietPlan ?? parsed?.CORRECTED_JSON;
    if (!dietPlan) {
      sseWrite(res, { type: "error", message: "❌ JSON nie zawiera pola 'dietPlan'." });
      clearInterval(ping);
      return res.end();
    }

    // ——— Napraw kształty i znormalizuj składniki
    dietPlan = repairDietPlanShape(dietPlan);

    for (const day of Object.keys(dietPlan)) {
      if (!Array.isArray(dietPlan[day])) { dietPlan[day] = []; continue; }
      dietPlan[day] = dietPlan[day].map((meal: any) => ({
        ...meal,
        name: meal?.name ?? meal?.mealName ?? "Posiłek",
        menu: meal?.menu ?? meal?.mealName ?? meal?.name ?? "Posiłek",
        time: meal?.time ?? "",
        ingredients: normalizeIngredients(meal?.ingredients),
        // nie dotykamy makr, jeśli są – zachowujemy
        macros: meal?.macros ?? meal?.nutrition ?? undefined,
        glycemicIndex: meal?.glycemicIndex ?? meal?.gi ?? 0,
      }));
    }

    // ——— Opcjonalnie: spróbuj poprawić przez dqAgent (nie przerywaj w razie błędu)
    try {
      const { dqAgent } = await import("@/agents/dqAgent");
      const improved = await dqAgent.run({
        dietPlan,
        model: (typeof form.model === "string" ? form.model.toLowerCase() : form.model),
        goal: interviewData.goal,
        cpm: form.cpm ?? null,
        weightKg: form.weight ?? null,
        conditions: form.conditions ?? [],
        dqChecks: form?.medical_data?.dqChecks ?? {}
      });
      if (improved?.plan) {
        dietPlan = improved.plan;
      }
    } catch (e: any) {
      sseWrite(res, { type: "warn", message: `⚠️ dqAgent nie powiódł się: ${e?.message || "unknown"}` });
    }

    // ——— Finalny event
    sseWrite(res, { type: "final", result: { ...parsed, dietPlan } });

    clearInterval(ping);
    return res.end();
  } catch (err: any) {
    try {
      sseWrite(res, { type: "error", message: `❌ Błąd: ${err?.message || "Nieznany błąd"}` });
    } finally {
      return res.end();
    }
  }
}
