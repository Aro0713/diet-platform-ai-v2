import type { NextApiRequest, NextApiResponse } from "next";
import { generateDiet } from "@/agents/dietAgent";

// (opcjonalnie) mały, bezpieczny limit body
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

function normalizeIngredients(arr: any[]): any[] {
  const list = Array.isArray(arr) ? arr : [];
  return list.map((i: any) => ({
    product: i?.product ?? i?.name ?? "",
    // akceptujemy grams/weight/quantity; zwracamy liczbę lub null
    weight: typeof i?.grams === "number" ? i.grams
          : typeof i?.weight === "number" ? i.weight
          : typeof i?.quantity === "number" ? i.quantity
          : null,
    unit: i?.unit || "g",
  }));
}

function normalizeMeals(dayData: any): any[] {
  if (Array.isArray(dayData)) {
    return dayData.map((m: any) => ({ ...m, ingredients: normalizeIngredients(m?.ingredients) }));
  }
  if (Array.isArray(dayData?.meals)) {
    return dayData.meals.map((m: any) => ({ ...m, ingredients: normalizeIngredients(m?.ingredients) }));
  }
  return [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { form, interviewData } = req.body || {};
  if (!form || !interviewData) {
    return res.status(400).send("Brakuje wymaganych danych wejściowych.");
  }

  try {
    const result = await generateDiet(req.body);

    if (!result || typeof result !== "object" || !result.dietPlan) {
      console.error("❌ Brak pola dietPlan w odpowiedzi generateDiet");
      return res.status(500).send("Nie udało się wygenerować planu diety.");
    }

    // Normalizacja dni -> posiłków -> składników
    const plan: Record<string, any> = result.dietPlan;
    for (const day of Object.keys(plan)) {
      plan[day] = normalizeMeals(plan[day]);
    }

    // Zwięzły log (bez wypisywania całego JSON)
    try {
      const dayCount = Object.keys(plan).length;
      const mealCount = Object.values(plan).reduce((acc: number, d: any) => acc + (Array.isArray(d) ? d.length : 0), 0);
      console.log(`[diet] OK — days=${dayCount} meals=${mealCount}`);
    } catch {}

    return res.status(200).json({ ...result, dietPlan: plan });
  } catch (err: any) {
    console.error("❌ Błąd generateDiet:", err?.message || err);
    return res.status(500).send("Błąd generowania diety.");
  }
  }
