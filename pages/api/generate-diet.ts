import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent"; // ← funkcja, nie „agent”

/** ─ helpers ─ */
const DAYS_EN = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
type DayKey = typeof DAYS_EN[number];

function sseWrite(res: NextApiResponse, payload: any) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
  const { form, interviewData, testResults, medicalDescription, lang = "pl" } = req.body || {};
  if (!form || !interviewData) return res.status(400).end("Brakuje wymaganych danych wejściowych.");

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  (res as any).flushHeaders?.();

  sseWrite(res, { type: "start" });

  // Hard timeout < 300s
  const ping = setInterval(() => sseWrite(res, { type: "ping", t: Date.now() }), 15000);
  const hardEnd = setTimeout(() => {
    try { sseWrite(res, { type: "timeout", message: "⏳ server timeout (270s)", partial: true }); }
    finally { clearInterval(ping); res.end(); }
  }, 270_000);

  try {
    const mealsPerDay = Number(interviewData?.mealsPerDay) || 4;
    const full: Record<DayKey, any[]> = {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    };

    // Generuj dzień po dniu (7 krótszych kroków)
    for (let i = 0; i < DAYS_EN.length; i++) {
      const day = DAYS_EN[i];
      const progress = Math.round(((i) / DAYS_EN.length) * 100);
      sseWrite(res, { type: "status", phase: "day-start", day, progress });

      // ❶ Spróbuj poprosić agenta tylko o jeden dzień (jeśli obsługuje)
      let result: any;
      try {
        result = await generateDiet({
          form, interviewData, testResults, medicalDescription, lang,
          singleDay: day, mealsPerDay
        });
      } catch (e: any) {
        // ❷ fallback: gdy agent nie wspiera singleDay — wygeneruj całość i wyciągnij dzień
        if (!result) {
          const whole = await generateDiet({ form, interviewData, testResults, medicalDescription, lang, mealsPerDay });
          result = { dietPlan: (whole?.dietPlan ?? whole ?? {}) };
        }
      }

      const plan = result?.dietPlan ?? result ?? {};
      const dayMeals: any[] =
        Array.isArray(plan[day]) ? plan[day] :
        Array.isArray(plan?.[day]?.meals) ? plan[day].meals :
        [];

      full[day] = dayMeals;

      // wyślij fragment do UI (tabela dorysuje kolumnę)
      sseWrite(res, { type: "partial", day, meals: dayMeals, progress: Math.min(progress + 10, 99) });
    }

    sseWrite(res, { type: "final", result: { dietPlan: full } });
    clearTimeout(hardEnd); clearInterval(ping);
    return res.end();
  } catch (err: any) {
    try { sseWrite(res, { type: "error", message: `❌ ${err?.message || "Unknown error"}` }); }
    finally { clearTimeout(hardEnd); clearInterval(ping); res.end(); }
  }
}
