import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: true,
    responseLimit: "4mb"
  }
};

const cuisineContextMap: Record<string, string> = {
  "Polska": "Polish culinary traditions: soups, fermented foods, root vegetables",
  "Włoska": "Italian style: pasta, olive oil, tomatoes, basil, Mediterranean balance",
  "Japońska": "Japanese cuisine: rice, miso, seaweed, tofu, umami minimalism",
  "Chińska": "Chinese culinary principles: stir-fry, ginger, garlic, soy-based sauces",
  "Tajska": "Thai cuisine: coconut milk, chili, lemongrass, coriander",
  "Wietnamska": "Vietnamese: fresh herbs, rice noodles, fish sauce, light soups",
  "Indyjska": "Indian: rich spices, lentils, curries, turmeric, ghee",
  "Koreańska": "Korean: fermented vegetables, gochujang, rice dishes, barbecue",
  "Bliskowschodnia": "Middle Eastern: legumes, olive oil, tahini, flatbreads, spices",
  "Francuska": "French: sauces, butter, herbs de Provence, refined technique",
  "Hiszpańska": "Spanish: olive oil, garlic, paprika, tapas, seafood",
  "Skandynawska": "Scandinavian: rye, fish, root vegetables, dairy",
  "Północnoamerykańska": "North American: diverse, fusion, whole grains, lean proteins",
  "Brazylijska": "Brazilian: rice and beans, tropical fruits, cassava",
  "Afrykańska": "African: grains like millet, legumes, stews, bold spices",
  "Dieta arktyczna / syberyjska": "Arctic/Siberian: fish, berries, root vegetables, minimal spices"
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { dietPlan, lang = "pl", cuisine = "Polska" } = req.body;

    if (!dietPlan || typeof dietPlan !== 'object') {
      return res.status(400).json({ error: 'Invalid or missing dietPlan' });
    }

    const cuisineNote = cuisineContextMap[cuisine] || "general dietary style";

    const prompt = `
You are a culinary assistant AI specialized in healthy and clinical diets.
Generate full culinary recipes for each meal in the diet plan below.
Each meal has a dish name and a list of ingredients.

For each meal, generate:
- dish name (preserve as is),
- description (1–2 sentences),
- ingredients (from the plan),
- 3–6 numbered preparation steps,
- total preparation time.

All recipes should reflect the regional cooking style and culinary ingredients typical of: ${cuisineNote}.

Each recipe should include:
- Dish name (as in the plan)
- Day and meal (e.g. Monday - Śniadanie)
- Short description (1–2 sentences)
- Number of servings (assume 1 unless stated otherwise)
- Ingredients: name, weight in grams, unit
- Step-by-step preparation instructions (numbered)
- Estimated cooking time

Format strictly as JSON:
{
  "recipes": {
    "Monday": {
      "Śniadanie": {
        "dish": "Owsianka z malinami",
        "description": "A warm oatmeal breakfast with fresh raspberries and flax seeds.",
        "servings": 1,
        "ingredients": [
          { "product": "Płatki owsiane", "weight": 60, "unit": "g" },
          { "product": "Mleko", "weight": 200, "unit": "ml" },
          { "product": "Maliny", "weight": 50, "unit": "g" }
        ],
        "steps": [
          "Podgrzej mleko w rondelku.",
          "Dodaj płatki owsiane i gotuj 5 minut.",
          "Dodaj maliny i gotuj kolejne 2 minuty.",
          "Podawaj ciepłe."
        ],
        "time": "10 min"
      },
      "Obiad": { ... },
      ...
    },
    ...
  }
}

Return ONLY JSON. No markdown. No comments.

Input dietPlan:
${JSON.stringify(dietPlan, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a culinary recipe AI." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    let text = completion.choices[0].message.content || "";
    text = text.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(text);
      res.status(200).json(parsed);
    } catch (err) {
      console.error("❌ Nieprawidłowy JSON z OpenAI:", err);
      res.status(500).send("Błąd parsowania odpowiedzi z przepisami.");
    }
  } catch (err) {
    console.error("❌ Błąd generowania przepisów:", err);
    res.status(500).send("Błąd serwera przy generowaniu przepisów.");
  }
}
