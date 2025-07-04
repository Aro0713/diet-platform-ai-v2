import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: true,
    responseLimit: "2mb"
  }
};

const cuisineContextMap: Record<string, string> = {
  "Śródziemnomorska": "Mediterranean cuisine with olive oil, legumes, vegetables, and fish.",
  "Japońska": "Traditional Japanese diet including rice, fish, seaweed, and fermented foods.",
  "Chińska": "Chinese food principles with a balance of yin-yang ingredients, vegetables, rice.",
  "Tajska": "Thai cuisine rich in herbs, spices, vegetables, coconut milk, and rice.",
  "Wietnamska": "Vietnamese cuisine with fresh herbs, fish sauce, rice noodles, and vegetables.",
  "Indyjska": "Indian cuisine rich in legumes, spices (turmeric, cumin), and vegetarian dishes.",
  "Koreańska": "Korean diet based on kimchi, rice, fermented foods, and low-fat meats.",
  "Bliskowschodnia": "Middle Eastern dishes with legumes, olive oil, grains, and lamb.",
  "Polska": "Traditional Polish foods including root vegetables, fermented cabbage, and rye.",
  "Francuska": "French cuisine with emphasis on dairy, sauces, meats, and wine-based dishes.",
  "Włoska": "Italian dishes with pasta, tomatoes, olive oil, and herbs like basil.",
  "Hiszpańska": "Spanish meals including legumes, seafood, olive oil, and paprika.",
  "Skandynawska": "Nordic foods including fish, rye, root vegetables, and berries.",
  "Północnoamerykańska": "North American eating patterns with variety of global influences.",
  "Brazylijska": "Brazilian meals rich in beans, rice, cassava, and tropical fruits.",
  "Afrykańska": "Traditional African dishes with millet, yams, legumes, and peanut sauces.",
  "Dieta arktyczna / syberyjska": "Arctic/Siberian diet focused on fish, game meat, animal fat, berries."
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body;
    const {
      form,
      interviewData,
      lang = "pl",
      goalExplanation = "",
      recommendation = "",
      medical
    } = body;

    const bmi = form.bmi ?? (form.weight && form.height
      ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
      : null);
    const pal = form.pal ?? 1.6;
    const cpm = form.cpm ?? (form.weight && pal ? Math.round(form.weight * 24 * pal) : null);
    const mealsPerDay = interviewData.mealsPerDay ?? "not provided";

    const cuisineNote = cuisineContextMap[interviewData.cuisine] ?
      `Patient's cuisine preference: ${interviewData.cuisine}. Follow culinary context: ${cuisineContextMap[interviewData.cuisine]}`
      : "";

    const patientData = {
      ...form,
      ...interviewData,
      bmi,
      pal,
      cpm,
      goalExplanation,
      recommendation,
      language: lang,
      mealsPerDay,
      medical
    };

    const prompt = `
You are a clinical dietitian AI. Generate a 7-day individualized medical diet plan in strict JSON format.

Return ONLY raw JSON like:
{
  "dietPlan": {
    "Monday": {
      "Śniadanie": {
        "time": "07:30",
        "menu": "...",
        "kcal": 400,
        "glycemicIndex": 40,
        "ingredients": [
          { "product": "...", "weight": 100 }
        ],
        "macros": {
          "protein": 20,
          "fat": 15,
          "carbs": 30,
          "fiber": 5,
          "potassium": 300
        }
      }
    }
  }
}

Strict rules:
- Top-level key: "dietPlan"
- 7 days: Monday to Sunday
- Day keys in English, meal names in Polish
- Each meal must include: time, menu, kcal, glycemicIndex, ingredients[], and macros
- JSON only – no markdown, no commentary

Language: ${lang}
Goal: ${goalExplanation}
Doctor's notes: ${recommendation}
Cuisine: ${interviewData.cuisine || "not specified"}
${cuisineNote}
CPM: ${cpm}, mealsPerDay: ${mealsPerDay}

Patient data:
${JSON.stringify(patientData, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a clinical dietitian AI." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    let text = completion.choices[0].message.content ?? "";

    // 🧹 Remove markdown
    text = text.replace(/```json|```/g, "").trim();

    // ✅ zwróć tylko dietę, walidacja będzie osobno
    res.status(200).send(text);
  } catch (err) {
    console.error("❌ Błąd generowania diety:", err);
    res.status(500).send("Błąd serwera przy generowaniu diety.");
  }
}
