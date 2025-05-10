// /pages/api/generate-diet.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageMap: Record<string, string> = {
  pl: 'polski',
  en: 'English',
  es: 'espanol',
  fr: 'français',
  de: 'Deutsch',
  ua: 'українська',
  ru: 'русский',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
  he: 'עברית',
};

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { form, interviewData, lang = 'pl' } = req.body;
  const selectedLang = languageMap[lang] || 'polski';

  const bmi =
    form.weight && form.height
      ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
      : null;

  const patientData = {
    ...form,
    ...interviewData,
    bmi,
    language: selectedLang,
    mealsPerDay: interviewData.mealsPerDay,
  };

  const prompt = `
You are an expert clinical dietitian AI with advanced knowledge in:
- human metabolism, endocrine and GI systems,
- chronic and diet-related diseases,
- drug-nutrient and supplement interactions,
- culturally sensitive nutrition and therapeutic food design.

Your task is to generate a complete, 7-day, medically sound and evidence-based diet plan for a real patient. All information provided must be analyzed carefully and individually.

Your diet must:
- match the patient's age, sex, BMI, medical conditions and test results,
- support therapeutic goals (e.g. insulin resistance, lipid profile, inflammation),
- adjust for lifestyle (work, stress, sleep, activity, appetite),
- avoid allergens, intolerances and patient-excluded products,
- include correct kcal, macronutrient balance and glycemic index (if needed),
- contain realistic, home-preparable meals — culturally appropriate and seasonally adjusted.

Strict rules:
- Return JSON only — no explanation, notes or markdown.
- Always generate exactly 7 days (Monday to Sunday).
- Each day must contain exactly ${interviewData.mealsPerDay} meals (as prescribed by the physician).
- Vary ingredients — do not repeat meals or products more than once every 2 days.
- Use UTF-8 and write everything in: ${selectedLang}.

Sources:
- Follow ESPEN, EASO, ADA, DRI, USDA, EFSA, IŻŻ, PubMed and Cochrane-reviewed clinical evidence.


Patient data:
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
      'Transfer-Encoding': 'chunked',
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
