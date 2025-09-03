import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent"; 

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

// --- CACHE na pełny plan, gdy agent zwróci od razu wszystko
let cachedFull: Record<DayKey, any[]> | null = null;

// pomoc: mapuj PL -> EN klucze jeśli trzeba
const mapDayKeyToEn = (k: string): DayKey => {
  const n = k.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const dict: Record<string, DayKey> = {
    poniedzialek: "monday", wtorek: "tuesday", sroda: "wednesday",
    czwartek: "thursday", piatek: "friday", sobota: "saturday", niedziela: "sunday",
    monday:"monday", tuesday:"tuesday", wednesday:"wednesday",
    thursday:"thursday", friday:"friday", saturday:"saturday", sunday:"sunday",
  };
  return dict[n] ?? "monday";
};

const extractWeekToCache = (raw: any): Record<DayKey, any[]> | null => {
  const src = raw?.dietPlan ?? raw ?? null;
  if (!src || typeof src !== "object") return null;
  const out: Record<DayKey, any[]> = {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  };
  let seen = 0;
  for (const [k, v] of Object.entries(src)) {
    const key = mapDayKeyToEn(k);
    const arr = Array.isArray(v) ? v : Array.isArray((v as any).meals) ? (v as any).meals : null;
    if (arr) { out[key] = arr; seen++; }
  }
  return seen > 1 ? out : null; // >1 dnia = to raczej pełny tydzień
};

// 🚀 Główna pętla (ale respektuje cache)
for (let i = 0; i < DAYS_EN.length; i++) {
  const day = DAYS_EN[i];
  sseWrite(res, { type: "status", phase: "day-start", day, progress: Math.round((i / 7) * 100) });

  // jeśli mamy cache pełnego tygodnia, nie wołamy już agenta — tylko streamujemy
  if (cachedFull) {
    sseWrite(res, { type: "partial", day, meals: cachedFull[day] || [], progress: Math.min(95, Math.round(((i + 1) / 7) * 100)) });
    // po ostatnim dniu zamknij
    if (i === DAYS_EN.length - 1) {
      sseWrite(res, { type: "final", result: { dietPlan: cachedFull } });
      clearTimeout(hardEnd); clearInterval(ping);
      return res.end();
    }
    continue;
  }

  // spróbuj singleDay
  let singleRes: any | null = null;
  try {
    singleRes = await generateDiet({
      form, interviewData, testResults, medicalDescription, lang,
      singleDay: day, mealsPerDay
    });
  } catch {}

  // ⬇️ jeśli odpowiedź singleDay ZAWIERA cały tydzień — zbuforuj i natychmiast wyślij resztę
  const maybeWeekFromSingle = extractWeekToCache(singleRes);
  if (maybeWeekFromSingle) {
    cachedFull = maybeWeekFromSingle;
    // wyślij bieżący dzień
    sseWrite(res, { type: "partial", day, meals: cachedFull[day] || [], progress: Math.min(95, Math.round(((i + 1) / 7) * 100)) });
    // dostreamuj pozostałe dni BEZ dalszych wywołań agenta
    for (let j = i + 1; j < DAYS_EN.length; j++) {
      const d = DAYS_EN[j];
      sseWrite(res, { type: "partial", day: d, meals: cachedFull[d] || [], progress: Math.min(95, Math.round(((j + 1) / 7) * 100)) });
    }
    sseWrite(res, { type: "final", result: { dietPlan: cachedFull } });
    clearTimeout(hardEnd); clearInterval(ping);
    return res.end();
  }

  if (!singleRes) {
    // fallback: wygeneruj RAZ pełny plan i zcache’uj
    if (i === 0) {
      sseWrite(res, { type: "status", phase: "agent-run-full" });
      const fullRes = await generateDiet({ form, interviewData, testResults, medicalDescription, lang, mealsPerDay });
      const maybeWeek = extractWeekToCache(fullRes);
      if (!maybeWeek) {
        sseWrite(res, { type: "error", message: "❌ dietAgent nie zwrócił dietPlan" });
        clearTimeout(hardEnd); clearInterval(ping); return res.end();
      }
      cachedFull = maybeWeek;
    } else {
      // jeśli nie mamy cache, a to nie pierwszy dzień — to i tak bez sensu wołać agenta kolejny raz
      sseWrite(res, { type: "warn", message: "⚠️ Missing cache; skipping extra agent call" });
      cachedFull = { monday:[],tuesday:[],wednesday:[],thursday:[],friday:[],saturday:[],sunday:[] };
    }
  } else {
    // normalna ścieżka: singleDay zwrócił tylko jeden dzień
    const plan = singleRes?.dietPlan ?? singleRes ?? {};
    const dayMeals = Array.isArray(plan[day]) ? plan[day] :
                     Array.isArray(plan?.[day]?.meals) ? plan[day].meals : [];
    sseWrite(res, { type: "partial", day, meals: dayMeals, progress: Math.min(95, Math.round(((i + 1) / 7) * 100)) });
  }

  // jeśli właśnie powstał cache pełnego planu — od razu dostreamuj resztę i kończ
  if (cachedFull) {
    // bieżący dzień mógł nie być wypchnięty — zadbaj o to
    if (cachedFull[day] && (i === 0 || !singleRes)) {
      sseWrite(res, { type: "partial", day, meals: cachedFull[day] || [], progress: Math.min(95, Math.round(((i + 1) / 7) * 100)) });
    }
    for (let j = i + 1; j < DAYS_EN.length; j++) {
      const d = DAYS_EN[j];
      sseWrite(res, { type: "partial", day: d, meals: cachedFull[d] || [], progress: Math.min(95, Math.round(((j + 1) / 7) * 100)) });
    }
    sseWrite(res, { type: "final", result: { dietPlan: cachedFull } });
    clearTimeout(hardEnd); clearInterval(ping);
    return res.end();
  }
}
// (gdyby pętla przeszła bez cache — tu można jeszcze wysłać empty final)
sseWrite(res, { type: "final", result: { dietPlan: {} } });
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