import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent"; // ✅ funkcja, nie agent

function sseWrite(res: NextApiResponse, payload: any) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
  if (!req.body?.form || !req.body?.interviewData) {
    return res.status(400).end("Brakuje wymaganych danych wejściowych.");
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  (res as any).flushHeaders?.();
  sseWrite(res, { type: "start" });

  try {
    const result = await generateDiet(req.body);   // ✅ wołamy funkcję

    if (!result || typeof result !== "object" || !result.dietPlan) {
      sseWrite(res, { type: "error", message: "❌ Brak dietPlan w wyniku generateDiet" });
      return res.end();
    }

    // (opcjonalnie) delikatna normalizacja składników dla spójności z DietTable
    for (const day of Object.keys(result.dietPlan)) {
      result.dietPlan[day] = (result.dietPlan[day] || []).map((meal: any) => ({
        ...meal,
        ingredients: (meal.ingredients || []).map((i: any) => ({
          product: i?.product ?? i?.name ?? "",
          weight: i?.weight ?? i?.quantity ?? null,
          unit: i?.unit || "g",
        })),
      }));
    }

    sseWrite(res, { type: "final", result });      // 👈 front zamknie spinner
    return res.end();
  } catch (err: any) {
    sseWrite(res, { type: "error", message: `❌ Błąd generateDiet: ${err?.message || "Unknown"}` });
    return res.end();
  }
}
