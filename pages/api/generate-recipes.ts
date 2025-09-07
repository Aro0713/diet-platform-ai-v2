// pages/api/generate-recipes.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { generateRecipes } from "@/agents/recipeAgent"; // ⬅️ tak samo jak w generate-diet.ts (generateDiet)

// (opcjonalnie) mały, bezpieczny limit body
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

// --- Normalizacje jak w generate-diet.ts (spójny styl) ---
function normalizeUnit(u: string | null | undefined): "g" | "ml" | "szt" {
  const x = String(u || "").toLowerCase();
  if (["g", "gram", "grams", "gramy"].includes(x)) return "g";
  if (["ml", "milliliter", "milliliters", "mililitry"].includes(x)) return "ml";
  if (["szt", "pcs", "piece", "pieces"].includes(x)) return "szt";
  return "g";
}

function normalizeIngredients(arr: any): Array<{ name: string; amount: number | null; unit: "g" | "ml" | "szt" }> {
  const list = Array.isArray(arr) ? arr : [];
  return list.map((i: any) => ({
    name: String(i?.name ?? i?.product ?? "").trim(),
    amount:
      typeof i?.amount === "number" ? Math.round(i.amount) :
      typeof i?.grams === "number" ? Math.round(i.grams) :
      typeof i?.weight === "number" ? Math.round(i.weight) :
      typeof i?.quantity === "number" ? Math.round(i.quantity) :
      null,
    unit: normalizeUnit(i?.unit),
  }));
}

function normalizeRecipe(r: any) {
  return {
    day: String(r?.day ?? "").trim(),
    meal: String(r?.meal ?? "").trim(),
    title: String(r?.title ?? r?.dish ?? "").trim(),
    time: r?.time ? String(r.time).trim() : undefined,
    ingredients: normalizeIngredients(r?.ingredients),
    instructions: Array.isArray(r?.instructions)
      ? r.instructions.filter((s: any) => typeof s === "string" && s.trim().length > 0).map((s: string) => s.trim())
      : [],
    nutrientSummary: typeof r?.nutrientSummary === "object" && r?.nutrientSummary
      ? r.nutrientSummary
      : undefined,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // Możesz chcieć np. dietPlan + lang + cuisine + nutrientFocus – przekazujemy dalej 1:1
  if (!req.body || !req.body.dietPlan) {
    return res.status(400).send("Brakuje dietPlan w danych wejściowych.");
  }

  try {
    // ⬇️ prosto jak w generate-diet.ts
    const result = await generateRecipes(req.body);

    if (!result || typeof result !== "object" || !Array.isArray(result.recipes)) {
      console.error("❌ Brak pola recipes (array) w odpowiedzi generateRecipes");
      return res.status(500).send("Nie udało się wygenerować przepisów.");
    }

    // Normalizacja przepisów
    const recipes = result.recipes.map(normalizeRecipe);

    // zwięzłe logi do Vercel (bez PII i bez pełnego JSON)
    (() => {
      const total = recipes.length;
      const sample = recipes.slice(0, 2).map(r => `${r.day}/${r.meal}:${r.title}`).join(" ; ");
      console.log(`[recipes] OK — count=${total} sample=${sample}`);
    })();

    return res.status(200).json({ ...result, recipes });
  } catch (err: any) {
    console.error("❌ Błąd generateRecipes:", err?.message || err);
    return res.status(500).send("Błąd generowania przepisów.");
  }
}
