// pages/api/analyzeagent-product-photo.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false
  }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Formidable error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    const lang = fields.lang?.toString() || 'pl';
    const patient = JSON.parse(fields.patient?.toString() || '{}');

    const rawFile = files.image;
    if (!rawFile) {
      return res.status(400).json({ error: 'Image not provided' });
    }

    const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;

    try {
      const buffer = await readFile(file.filepath);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful nutrition AI that understands product labels.'
          },
          {
            role: 'user',
            content: `A patient uploads a photo of a food label. 

Analyze its compatibility with:
- Conditions: ${patient.conditions?.join(', ') || 'none'}
- Allergies: ${patient.allergies || 'none'}
- Diet model: ${patient.dietModel || 'not specified'}

Describe:
- What the product likely is (guess name if not visible)
- Its risk/benefit
- Verdict: allowed / not allowed / neutral
- Suggest 1–2 alternatives

Return strictly JSON like:
{
  "productName": "...",
  "verdict": "...",
  "alternatives": [ ... ]
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Zdjęcie etykiety produktu:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${file.mimetype};base64,${buffer.toString('base64')}`
                }
              }
            ]
          }
        ],
        temperature: 0.3
      });

      const raw = completion.choices?.[0]?.message?.content || '';
      let parsed;

      try {
        const jsonStart = raw.indexOf('{');
        if (jsonStart === -1) throw new Error('No JSON found in AI response');
        parsed = JSON.parse(raw.slice(jsonStart).trim());
      } catch (e) {
        console.error('❌ Parsing error in analyzeagent-product-photo:', raw);
        return res.status(500).json({ error: 'Failed to parse AI response' });
      }

      return res.status(200).json(parsed);
    } catch (error: any) {
      console.error('❌ Photo AI error:', error.message);
      return res.status(500).json({ error: 'Image analysis failed' });
    }
  });
}
