import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageMap: Record<string, string> = {
  pl: 'polski', en: 'English', es: 'español', fr: 'français', de: 'Deutsch',
  ua: 'українська', ru: 'русский', zh: '中文', hi: 'हिन्दी', ar: 'العربية', he: 'עברית'
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

  const bmi = form.weight && form.height
    ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
    : null;

  const pal = form.pal || 1.6;
  const cpm = Math.round(form.weight * 24 * pal);

  const patientData = {
    ...form,
    ...interviewData,
    bmi,
    pal,
    cpm,
    goalExplanation,
    recommendation,
    language: selectedLang,
    mealsPerDay: interviewData.mealsPerDay
  };

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
    },
    ...
  }
}

Strict rules:
- Top-level key must be "dietPlan"
- Exactly 7 days: Monday to Sunday
- Days in English: Monday, Tuesday, ...
- Meal names in Polish: Śniadanie, Drugie śniadanie, Obiad, Podwieczorek, Kolacja
- Each meal must have: "time", "menu", "kcal"
- JSON only – no markdown, comments, explanations, code blocks or notes

Language of meal descriptions: ${selectedLang}
Adapt the content to:
- patient's goal: ${goalExplanation}
- doctor's notes: ${recommendation}
- allergies, health conditions, test results, stress, appetite, culture
- daily kcal and macronutrients matched to CPM
- mealsPerDay: ${interviewData.mealsPerDay || 'not provided'}

All patient data:
${JSON.stringify(patientData, null, 2)}
`;

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      stream: true,
      temperature: 0.7,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked'
    });

    const encoder = new TextEncoder();
    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) {
        res.write(encoder.encode(text));
      }
    }

    res.end();
  } catch (error: any) {
    console.error('❌ OpenAI error:', error);
    res.status(500).json({ error: 'Błąd generowania diety przez AI.' });
  }
}
