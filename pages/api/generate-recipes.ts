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
  "Polska": "Polish cuisine: soups, fermented vegetables, root vegetables, pork, rye bread",
  "Włoska": "Italian cuisine: pasta, olive oil, tomatoes, basil, cheeses like mozzarella and parmesan",
  "Japońska": "Japanese cuisine: rice, miso, seaweed, tofu, sushi, umami-rich dishes",
  "Chińska": "Chinese cuisine: stir-fried dishes, ginger, garlic, soy sauce, rice, noodles",
  "Tajska": "Thai cuisine: coconut milk, chili, lemongrass, coriander, sweet and spicy balance",
  "Wietnamska": "Vietnamese cuisine: fresh herbs, rice noodles, fish sauce, light broths",
  "Indyjska": "Indian cuisine: rich spices, curries, lentils, turmeric, ghee",
  "Koreańska": "Korean cuisine: fermented vegetables, gochujang, rice, grilled meats",
  "Bliskowschodnia": "Middle Eastern cuisine: legumes, olive oil, tahini, spices, flatbreads",
  "Francuska": "French cuisine: sauces, butter, herbs de Provence, regional meats",
  "Hiszpańska": "Spanish cuisine: olive oil, paprika, garlic, seafood, tapas",
  "Skandynawska": "Scandinavian cuisine: rye, fish, dairy, root vegetables",
  "Północnoamerykańska": "North American cuisine: diverse fusion, whole grains, grilled dishes",
  "Brazylijska": "Brazilian cuisine: rice, beans, cassava, tropical fruits",
  "Afrykańska": "African cuisine: millet, legumes, peanut stew, bold spices",
  "Dieta arktyczna / syberyjska": "Arctic/Siberian cuisine: fish, berries, root vegetables, animal fat"
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { dietPlan, lang = "pl", cuisine = "Polska" } = req.body;

    if (!dietPlan || typeof dietPlan !== 'object') {
      return res.status(400).json({ error: 'Invalid or missing dietPlan' });
    }

    const cuisineNote = cuisineContextMap[cuisine] || "general culinary tradition";

    const prompt = `
You are a culinary assistant AI specialized in healthy and clinical diets.
Generate full culinary recipes for each meal in the diet plan below.
Each meal has a dish name and a list of ingredients.

Each recipe should include:
- Dish name (as in the plan)
- Day and meal (e.g. Monday - Śniadanie)
- Short description (1–2 sentences)
- Number of servings (assume 1 unless stated otherwise)
- Ingredients: name, weight in grams, unit
- Step-by-step preparation instructions (numbered)
- Estimated cooking time

All recipes must strictly follow the authentic culinary traditions and ingredient profile of: ${cuisineNote}.
Do not adapt or localize the recipes to the patient's country or culture.
Translate everything into: ${lang}. Use natural expressions in this language.

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
      }
    }
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

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.recipes ||
        Object.keys(parsed.recipes).length === 0
      ) {
        console.warn("⚠️ RecipeAgent returned empty or invalid structure");
        return res.status(200).json({ recipes: {} });
      }

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
