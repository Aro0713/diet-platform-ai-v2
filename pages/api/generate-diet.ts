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

  const { form, interviewData, lang = 'pl', goalExplanation = '' } = req.body;
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
    language: selectedLang,
    mealsPerDay: interviewData.mealsPerDay
  };

  const prompt = `
You are an expert clinical dietitian AI with advanced knowledge in:
- human metabolism, endocrine and GI systems,
- chronic and diet-related diseases,
- drug-nutrient and supplement interactions,
- culturally sensitive nutrition and therapeutic food design.

Your task:
Generate a medically sound, 7-day, individualized diet plan based on full analysis of the patient's data.

Strict requirements:
- Reflect patient's age, sex, BMI, PAL, and total energy expenditure (CPM)
- Respect their therapeutic goal: "${goalExplanation}"
- Adapt to patient's region, activity, stress, appetite, habits, allergies, conditions, and test results
- Include adequate kcal and macronutrients, optional glycemic index
- Avoid allergens, restricted ingredients, and repeated meals (no repetition for 2 days)

Meals per day:
- Physician preference: ${interviewData.mealsPerDay || 'not provided'}
- Acceptable range: 2–6 meals/day
- If the physician has selected mealsPerDay, you must follow it
- If not, choose a medically justified number (based on BMI, goal, appetite, clinical needs)
- Never generate fewer than 2 or more than 6 meals per day

Output:
- Perfect JSON (UTF-8), no notes, markdown, or explanation
- Write all content in: ${selectedLang}
- Always return 7 full days (Monday to Sunday)

Sources to follow:
ESPEN, EASO, IŻŻ, ADA, USDA, EFSA, DRI, PubMed, Cochrane.

Patient Data:
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
