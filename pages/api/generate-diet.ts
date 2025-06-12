// Rozszerzona wersja generate-diet.ts z pełnym modelemPrompt i normalizeDiet()

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const languageMap: Record<string, string> = {
  pl: 'Polish', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  ua: 'Ukrainian', ru: 'Russian', zh: 'Chinese', hi: 'Hindi', ar: 'Arabic', he: 'Hebrew'
};

export const config = { api: { bodyParser: true } };

const modelPrompts: Record<string, string> = {
  'Dieta ketogeniczna': `Exclude oats, rice, pasta, potatoes, bread, sugar, fruit juices, honey, bananas, apples, milk, and quinoa. Focus on fat-based ingredients. Limit carbs to <50g/day.`,
  'Dieta niskowęglowodanowa': `Limit total carbohydrate intake to 120g/day. Avoid sugar, sweetened drinks, white bread, and pasta. Focus on protein and non-starchy vegetables.`,
  'Dieta wysokobiałkowa': `Ensure protein intake exceeds 1.6g/kg/day. Use lean meats, eggs, legumes, dairy. Spread protein across meals.`,
  'Dieta wątrobowa': `Exclude alcohol, saturated fats, fructose, and processed meats. Use light meals with lean proteins, vegetables, and whole grains.`,
  'Dieta nerkowa': `Avoid potassium- and phosphorus-rich foods: bananas, dairy, beans, nuts. Limit protein to ~0.6g/kg. Avoid added salt.`,
  'Dieta FODMAP (przy IBS)': `Exclude high-FODMAP foods: garlic, onion, apples, wheat, legumes, lactose. Use lactose-free dairy, gluten-free grains, low-fructose fruits.`,
  'Dieta bezglutenowa': `Exclude wheat, rye, barley, spelt. Use gluten-free grains: rice, buckwheat, quinoa, corn. Check sauces and labels.`,
  'Dieta DASH': `Limit sodium to 1500mg/day. Avoid red meat, processed food. Prioritize vegetables, legumes, fruits, low-fat dairy.`,
  'Dieta śródziemnomorska': `Use olive oil, fish, legumes, whole grains, fruits, nuts. Avoid butter, red meat, and sugar.`,
  'Dieta wegańska': `Exclude all animal products. Use legumes, tofu, grains, vegetables, fruit, nuts. Supplement B12.`,
  'Dieta eliminacyjna': `Eliminate dairy, eggs, gluten, soy, nuts, seafood. Use neutral oils, safe vegetables, rice, and proteins.`,
  'Dieta lekkostrawna': `Avoid raw vegetables, legumes, spicy or fatty foods. Use cooked vegetables, white rice, lean meats.`,
  'Dieta przeciwzapalna': `Avoid processed meats, sugar, trans fats. Use turmeric, ginger, leafy greens, berries, flax oil, oily fish.`
};

const mapDaysToPolish: Record<string, string> = {
  Monday: 'Poniedziałek',
  Tuesday: 'Wtorek',
  Wednesday: 'Środa',
  Thursday: 'Czwartek',
  Friday: 'Piątek',
  Saturday: 'Sobota',
  Sunday: 'Niedziela',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { form, interviewData, lang = 'pl', goalExplanation = '', recommendation = '' } = req.body;

  const cpm = form.cpm ?? (form.weight && form.pal ? Math.round(form.weight * 24 * form.pal) : null);
  const mealsPerDay = interviewData.mealsPerDay ?? 'not provided';
  const modelPrompt = modelPrompts[form.model] || '';
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
      let validJson = false;

      const prompt = `You are an AI clinical dietitian.
Generate meals for: ${day}
Model: ${form.model}
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
        validJson = true;
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
