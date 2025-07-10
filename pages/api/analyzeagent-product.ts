import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { barcode, lang, patient } = req.body;

  if (!barcode) {
    return res.status(400).json({ error: 'Missing barcode' });
  }

  try {
    // 📦 Fetch product info from Open Food Facts
    const off = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await off.json();

    if (!data?.product?.product_name) {
      return res.status(404).json({ error: 'Product not found in Open Food Facts' });
    }

    const ingredients = data.product.ingredients_text ?? '';
    const productName = data.product.product_name;
    const nutrition = data.product.nutriments ?? {};

    // 🧠 AI prompt
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

    const raw = completion.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonStart = raw.indexOf('{');
      if (jsonStart === -1) throw new Error('No JSON found in AI response');
      const jsonString = raw.slice(jsonStart).trim();
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error('❌ AI response parsing error:', raw);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('❌ analyzeagent-product error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
