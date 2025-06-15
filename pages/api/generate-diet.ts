import OpenAI from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import { validateAndFixDiet } from "@/agents/dqAgent";

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
    const { form, interviewData, lang = "pl", goalExplanation = "", recommendation = "" } = body;

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
    };

    const prompt = `
You are a clinical dietitian AI. Generate a 7-day individualized medical diet plan in perfect JSON format.

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
        ]
      }
    }
  }
}

Strict rules:
- Top-level key: "dietPlan"
- 7 days: Monday to Sunday
- Day keys in English, meal names in Polish
- Each meal must include: time, menu, kcal, glycemicIndex (required), ingredients (array)
- JSON only – no markdown, no explanations

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

    // 🔁 Retry loop: analiza jakości + poprawa
    try {
      const parsed = JSON.parse(text);
      const dietPlan = parsed?.dietPlan;

      if (!dietPlan) {
        console.warn("❗ Brak dietPlan – pomijam walidację.");
      } else {
        const result = await validateAndFixDiet({
          dietPlan,
          model: form.model,
          goal: goalExplanation,
          cpm,
          weightKg: form.weight
        });

        console.log("📋 Diet quality evaluation result:", result);

        if (result.includes("CORRECTED_JSON:")) {
          const startIndex = result.indexOf("{");
          const corrected = result.slice(startIndex).trim();
          console.log("✅ Poprawiona dieta została wygenerowana.");
          return res.status(200).send(corrected);
        }

        if (result.includes("VALID ✅")) {
          console.log("✅ Dieta przeszła walidację AI bez uwag.");
          return res.status(200).send(text);
        }

        console.warn("⚠️ Walidacja zwróciła wynik, ale nie rozpoznano formatu — zwracam oryginał.");
      }
    } catch (retryErr) {
      console.warn("⚠️ Retry loop failed:", retryErr);
    }

    res.status(200).send(text);

  } catch (err) {
    console.error("❌ BŁĄD W AI:", err);
    res.status(500).send("Błąd serwera przy generowaniu diety.");
  }
}
