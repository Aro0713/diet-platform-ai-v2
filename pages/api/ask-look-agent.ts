// pages/api/ask-look-agent.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import formidable from 'formidable';
import { readFile } from 'fs/promises';

export const config = {
  api: {
    bodyParser: false
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable();

  try {
    const [fields, files] = await form.parse(req);
    const question = fields.question?.[0] || '';
    const lang = fields.lang?.[0] || 'pl';

    // 📦 pełny kontekst pacjenta
    const patient = JSON.parse(fields.patient?.[0] || '{}');
    const formData = JSON.parse(fields.form?.[0] || '{}');
    const interviewData = JSON.parse(fields.interviewData?.[0] || '{}');
    const medical = JSON.parse(fields.medical?.[0] || '{}');
    const dietPlan = JSON.parse(fields.dietPlan?.[0] || '{}');
    const basket = JSON.parse(fields.basket?.[0] || '[]');

    // 📷 zdjęcie (opcjonalnie)
    const imageFile = files.image?.[0];
    let base64Image: string | null = null;

    if (imageFile) {
      const buffer = await readFile(imageFile.filepath);
      base64Image = `data:${imageFile.mimetype};base64,${buffer.toString('base64')}`;
    }

    // 🧠 PROMPT: Look wie wszystko
    const prompt = `
You are Look — a friendly personal assistant in the Diet Care Platform (DCP).
You see everything the patient has entered: health, diet, medical history, interview, goals, basket, preferences, and images.
The user question is: "${question}"

Always answer in: ${lang}.
If the user asks about DCP — explain it naturally.
If it's about products, health, diet, goals — answer from their data.
Never invent data if not present.

Patient data:
- name: ${patient?.name}
- age: ${patient?.age}
- sex: ${patient?.sex}
- region: ${patient?.region}
- conditions: ${patient?.conditions?.join(', ') || 'brak'}
- medical summary: ${patient?.health_status || '[brak]'}

Interview: ${JSON.stringify(interviewData)}
Form: ${JSON.stringify(formData)}
Medical: ${JSON.stringify(medical)}
Diet plan: ${JSON.stringify(dietPlan)}
Basket: ${JSON.stringify(basket)}

Image: ${base64Image ? '[attached]' : '[none]'}

Respond in natural, human language in JSON format:
{
  "mode": "response",
  "answer": "twoja odpowiedź dla użytkownika",
  "summary": "krótkie podsumowanie",
  "suggestion": "opcjonalna propozycja co dalej",
  "sources": ["DCP", "interview", "diet", "medical"]
}
`;

    const messages: any[] = [
      { role: 'system', content: 'You are Look, personal AI assistant in DCP.' }
    ];

    if (base64Image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.4
    });

    const content = completion.choices[0]?.message?.content;

    if (!content || !content.includes('{')) {
      return res.status(400).json({ error: 'Empty or invalid GPT response' });
    }

    try {
      const cleaned = content
        .replace(/^```json\n?/, '')
        .replace(/^```/, '')
        .replace(/\n?```$/, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch (err) {
      return res.status(400).json({ error: 'Failed to parse GPT JSON', raw: content });
    }
  } catch (err) {
    console.error('❌ Look agent error:', err);
    return res.status(500).json({ error: 'Server error in Look agent' });
  }
}
