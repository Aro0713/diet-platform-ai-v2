// pages/api/generate-recipes.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { generateRecipes } from "@/agents/recipeAgent";

// (opcjonalnie) mały, bezpieczny limit body
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

type Unit = "g" | "ml" | "szt";
type NormalizedIngredient = { name: string; amount: number | null; unit: Unit };
type NormalizedRecipe = {
  day: string;
  meal: string;
  title: string;
  time?: string;
  ingredients: NormalizedIngredient[];
  instructions: string[];
  nutrientSummary?: Record<string, number>;
};

// --- Normalizacje jak w generate-diet.ts (spójny styl) ---
function normalizeUnit(u: string | null | undefined): Unit {
  const x = String(u || "").toLowerCase();
  if (x === "g" || x.startsWith("gram")) return "g";
  if (x === "ml" || x.startsWith("millil")) return "ml";
  if (x === "szt" || x === "pcs" || x.startsWith("piece")) return "szt";
  return "g";
}

function normalizeIngredients(arr: any): NormalizedIngredient[] {
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

function normalizeRecipe(r: any): NormalizedRecipe {
  return {
    day: String(r?.day ?? "").trim(),
    meal: String(r?.meal ?? "").trim(),
    title: String(r?.title ?? r?.dish ?? "").trim(),
    time: r?.time ? String(r.time).trim() : undefined,
    ingredients: normalizeIngredients(r?.ingredients),
    instructions: Array.isArray(r?.instructions)
      ? r.instructions
          .filter((s: any) => typeof s === "string" && s.trim().length > 0)
          .map((s: string) => s.trim())
      : [],
    nutrientSummary:
      typeof r?.nutrientSummary === "object" && r?.nutrientSummary
        ? r.nutrientSummary
        : undefined,
  };
}

// UI format (zgodny z PDF/komponentem)
type RecipeForUI = {
  dish: string;
  description?: string;
  servings?: number;
  time?: string;
  ingredients: { product: string; weight: number | null; unit: Unit }[];
  steps: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

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
    const recipes: NormalizedRecipe[] = result.recipes.map(normalizeRecipe);

    // 🔁 Zamiana tablicy na słownik { [day]: { [meal]: RecipeForUI } }
    const recipesByDay: Record<string, Record<string, RecipeForUI>> = {};

    for (const r of recipes) {
      const dayKey = r.day || "Inne";
      const mealKey = r.meal || r.title || "posiłek";

      const uiRecipe: RecipeForUI = {
        dish: r.title,
        // te pola mogą nie występować — zachowaj opcjonalnie, z fallbackami:
        description: (r as any).description ?? undefined,
        servings: typeof (r as any).servings === "number" ? (r as any).servings : 1,
        time: r.time,
        // name/amount/unit  →  product/weight/unit
        ingredients: r.ingredients.map(i => ({
          product: i.name,
          weight: i.amount,
          unit: i.unit,
        })),
        // instructions → steps
        steps: r.instructions,
      };

      if (!recipesByDay[dayKey]) recipesByDay[dayKey] = {};
      recipesByDay[dayKey][mealKey] = uiRecipe;
    }

    // zwięzłe logi do Vercel (bez PII i bez pełnego JSON)
    (() => {
      const total = recipes.length;
      const sample = recipes
        .slice(0, 2)
        .map(r => `${r.day}/${r.meal}:${r.title}`)
        .join(" ; ");
      console.log(`[recipes] OK — count=${total} sample=${sample}`);
    })();

    return res.status(200).json({ recipes: recipesByDay });
  } catch (err: any) {
    console.error("❌ Błąd generateRecipes:", err?.message || err);
    return res.status(500).send("Błąd generowania przepisów.");
  }
}
