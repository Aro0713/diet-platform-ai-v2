import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: {
    bodyParser: true,
    responseLimit: "2mb"
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = req.body;
    const { form, interviewData, lang = "pl", goalExplanation = "", recommendation = "", medical } = body;

    const bmi = form.bmi ?? (form.weight && form.height
      ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
      : null);
    const pal = form.pal ?? 1.6;
    const cpm = form.cpm ?? (form.weight && pal ? Math.round(form.weight * 24 * pal) : null);
    const mealsPerDay = interviewData.mealsPerDay ?? "not provided";

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
Adapt to allergies, conditions, stress, culture.
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
