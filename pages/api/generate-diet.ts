// Wersja generate-diet.ts z podziałem modeli na naukowe i manualne zasady

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const languageMap: Record<string, string> = {
  pl: 'Polish', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  ua: 'Ukrainian', ru: 'Russian', zh: 'Chinese', hi: 'Hindi', ar: 'Arabic', he: 'Hebrew'
};

export const config = { api: { bodyParser: true } };

const scientificModels = [
  'Dieta ketogeniczna',
  'Dieta DASH',
  'Dieta śródziemnomorska',
  'Dieta wegańska',
  'Dieta wysokobiałkowa',
  'Dieta niskowęglowodanowa'
];

const manualModelPrompts: Record<string, string> = {
  'Dieta wątrobowa': 'No alcohol, fried food, fatty meats. Use soft vegetables, white rice, lean protein.',
  'Dieta nerkowa': 'No bananas, dairy, beans, nuts. Low protein, low salt.',
  'Dieta FODMAP (przy IBS)': 'No garlic, onion, wheat, apples, legumes, lactose. Use gluten-free and low-fructose items.',
  'Dieta bezglutenowa': 'No wheat, rye, barley. Use gluten-free grains.',
  'Dieta eliminacyjna': 'No dairy, gluten, eggs, soy, nuts, seafood.',
  'Dieta lekkostrawna': 'No raw vegetables, spicy food, fried dishes. Use boiled rice, lean meat, soft veggies.',
  'Dieta przeciwzapalna': 'No sugar, processed meat, trans fats. Use greens, turmeric, berries, olive oil, oily fish.'
};

const mapDaysToPolish: Record<string, string> = {
  Monday: 'Poniedziałek',
  Tuesday: 'Wtorek',
  Wednesday: 'Środa',
  Thursday: 'Czwartek',
  Friday: 'Piątek',
  Saturday: 'Sobota',
  Sunday: 'Niedziela'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { form, interviewData, lang = 'pl', goalExplanation = '', recommendation = '' } = req.body;

  const cpm = form.cpm ?? (form.weight && form.pal ? Math.round(form.weight * 24 * form.pal) : null);
  const mealsPerDay = interviewData.mealsPerDay ?? 'not provided';

  const model = form.model;
  const isScientific = scientificModels.includes(model);
  const modelPrompt = isScientific
    ? `Apply the "${model}" diet model using official clinical guidelines and nutrition science (e.g. EFSA, WHO, ESPEN, AND).`
    : manualModelPrompts[model] || '';

  const encoder = new TextEncoder();

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Transfer-Encoding': 'chunked'
  });

  try {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    res.write(encoder.encode('{"dietPlan":{'));

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      let responseText = '';

      const prompt = `You are an AI clinical dietitian.
Generate meals for: ${day}
Model: ${model}
${modelPrompt}
Calories/day: ${cpm}
Meals/day: ${mealsPerDay}
Goal: ${goalExplanation}
Preferences: ${form.dietPreferences || 'none'}
Exclusions: ${form.dislikedProducts || 'none'}

Return JSON only. No comments. Format:
{
  "${day}": {
    "Breakfast": { "time": "08:00", "menu": "...", "kcal": ..., "glycemicIndex": ..., "ingredients": [ {"product": "...", "weight": ...} ] },
    ...
  }
}`;

      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        stream: true,
        temperature: 0.7,
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) responseText += text;
      }

      try {
        JSON.parse(`{ "${day}": ${responseText} }`);
        res.write(encoder.encode(`"${mapDaysToPolish[day]}":${responseText}`));
      } catch {
        res.write(encoder.encode(`"${mapDaysToPolish[day]}":{"error":"Invalid JSON"}`));
      }

      if (i < days.length - 1) res.write(encoder.encode(','));
    }

    res.write(encoder.encode('}}'));
    res.end();
  } catch (error: any) {
    console.error('❌ OpenAI error:', error);
    res.status(500).json({ error: 'AI generation error.' });
  }
}
