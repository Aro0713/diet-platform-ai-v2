import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  runtime: "edge"
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
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
      temperature: 0.7,
      stream: false
    });

    const text = completion.choices[0].message.content ?? "";

    return new Response(text, {
      headers: { "Content-Type": "text/plain" }
    });

  } catch (err) {
    console.error("❌ BŁĄD W AI:", err);
    return new Response("Błąd serwera przy generowaniu diety.", { status: 500 });
  }
}
