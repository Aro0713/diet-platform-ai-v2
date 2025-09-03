import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent"; // <-- funkcja (adapter) z dietAgenta

// --- stałe / helpers ---
const DAYS_EN = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
type DayKey = typeof DAYS_EN[number];

function sseWrite(res: NextApiResponse, payload: any) {
  // logi do Vercel (widzisz je w Logs)
  if (payload?.type === "error" || payload?.type === "timeout" || payload?.type === "warn") {
    console[payload.type === "error" ? "error" : "warn"]("[SSE]", payload);
  } else if (payload?.type === "status" || payload?.type === "partial" || payload?.type === "final") {
    console.log("[SSE]", payload.type, payload.phase || payload.day || "ok");
  }
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export const config = { api: { bodyParser: true } };

// prosty timeout dla całego requestu
function startHardTimeout(res: NextApiResponse, pingId: any, ms = 270_000) {
  return setTimeout(() => {
    try { sseWrite(res, { type: "timeout", message: `⏳ server timeout (${ms}ms)`, partial: true }); }
    finally { clearInterval(pingId); res.end(); }
  }, ms);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { form, interviewData, testResults, medicalDescription, lang = "pl" } = req.body || {};
  if (!form || !interviewData) {
    return res.status(400).end("Brakuje wymaganych danych wejściowych.");
  }

  // --- SSE headers + flush ---
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  (res as any).flushHeaders?.();

  sseWrite(res, { type: "status", phase: "sse-open", t: Date.now() });
  sseWrite(res, { type: "start" });

  const ping = setInterval(() => sseWrite(res, { type: "ping", t: Date.now() }), 15_000);
  const hardEnd = startHardTimeout(res, ping, 270_000); // < 300 s Vercel

  try {
    // 1) PRÓBA trybu „dzień-po-dniu”
    const mealsPerDay = Number(interviewData?.mealsPerDay) || 4;
    const partialPlan: Record<DayKey, any[]> = {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    };

    for (let i = 0; i < DAYS_EN.length; i++) {
      const day = DAYS_EN[i];
      sseWrite(res, { type: "status", phase: "day-start", day, progress: Math.round((i / 7) * 100) });

      let singleRes: any | null = null;

      // 1a) jeśli dietAgent umie singleDay — użyj
      try {
        singleRes = await generateDiet({
          form, interviewData, testResults, medicalDescription, lang,
          singleDay: day, mealsPerDay
        });
      } catch (e) {
        console.warn("singleDay failed for", day, e);
      }

      // 1b) fallback: gdy brak singleDay → poproś dietAgenta o CAŁOŚĆ tylko RAZ (na pierwszej iteracji),
      // a potem bierz poszczególne dni z tego wyniku
      if (!singleRes) {
        if (i === 0) {
          sseWrite(res, { type: "status", phase: "agent-run-full" });
          const fullRes = await generateDiet({ form, interviewData, testResults, medicalDescription, lang, mealsPerDay });
          if (!fullRes?.dietPlan) {
            sseWrite(res, { type: "error", message: "❌ dietAgent nie zwrócił dietPlan" });
            clearTimeout(hardEnd); clearInterval(ping); return res.end();
          }
          // zbuforuj całość do partialPlan
          for (const k of Object.keys(fullRes.dietPlan)) {
            const key = (k as string).toLowerCase() as DayKey;
            if ((DAYS_EN as readonly string[]).includes(key)) {
              partialPlan[key] = Array.isArray(fullRes.dietPlan[k]) ? fullRes.dietPlan[k] : [];
            }
          }
        }
      } else {
        // mamy wynik tylko dla danego dnia
        const plan = singleRes?.dietPlan ?? singleRes ?? {};
        partialPlan[day] = Array.isArray(plan[day]) ? plan[day] :
                           Array.isArray(plan?.[day]?.meals) ? plan[day].meals : [];
      }

      // wyślij kawałek do UI od razu
      sseWrite(res, { type: "partial", day, meals: partialPlan[day] || [], progress: Math.min(95, Math.round(((i + 1) / 7) * 100)) });
    }

    // 2) FINISH — pełny plan
    sseWrite(res, { type: "final", result: { dietPlan: partialPlan } });

    clearTimeout(hardEnd);
    clearInterval(ping);
    return res.end();
  } catch (err: any) {
    sseWrite(res, { type: "error", message: `❌ ${err?.message || "Unknown error"}` });
    clearTimeout(hardEnd);
    clearInterval(ping);
    return res.end();
  }
}
