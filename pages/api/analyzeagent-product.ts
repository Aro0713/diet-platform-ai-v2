import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { barcode, lang, patient } = req.body;
  if (!barcode) return res.status(400).json({ error: 'Missing barcode' });

  try {
    // 📦 Fetch from Open Food Facts
    const off = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await off.json();

    if (!data?.product?.product_name) {
      return res.status(404).json({ error: 'Product not found in Open Food Facts' });
    }

    const ingredients = data.product.ingredients_text ?? '';
    const productName = data.product.product_name;
    const nutrition = data.product.nutriments ?? {};

    // 🧠 Prompt for AI analysis
    const prompt = `
You are a clinical nutrition AI. Analyze the following product for dietary compatibility.

Patient data:
- Conditions: ${patient.conditions?.join(', ') || 'none'}
- Allergies: ${patient.allergies || 'none'}
- Diet model: ${patient.dietModel || 'not specified'}

Product:
- Name: ${productName}
- Ingredients: ${ingredients}
- Nutritional info: ${JSON.stringify(nutrition)}

Give a short compatibility verdict (max 3 sentences) and whether the product is acceptable for the user.

Then, suggest 1–3 alternative products: name, shop (fake), price, and why they may be better.

Return strictly JSON like:
{
  "productName": "...",
  "ingredients": "...",
  "verdict": "...",
  "pricing": [...],
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

    const text = completion.choices[0].message.content || '';
    const jsonStart = text.indexOf('{');
    const parsed = JSON.parse(text.slice(jsonStart));

    res.status(200).json(parsed);
  } catch (err: any) {
    console.error('❌ analyzeagent-product error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
}
