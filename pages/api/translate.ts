import type { NextApiRequest, NextApiResponse } from "next";
import { translateText } from "@/agents/translationAgent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'text'" });
  }

  try {
    const result = await translateText(text);
    res.status(200).json(result);
  } catch (err) {
    console.error("Translation API error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
}
