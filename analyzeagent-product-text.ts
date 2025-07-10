// pages/api/analyzeagent-product-text.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, lang, patient } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing product description' });
  }

  try {
    const prompt = `
You are a clinical nutrition AI. Analyze the following product described in text for dietary compatibility.

Patient data:
- Conditions: ${patient.conditions?.join(', ') || 'none'}
- Allergies: ${patient.allergies || 'none'}
- Diet model: ${patient.dietModel || 'not specified'}

Product (text):
"${text}"

Give a short compatibility verdict (max 3 sentences) and whether the product is acceptable for the user.
Then suggest 1–3 alternative products: name, shop (fake), price, and why they may be better.
Return strictly JSON like:
{
  "productName": "...",
  "verdict": "...",
  "alternatives": [...]
}`;

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
      const jsonStart = raw.indexOf('{');
      if (jsonStart === -1) throw new Error('No JSON found in AI response');
      parsed = JSON.parse(raw.slice(jsonStart).trim());
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
