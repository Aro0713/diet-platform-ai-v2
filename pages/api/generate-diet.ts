import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent";

function normalizeIngredients(ingredients: any[]) {
  return (ingredients || []).map(i => ({
    product: i.product ?? i.name ?? "",
    weight: i.weight ?? i.quantity ?? null, // 🔹 zamiana quantity → weight
    unit: i.unit || "g"
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  if (!req.body?.form || !req.body?.interviewData) {
    return res.status(400).send("Brakuje wymaganych danych wejściowych.");
  }

  try {
    const result = await generateDiet(req.body);

    if (!result || typeof result !== "object" || !result.dietPlan) {
      console.error("❌ Błąd: brak dietPlan w wyniku generateDiet");
      return res.status(500).send("Nie udało się wygenerować planu diety.");
    }

    // 🔹 Normalizacja składników we wszystkich dniach i posiłkach
    for (const day of Object.keys(result.dietPlan)) {
      result.dietPlan[day] = result.dietPlan[day].map((meal: any) => ({
        ...meal,
        ingredients: normalizeIngredients(meal.ingredients)
      }));
    }

    // ✅ Diagnostyka - sprawdź, czy plan zawiera makroskładniki
    console.log("✅ Zwrócony plan diety:", JSON.stringify(result.dietPlan, null, 2));

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Błąd generateDiet:", err);
    res.status(500).send("Błąd generowania diety.");
  }
}
