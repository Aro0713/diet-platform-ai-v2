// pages/api/analyzeagent-product-text.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const languageLabel: Record<string, string> = {
  pl: 'Polish',
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  ua: 'Ukrainian',
  ru: 'Russian',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  he: 'Hebrew'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, lang, patient } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing product description' });
  }

  const userLanguage = languageLabel[lang] || 'English';

  try {
    const prompt = `
You are a clinical nutrition AI. Analyze the following product described in text for dietary compatibility.

Please respond in ${userLanguage}.

Patient data:
- Conditions: ${patient.conditions?.join(', ') || 'none'}
- Allergies: ${patient.allergies || 'none'}
- Diet model: ${patient.dietModel || 'not specified'}

Product (text):
"${text}"

Write a friendly, human-readable description (~3 sentences) that explains whether the product is suitable for the user's health and diet.
Use natural language, not technical terms.
Avoid phrases like “it is recommended” – instead explain how it fits in everyday choices.

Then suggest 1–3 alternative products: name, shop (fake), price, and why they may be better.

Respond ONLY with valid JSON object (no explanation, no markdown), like:
{
  "productName": "...",
  "verdict": "...",
  "alternatives": [...]
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful dietetics AI.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    let parsed;

    try {
      const jsonMatches = raw.match(/\{[\s\S]*?\}/g);
      if (!jsonMatches || jsonMatches.length === 0) {
        throw new Error('No valid JSON object found in AI response');
      }

      const jsonString = jsonMatches[0];
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error('❌ Parsing error in analyzeagent-product-text:', raw);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('❌ Error in analyzeagent-product-text:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
