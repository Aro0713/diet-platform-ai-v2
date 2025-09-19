// agents/recipeAgent.ts
import { Agent, run } from "@openai/agents";

/** —————————————————————————————————————————————
 *  KONTEKST KUCHNI (możesz rozbudowywać w 1 miejscu)
 *  ————————————————————————————————————————————— */
const cuisineContextMap: Record<string, string> = {
  "Polska": "Polish cuisine: soups, fermented vegetables, root vegetables, pork, rye bread",
  "Włoska": "Italian cuisine: pasta, olive oil, tomatoes, basil, cheeses like mozzarella and parmesan",
  "Japońska": "Japanese cuisine: rice, miso, seaweed, tofu, sushi, umami-rich dishes",
  "Chińska": "Chinese cuisine: stir-fried dishes, ginger, garlic, soy sauce, rice, noodles",
  "Tajska": "Thai cuisine: coconut milk, chili, lemongrass, coriander, sweet-spicy balance",
  "Wietnamska": "Vietnamese cuisine: fresh herbs, rice noodles, fish sauce, light broths",
  "Indyjska": "Indian cuisine: rich spices, curries, lentils, turmeric, ghee",
  "Koreańska": "Korean cuisine: fermented vegetables, gochujang, rice, grilled meats",
  "Bliskowschodnia": "Middle Eastern: legumes, olive oil, tahini, spices, flatbreads",
  "Francuska": "French: sauces, butter, herbs de Provence, regional meats",
  "Hiszpańska": "Spanish: olive oil, paprika, garlic, seafood, tapas",
  "Skandynawska": "Scandinavian: rye, fish, dairy, root vegetables",
  "Północnoamerykańska": "North American: diverse fusion, whole grains, grilling",
  "Brazylijska": "Brazilian: rice, beans, cassava, tropical fruits",
  "Afrykańska": "African: millet, legumes, peanut stew, bold spices",
  "Dieta arktyczna / syberyjska": "Arctic/Siberian: fish, berries, root vegetables, animal fat"
};

/** —————————————————————————————————————————————
 *  WSPÓLNE INSTRUKCJE (JSON-only, szybkie odpowiedzi)
 *  ————————————————————————————————————————————— */
const BASE_INSTRUCTIONS = `
You are a multilingual professional chef and clinical nutritionist.
Your job is to generate complete, step-by-step cooking recipes for each meal.

STRICT JSON MODE:
- OUTPUT MUST BE PURE JSON. Do NOT include any prose, explanations, or markdown fences. No \`\`\`.
- If you cannot produce recipes, return {"recipes": []}.
- Use only valid JSON (no comments, no trailing commas).

INPUT FORMAT (single JSON string):
{
  "lang": "pl" | "en" | "es" | "fr" | "...",
  "dietPlan": { /* day/meal keys to REUSE AS-IS */ },
  "nutrientFocus": ["iron","vitaminD",...],
  "cuisine": "Polska" | "Włoska" | "...",
  "cuisineNote": "Resolved cuisine profile to follow (authentic)"
}

CRITICAL RULES:
- Reuse EXACT day/meal KEYS from input.dietPlan; do NOT rename or translate the KEYS themselves.
- Translate CONTENT (titles, ingredients, instructions) into input.lang (natural style).
- Follow input.cuisineNote strictly (authentic culinary profile).
- ALWAYS include spices, herbs, fats/oils, and condiments where appropriate.
- Prefer ingredients supporting input.nutrientFocus if provided.
- Units allowed: "g", "ml", "szt". Round amounts sensibly to integers.
- Healthy, realistic methods; short, numbered steps where useful.

OUTPUT SHAPE:
{
  "recipes": [
    {
      "day": "<day key from dietPlan>",
      "meal": "<meal key from dietPlan>",
      "title": "<dish title in input.lang>",
      "time": "HH:MM" | "<short time>",
      "ingredients": [
        { "name": "<string>", "amount": <number>, "unit": "g" | "ml" | "szt" }
      ],
      "instructions": ["step 1", "step 2", "..."],
      "nutrientSummary": { /* optional micronutrients if meaningful */ }
    }
  ]
}

Cuisine context map (reference):
`.trim();

/** —————————————————————————————————————————————
 *  DWA AGENTY: quality (gpt-4o) i fast (gpt-4o-mini)
 *  ————————————————————————————————————————————— */
function buildRecipeAgent(model: string, name: string) {
  return new Agent({
    name,
    model,
    // Krótsze instrukcje + mapka jako JSON (bezpieczne dla tokenów; agent tworzony raz)
    instructions: `${BASE_INSTRUCTIONS}\n${JSON.stringify(cuisineContextMap)}`
  });
}

const recipeAgentQuality = buildRecipeAgent("gpt-4o", "Recipe Agent (Quality)");
const recipeAgentFast = buildRecipeAgent("gpt-4o-mini", "Recipe Agent (Fast)");

/** —————————————————————————————————————————————
 *  Pomocnicze: parser JSON (bez fence’ów) i kompresja wejścia
 *  ————————————————————————————————————————————— */
function tryParseJsonLoose(text: string): any | null {
  const t = String(text || "").trim();
  const noFences = t.replace(/```json|```/g, "").trim();
  // 1) próba wprost
  try { return JSON.parse(noFences); } catch {}
  // 2) wyciągnij największy blok JSON zaczynający się od {
  const match = noFences.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

// Minimalizacja dietPlan -> day/meal/title/ingredients[name,amount,unit]
function shrinkDietPlan(dietPlan: any): any {
  if (!dietPlan || typeof dietPlan !== "object") return dietPlan;

  const prIngredient = (i: any) => ({
    name: String(i?.name ?? i?.product ?? "").trim(),
    amount: typeof i?.amount === "number" ? Math.round(i.amount)
          : typeof i?.grams === "number" ? Math.round(i.grams)
          : typeof i?.weight === "number" ? Math.round(i.weight)
          : typeof i?.quantity === "number" ? Math.round(i.quantity)
          : undefined,
    unit: i?.unit ? String(i.unit) : undefined
  });

  const prMeal = (m: any) => ({
    title: String(m?.title ?? m?.dish ?? "").trim() || undefined,
    ingredients: Array.isArray(m?.ingredients) ? m.ingredients.map(prIngredient) : undefined
  });

  // Obsłuż 2 typy struktur: słownik { day: { meal: {...} } } lub tablica dni
  if (Array.isArray(dietPlan)) {
    return dietPlan.map((day: any) => {
      const dayKey = String(day?.day || day?.name || day?.title || "").trim() || "Dzień";
      const mealsSrc = Array.isArray(day?.meals)
        ? day.meals
        : Object.entries(day || {})
            .filter(([k]) => k !== "day")
            .map(([mealKey, m]) => ({ key: mealKey, ...m as any }));

      const reduced: Record<string, any> = {};
      for (const m of mealsSrc) {
        const key = String((m as any)?.meal || (m as any)?.key || (m as any)?.title || "").trim() || "posiłek";
        reduced[key] = prMeal(m);
      }
      return { [dayKey]: reduced };
    }).reduce((acc: any, o: any) => Object.assign(acc, o), {});
  } else {
    const out: Record<string, any> = {};
    for (const [dayKey, meals] of Object.entries(dietPlan)) {
      const reduced: Record<string, any> = {};
      for (const [mealKey, m] of Object.entries(meals as any || {})) {
        reduced[mealKey] = prMeal(m);
      }
      out[dayKey] = reduced;
    }
    return out;
  }
}

/** —————————————————————————————————————————————
 *  Publiczny wrapper: generateRecipes()
 *  ————————————————————————————————————————————— */
type GenerateRecipesInput = {
  lang?: string;
  cuisine?: string;
  dietPlan: any;
  nutrientFocus?: string[];
  modelHint?: "fast" | "quality";
};

export async function generateRecipes(input: GenerateRecipesInput): Promise<{ recipes: any[] }> {
  const {
    lang = "pl",
    cuisine,
    dietPlan,
    nutrientFocus = [],
    modelHint = "quality"
  } = input || ({} as GenerateRecipesInput);

  const cuisineNote = cuisineContextMap[cuisine || ""] || "general culinary tradition";

  // DODATKOWA KOMPRESJA (na wypadek wołań spoza batchowanego handlera)
  const compactDietPlan = shrinkDietPlan(dietPlan);

  const userPayload = {
    lang,
    nutrientFocus,
    cuisine,
    cuisineNote,
    // Klucze day/meal mają zostać użyte 1:1 — compakt zachowuje klucze
    dietPlan: compactDietPlan
  };

  // Wybór agenta w locie
  const agent = modelHint === "fast" ? recipeAgentFast : recipeAgentQuality;

  // starsze SDK: run(agent, input: string)
  const result: any = await run(agent, JSON.stringify(userPayload));
  const text = String(
    result?.finalOutput ??
    result?.output_text ??
    ""
  ).trim();

  const parsed = tryParseJsonLoose(text);

  // Twarde wymuszenie struktury
  if (!parsed || typeof parsed !== "object") return { recipes: [] };

  if (Array.isArray((parsed as any).recipes)) {
    return parsed as { recipes: any[] };
  }

  // fallback: jeśli agent zwrócił słownik { day: { meal: {...} } }
  if ((parsed as any).recipes && typeof (parsed as any).recipes === "object") {
    const arr: any[] = [];
    for (const [day, meals] of Object.entries((parsed as any).recipes as Record<string, any>)) {
      for (const [meal, body] of Object.entries(meals || {})) {
        arr.push({ day, meal, ...(body as any) });
      }
    }
    return { recipes: arr };
  }

  return { recipes: [] };
}

// (opcjonalnie) eksport mapy kuchni
export { cuisineContextMap };
