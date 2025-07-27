import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const result = await generateDiet(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Błąd generateDiet:", err);
    res.status(500).send("Błąd generowania diety.");
  }
}
