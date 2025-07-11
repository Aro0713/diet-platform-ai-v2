import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { readFile } from 'fs/promises';
import { productAgent } from '@/agents/productAgent';

export const config = {
  api: {
    bodyParser: false
  }
};

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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parsing error:', err);
      return res.status(500).json({ error: 'Form parsing error' });
    }

    try {
      const question = fields.question?.toString() || '';
      const lang = fields.lang?.toString() || 'pl';
      const patient = JSON.parse(fields.patient?.toString() || '{}');
      const userLanguage = languageLabel[lang] || 'English';

      if (!question.trim()) {
        return res.status(400).json({ error: 'Missing question' });
      }

      let imageBase64 = '';
      const rawFile = files.image;
      if (rawFile) {
        const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;
        if (file.filepath && file.mimetype?.startsWith('image/')) {
          const buffer = await readFile(file.filepath);
          imageBase64 = `data:${file.mimetype};base64,${buffer.toString('base64')}`;
        }
      }

      const result = await (productAgent.tools[0] as any).execute({
        barcode: 'N/A',
        productName: '[From user question]',
        ingredients: '[Unknown]',
        nutrition: {},
        patient,
        lang,
        question,
        image: imageBase64
      });

      if (!result || typeof result !== 'object') {
        console.error('❌ Agent returned invalid result:', result);
        return res.status(500).json({ error: 'Agent returned invalid response' });
      }

      console.log('✅ Assistant agent result:', result);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Assistant agent error:', error.response?.data || error.message || error);
      res.status(500).json({ error: error.response?.data || error.message || 'Assistant failed' });
    }
  });
}
