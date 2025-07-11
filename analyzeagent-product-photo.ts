import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false
  }
};

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

  const form = formidable({
    multiples: false,
    maxFileSize: 10 * 1024 * 1024,
    keepExtensions: true,
    allowEmptyFiles: false
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Formidable error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const lang = fields.lang?.toString() || 'pl';
    const patient = JSON.parse(fields.patient?.toString() || '{}');
    const userLanguage = languageLabel[lang] || 'English';

    const rawFile = files.image;
    if (!rawFile) {
      return res.status(400).json({ error: 'Image not provided' });
    }

    const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    if (!file.filepath || !file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid image file' });
    }

    try {
      const buffer = await readFile(file.filepath);
      const base64 = buffer.toString('base64');
      const imageDataUrl = `data:${file.mimetype};base64,${base64}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'You are an expert dietitian AI analyzing food product labels based on medical context.'
          },
          {
            role: 'user',
            content: `A patient uploads a photo of a food label.

Please respond in ${userLanguage}.

Patient context:
- Conditions: ${patient.conditions?.join(', ') || 'none'}
- Allergies: ${patient.allergies || 'none'}
- Diet model: ${patient.dietModel || 'not specified'}

Please analyze this product and return:
- productName (if visible on label),
- dietaryAnalysis: a short human-friendly summary (~3 sentences) that clearly explains whether the patient should consume this product, and why (or why not),
- allowPurchase: true/false — can the patient safely buy it?
- reasons: key arguments why it’s suitable/unsuitable (brief, bullet points),
- cheapestShop: where it's available (fake name), approximate price,
- betterAlternative: 1 product (name, shop, price, why it's a better dietary choice).

⚠️ Respond ONLY with valid JSON (no markdown, no intro, no explanation), like:
{
  "productName": "...",
  "dietaryAnalysis": "...",
  "allowPurchase": true,
  "reasons": ["...", "..."],
  "cheapestShop": {
    "name": "...",
    "price": "..."
  },
  "betterAlternative": {
    "name": "...",
    "shop": "...",
    "price": "...",
    "whyBetter": "..."
  }
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Food label image:'
              },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl }
              }
            ]
          }
        ]
      });

      const raw = completion.choices?.[0]?.message?.content || '';
      console.log('🧠 GPT RAW response:', raw);

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
        console.error('❌ Parsing error in analyze-photo:', raw);
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }

      return res.status(200).json(parsed);
    } catch (error: any) {
      console.error('❌ Photo AI error:', error.response?.data || error.message || error);
      return res.status(500).json({
        error: error.response?.data || error.message || 'Unknown error'
      });
    }
  });
}
