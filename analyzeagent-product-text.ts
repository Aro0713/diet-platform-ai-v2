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
You are a clinical dietitian AI. Analyze the product described below and return a decision.

Please respond in ${userLanguage}.

Patient data:
- Conditions: ${patient.conditions?.join(', ') || 'none'}
- Allergies: ${patient.allergies || 'none'}
- Diet model: ${patient.dietModel || 'not specified'}

Product description:
"${text}"

Please return:
- productName: if known or deduced from description
- dietaryAnalysis: short summary (2–3 sentences) saying whether the product fits patient's dietary needs
- allowPurchase: true or false — can the patient buy this?
- reasons: list of short arguments supporting the verdict
- cheapestShop: name and price (fake)
- betterAlternative: name, shop, price, why it's better

Return only a valid JSON object, like:
{
  "productName": "...",
  "dietaryAnalysis": "...",
  "allowPurchase": true,
  "reasons": ["...", "..."],
  "cheapestShop": { "name": "...", "price": "..." },
  "betterAlternative": {
    "name": "...",
    "shop": "...",
    "price": "...",
    "whyBetter": "..."
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful dietitian AI.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    console.log('🧠 GPT RAW response (text):', raw);

    if (!raw) {
      return res.status(500).json({ error: 'Empty response from OpenAI' });
    }

    let parsed;
    try {
      const jsonMatches = raw.match(/\{[\s\S]*?\}/g);
      if (!jsonMatches || jsonMatches.length === 0) {
        throw new Error('No valid JSON object found in AI response');
      }

      parsed = JSON.parse(jsonMatches[0]);
    } catch (e) {
      console.error('❌ Parsing error in analyzeagent-product-text:', raw);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('❌ Error in analyzeagent-product-text:', err.response?.data || err.message || err);
    return res.status(500).json({ error: err.response?.data || err.message || 'Internal server error' });
  }
}
