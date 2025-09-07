// agents/recipeAgent.ts
import { Agent, run } from "@openai/agents";

// ✅ Mapa kuchni świata (możesz rozszerzać w jednym miejscu)
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

// 🔐 UWAGA: „Agent” NIE przyjmuje tu temperature/response_format — same core pola.
export const recipeAgent = new Agent({
  name: "Recipe Agent",
  model: "gpt-4o",
  instructions: `
You are a multilingual professional chef and clinical nutritionist.

Your job is to generate complete, step-by-step cooking recipes for each meal in a 7-day dietary plan.

INPUT FORMAT (you receive a single JSON string):
{
  "lang": "pl" | "en" | "es" | "fr" | ...,
  "dietPlan": { /* day/meal keys to REUSE AS-IS */ },
  "nutrientFocus": ["iron","vitaminD",...],
  "cuisine": "Polska" | "Włoska" | ...,
  "cuisineNote": "Resolved cuisine profile to follow (authentic)"
}

CRITICAL RULES:
- Reuse EXACT day/meal KEYS from input.dietPlan; do NOT rename or translate keys themselves.
- Translate CONTENT (titles, ingredients, instructions) to input.lang (natural style) only.
- Follow input.cuisineNote strictly (authentic culinary profile).
- ALWAYS include spices, herbs, fats/oils, and condiments where appropriate.
- Prefer ingredients supporting input.nutrientFocus (if provided).
- Units allowed: "g", "ml", "szt". Round amounts sensibly.
- Healthy, realistic methods; numbered steps where useful.

OUTPUT: JSON ONLY, with structure:
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
${JSON.stringify(cuisineContextMap, null, 2)}
`.trim()
});

// —————————————————————————————————————————————
//  Cienki wrapper jak generateDiet()  → generateRecipes()
//  (bez temperature/response_format w opcjach run — zgodne ze starszym SDK)
// —————————————————————————————————————————————

function tryParseJsonLoose(text: string): any | null {
  // 1) próba normalna
  try { return JSON.parse(text); } catch {}

  // 2) usuń fence'y
  const cleaned = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}

  // 3) wyciągnij największy blok { ... }
  const match = cleaned.match(/\{[\s\S]*\}$/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

export async function generateRecipes(input: any): Promise<{ recipes: any[] }> {
  const { lang = "pl", cuisine, dietPlan, nutrientFocus = [] } = input || {};
  const cuisineNote = cuisineContextMap[cuisine] || "general culinary tradition";

  const userPayload = {
    lang,
    nutrientFocus,
    cuisine,
    cuisineNote,
    dietPlan // klucze day/meal mają zostać użyte 1:1
  };

  // starsze SDK: run(agent, input: string) → wynik może mieć różne pola; bierzemy defensywnie
  const result: any = await run(recipeAgent, JSON.stringify(userPayload));
  const text = String(
    result?.finalOutput ??
    result?.output_text ??
    ""
  ).trim();

  const parsed = tryParseJsonLoose(text);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.recipes)) {
    return { recipes: [] };
  }
  return parsed as { recipes: any[] };
}

// (opcjonalnie) eksport mapy kuchni, gdyby była potrzebna gdzie indziej
export { cuisineContextMap };
