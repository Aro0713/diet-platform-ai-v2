import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { modelRules } from '@/utils/dietModels';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const languageMap: Record<string, string> = {
  pl: 'Polish',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ua: 'Ukrainian',
  ru: 'Russian',
  zh: 'Chinese',
  hi: 'Hindi',
  ar: 'Arabic',
  he: 'Hebrew'
};

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { form, interviewData, lang = 'pl', goalExplanation = '', recommendation = '' } = req.body;
  

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

      let responseText = '';
      let validJson = false;
      let attempt = 0;

      while (!validJson && attempt < 2) {
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

You must follow:
${modelPrompt}

Use only valid JSON with this format:
{
  "dietPlan": {
    "${day}": {
      "Śniadanie": { "time": "HH:mm", "menu": "...", "kcal": number, "glycemicIndex": number, "ingredients": [{ "product": "...", "weight": number }] },
      ...
    }
  }
}

Strict rules:
- Must return exactly 7 days (Monday to Sunday)
- Each meal must be complete: time, menu, kcal, glycemicIndex, ingredients
- JSON must be parsable and syntactically valid
- Ingredient lists must be valid arrays: comma-separated, bracket closed
- No markdown, no comments, no explanation — JSON only

Output language:
- Please write all meals, descriptions, ingredients, and food names in: ${languageMap[lang] || 'English'}

Patient information:
- Preferred products or cuisines: ${form.dietPreferences || 'not specified'}
- Disliked or excluded products: ${form.dislikedProducts || 'not specified'}
- Goal (as described by the patient): ${goalExplanation}
- Doctor or dietitian notes: ${recommendation}
- Known allergies: ${form.allergies || 'not specified'}
- Known health conditions: ${form.conditions || 'not specified'}
- Appetite description: ${form.appetite || 'not provided'}
- Stress level or digestive concerns: ${form.symptoms || 'not provided'}
- Dietary preferences or exclusions: ${form.dietPreferences || 'none'}
- Selected cuisine: ${form.cuisine}
- Target daily calories (CPM): ${cpm}
- Number of meals per day: ${mealsPerDay}

All culinary decisions must be based strictly on patient preferences, not assumptions. If the patient dislikes an ingredient or cuisine, do not include it in any meal.

Return ONLY the object for key "${day}" — no wrapping, no summaries.`;

        const stream = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          stream: true,
          temperature: 0.7,
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }]
        });

        responseText = '';
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) responseText += text;
        }

        const forbiddenRepeats = ['owsianka', 'pierś z kurczaka', 'jogurt naturalny'];
        const excessiveRepeat = forbiddenRepeats.find(ingredient =>
          (responseText.toLowerCase().match(new RegExp(ingredient, 'g')) || []).length > 2
        );

        try {
          JSON.parse(`{ "${day}": ${responseText} }`);

          if (excessiveRepeat) {
            console.warn(`Retrying due to ingredient repetition: ${excessiveRepeat}`);
            attempt++;
            continue;
          }

          res.write(encoder.encode(`"${day}":${responseText}`));
          validJson = true;
        } catch (e) {
          attempt++;
          if (attempt >= 2) {
            res.write(encoder.encode(`"${day}":{"error":"Invalid JSON or excessive repetition"}`));
          } else {
            console.warn(`Retrying generation for ${day} due to JSON parse error.`);
          }
        }

        if (validJson || attempt >= 2) break;
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
