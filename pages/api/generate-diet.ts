import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { modelRules } from '@/utils/dietModels';

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
      const modelPrompt = modelRules[form.model] || '';

      const prompt = `
You are a clinical AI dietitian working for Diet Care Platform (DCP) — a premium, evidence-based digital platform designed for physicians, licensed dietitians, and clinical nutritionists.

⚠️ This is a professional medical environment, not a chatbot. You are bound to follow clinical-grade accuracy, cultural authenticity, nutritional safety, and strict international dietary standards.

You MUST base your entire output on the latest guidelines, data sources, and culinary authenticity. Apply the following resources directly:

---

Nutrition Composition and Food Databases:
- USDA FoodData Central: https://fdc.nal.usda.gov
- Polish IŻŻ Tables: https://ncez.pzh.gov.pl
- Open Food Facts: https://world.openfoodfacts.org

Nutritional Guidelines and RDA:
- Dietary Guidelines USA 2020–2025: https://www.dietaryguidelines.gov
- Polish Dietary Norms (PZH): https://ncez.pzh.gov.pl
- EFSA Reference Values: https://www.efsa.europa.eu
- WHO Nutrition Targets: https://www.who.int
- Japan MHLW Guidelines: https://www.mhlw.go.jp
- India NIN Guidelines: https://www.nin.res.in
- China CNS Reports: http://www.cnsoc.org
- Russia ION Guidelines: http://www.ion.ru

Clinical Guidelines:
- Oncology: https://www.esmo.org
- Obesity: https://www.worldobesity.org
- IBD: https://ibdstandards.org.uk
- Cardiology: https://www.escardio.org
- ESPEN: https://www.espen.org/guidelines
- AND (USA): https://www.eatrightpro.org
- NICE UK: https://www.nice.org.uk
- EFAD: https://www.efad.org
- Evidence & Research: https://pubmed.ncbi.nlm.nih.gov, https://www.cochranelibrary.com

Culinary Authenticity:
- TasteAtlas: https://www.tasteatlas.com
- EatYourWorld: https://eatyourworld.com
- Great British Chefs: https://www.greatbritishchefs.com
- Sanjeev Kapoor: https://www.sanjeevkapoor.com
- Veg Recipes of India: https://www.vegrecipesofindia.com
- Just One Cookbook (Japan): https://www.justonecookbook.com
- RBTH Russian Kitchen: https://www.rbth.com/russian-kitchen
- TheSpruceEats (USA): https://www.thespruceeats.com
- BBC Good Food: https://www.bbcgoodfood.com
- BZfE & Chefkoch (Germany): https://www.bzfe.de / https://www.chefkoch.de

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
If mealsPerDay is a number, you must generate exactly that number of meals for every day — no more, no less.

If mealsPerDay is "not provided", infer the number of meals (3 to 6) based on patient's clinical and lifestyle data, appetite, goal, and conditions (e.g. diabetes → 5 meals).

⚠️ All 7 days must have **exactly the same number of meals**. You may not vary the number of meals between days.

Each meal should be as concise as possible and include no more than 3–4 ingredients when possible.

Respect culinary and cultural preferences intelligently:
- If the patient or doctor selected a specific cuisine (e.g. Indian, Japanese, Kosher), this cuisine takes precedence over cultural background inferred from language or region.
- Preserve authentic preparation styles, ingredient combinations and regional identity of the selected cuisine.
- However, when possible, adapt specific ingredients to what is locally accessible for the patient or doctor (e.g. replace paneer with cottage cheese if Indian cuisine is selected but patient is in Europe).
- You may retain core seasonings or spices typical to the patient's culture if they improve adherence and acceptance.

Selected cuisine: ${form.cuisine}
Patient's cultural context: ${culturalContext}

Try to avoid repeating the same key ingredients more than 2 times across the 7 days.
The meal plan must not repeat the same **main ingredient** in the same meal slot more than twice in a week.

Each meal must include:
- "time" – meal time in HH:mm
- "menu" – short description
- "kcal" – total calories
- "glycemicIndex" – number between 0–100
- "ingredients": array of objects like:
  { "product": string, "weight": number (in grams) }

You must always return a complete and syntactically correct JSON object under the key "dietPlan".
Do not exceed 3000 tokens — compress if needed (e.g. limit ingredients to 3–4).
Each day must have exactly the same number of meals (e.g. 3, 4, or 5) for all 7 days.
If output becomes too long, reduce ingredients to max 3–4 per meal.
Never output incomplete, truncated or invalid JSON.

IMPORTANT: In "ingredients" array, every object must be separated by a comma, and the array must end with a closing bracket "]".
Do NOT return invalid or incomplete ingredient lists.

Return only the value of the "${day}" property from dietPlan (no wrapper).

Important: make sure the response ends with a complete and valid closing brace '}'.
Never return truncated or incomplete JSON.
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
