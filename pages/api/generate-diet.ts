// Najprostsza i odchudzona wersja generate-diet.ts z aktywnym modelem promptu i minimalną kontrolą AI

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const languageMap: Record<string, string> = {
  pl: 'Polish', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  ua: 'Ukrainian', ru: 'Russian', zh: 'Chinese', hi: 'Hindi', ar: 'Arabic', he: 'Hebrew'
};

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { form, interviewData, lang = 'pl', goalExplanation = '', recommendation = '' } = req.body;

  const cpm = form.cpm ?? (form.weight && form.pal ? Math.round(form.weight * 24 * form.pal) : null);
  const mealsPerDay = interviewData.mealsPerDay ?? 'not provided';

  const modelPrompts: Record<string, string> = {
    'Dieta ketogeniczna': `Exclude oats, rice, pasta, potatoes, bread, sugar, fruit juices, honey, bananas, apples, milk, and quinoa. Focus on fat-based ingredients. Limit carbs to <50g/day.`,
    'Dieta wegańska': `Exclude all animal-derived products including meat, dairy, eggs, honey. Use legumes, grains, seeds, vegetables, fruits.`,
    'Dieta DASH': `Limit sodium to 1500mg/day. Exclude red meat and processed foods. Base meals on vegetables, fruits, legumes, low-fat dairy.`
  };

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
        res.write(encoder.encode(`"${day}":${responseText}`));
        validJson = true;
      } catch {
        res.write(encoder.encode(`"${day}":{"error":"Invalid JSON"}`));
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
