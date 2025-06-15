import { Meal } from "@/types";
import { validateDietWithModel } from "@/utils/validateDiet";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { dietPlan, model, weightKg } = req.body;

    if (!dietPlan || !model) {
      return res.status(400).send("Missing required fields: dietPlan, model");
    }

    const issues = validateDietWithModel(Object.values(dietPlan).flat() as Meal[], model);
    const isValid = issues.length === 0;

    res.status(200).json({ isValid, issues });

  } catch (err) {
    console.error("❌ Validation error:", err);
    res.status(500).send("Internal Server Error");
  }
}
