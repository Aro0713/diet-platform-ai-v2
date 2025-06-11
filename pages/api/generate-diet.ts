import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageMap: Record<string, string> = {
  pl: 'polski', en: 'English', es: 'español', fr: 'français', de: 'Deutsch',
  ua: 'українська', ru: 'русский', zh: '中文', hi: 'हिन्दी', ar: 'العربية', he: 'עברית'
};

const culturalContextMap: Record<string, string> = {
  pl: 'Polish and Central European dietary traditions',
  en: 'Anglo-American dietary habits',
  es: 'Mediterranean and Latin American dietary culture',
  fr: 'French and Western European cuisine',
  de: 'Germanic and Central European dietary preferences',
  ua: 'Ukrainian and Eastern European food culture',
  ru: 'Russian and Slavic food heritage',
  zh: 'Chinese and East Asian culinary traditions',
  hi: 'Indian dietary principles and traditional spices',
  ar: 'Arabic and Middle Eastern dietary customs',
  he: 'Kosher food rules and Israeli cuisine'
};

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { form, interviewData, lang = 'pl', goalExplanation = '', recommendation = '' } = req.body;
  const selectedLang = languageMap[lang] || 'polski';
  const culturalContext = culturalContextMap[lang] || 'general international dietary style';

  const bmi = form.bmi ?? (
    form.weight && form.height
      ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
      : null
  );

  const pal = form.pal ?? 1.6;

  const cpm = form.cpm ?? (
    form.weight && pal
      ? Math.round(form.weight * 24 * pal)
      : null
  );

  const mealsPerDay = interviewData.mealsPerDay ?? 'not provided';

  const patientData = {
    ...form,
    ...interviewData,
    bmi,
    pal,
    cpm,
    goalExplanation,
    recommendation,
    language: selectedLang,
    mealsPerDay
  };

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Transfer-Encoding': 'chunked'
  });

  const encoder = new TextEncoder();

  try {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    res.write(encoder.encode('{"dietPlan":{'));

    for (let i = 0; i < days.length; i++) {
      const day = days[i];

      const prompt = `
You are a clinical dietitian AI. Generate a 7-day individualized medical diet plan in perfect JSON format.

Return the output **only** as raw JSON object like this:
{
  "dietPlan": {
    "Monday": {
      "Śniadanie": { "time": "07:30", "menu": "...", "kcal": 400 },
      "Drugie śniadanie": { "time": "10:00", "menu": "...", "kcal": 250 },
      "Obiad": { "time": "16:00", "menu": "...", "kcal": 650 },
      "Podwieczorek": { "time": "17:30", "menu": "...", "kcal": 150 },
      "Kolacja": { "time": "19:30", "menu": "...", "kcal": 350 }
    }
  }
}

Strict rules:
- Top-level key must be "dietPlan"
- Exactly 7 days: Monday to Sunday
- Days in English: Monday, Tuesday, ...
- Meal names in Polish: Śniadanie, Drugie śniadanie, Obiad, Podwieczorek, Kolacja
- Each meal must also include: "glycemicIndex" as a number between 0 and 100
- Each meal must have: "time", "menu", "kcal", "ingredients"
- "ingredients" must be a list of objects, each with:
  { "product": string, "weight": number (in grams) }
  Example:
  "ingredients": [
    { "product": "jogurt grecki", "weight": 150 },
    { "product": "orzechy", "weight": 20 }
  ]

- JSON only – no markdown, comments, explanations, code blocks or notes

Language of meal descriptions: ${selectedLang}
Adapt the content to:
- Patient's goal: ${goalExplanation}
- Doctor's notes: ${recommendation}
- Allergies, health conditions, test results, stress, appetite, culture
- Daily energy target (CPM): ${cpm}

Number of meals per day: ${mealsPerDay}.
Use this value to generate the correct number of meals.
If missing, determine mealsPerDay based on medical and lifestyle data.
You may choose 3, 4, 5 or 6 meals depending on patient's condition, goal and adherence.

Respect culinary and cultural preferences intelligently:
- If the patient or doctor selected a specific cuisine (e.g. Indian, Japanese, Kosher), this cuisine takes precedence over cultural background inferred from language or region.
- Preserve authentic preparation styles, ingredient combinations and regional identity of the selected cuisine.
- However, when possible, adapt specific ingredients to what is locally accessible for the patient or doctor (e.g. replace paneer with cottage cheese if Indian cuisine is selected but patient is in Europe).
- You may retain core seasonings or spices typical to the patient's culture if they improve adherence and acceptance.

Selected cuisine: ${form.cuisine}
Patient's cultural context: ${culturalContext}

Each meal must include:
- "time" – meal time in HH:mm
- "menu" – short description
- "kcal" – total calories
- "glycemicIndex" – number between 0–100
- "ingredients": array of objects like:
  { "product": string, "weight": number (in grams) }

You must always return a complete and syntactically correct JSON object under the key "dietPlan".
Do not exceed 3000 tokens — compress if needed (e.g. limit ingredients to 3–4).
If output becomes too long, reduce ingredients to max 3–4 per meal.
Never output incomplete, truncated or invalid JSON.

Return only the value of the "${day}" property from dietPlan (no wrapper).

Important: make sure the response ends with a complete and valid closing brace '}'.
Never return truncated or incomplete JSON.

All patient data:
${JSON.stringify(patientData, null, 2)}
`;

      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        stream: true,
        temperature: 0.7,
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      res.write(encoder.encode(`"${day}":`));

      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) res.write(encoder.encode(text));
      }

      if (i < days.length - 1) res.write(encoder.encode(','));
    }

    res.write(encoder.encode('}}'));
    res.end();
  } catch (error: any) {
    console.error('❌ OpenAI error:', error);
    res.status(500).json({ error: 'Błąd generowania diety przez AI.' });
  }
}

