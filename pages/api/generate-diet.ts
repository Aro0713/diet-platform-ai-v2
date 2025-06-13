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

const dataSources = `
Nutrient databases:
- USDA FoodData Central (https://fdc.nal.usda.gov)
- Polish Food Composition Tables (https://ncez.pzh.gov.pl)
- Open Food Facts (https://world.openfoodfacts.org)

Clinical nutrition guidelines:
- Polish Institute of Public Health (https://ncez.pzh.gov.pl)
- USDA Recommended Dietary Allowances (https://www.nal.usda.gov)
- EFSA (https://www.efsa.europa.eu)
- ESPEN Guidelines (https://www.espen.org/guidelines)
- NICE UK (https://www.nice.org.uk)
- AND - Academy of Nutrition and Dietetics (https://www.eatrightpro.org)
- ESMO (Oncology), IASO (Obesity), IBD Standards UK
- PubMed & Cochrane Library (https://pubmed.ncbi.nlm.nih.gov, https://www.cochranelibrary.com)
`;

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
- mealsPerDay: ${mealsPerDay}

Use culturally appropriate recipes and traditional ingredients based on the patient's origin:
${culturalContext}

Use only evidence-based data sources:
${dataSources}

If any source is inaccessible, invalid, or unclear, ignore it and continue using the remaining sources. Do not fail or stop.

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

