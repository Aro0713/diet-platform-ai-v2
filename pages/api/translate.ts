import type { NextApiRequest, NextApiResponse } from "next";
import { translatorAgent } from '@/agents/translationAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'text'" });
  }

  try {
    const translations = await translatorAgent.run({ text });

    return res.status(200).json({ translations });
  } catch (err) {
    console.error("❌ Translation API error:", err);
    return res.status(500).json({ error: "Translation failed" });
  }
}
