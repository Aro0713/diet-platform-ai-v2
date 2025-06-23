import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const languageMap: Record<string, string> = {
  pl: 'polski',
  en: 'English',
  es: 'español',
  fr: 'français',
  de: 'Deutsch',
  ua: 'українська',
  ru: 'русский',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
  he: 'עברית'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { interviewData, goal, recommendation, lang } = req.body;

  if (!interviewData || typeof lang !== 'string') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const selectedLang = languageMap[lang] || 'polski';

  const prompt = `
Language: ${selectedLang}

Convert the following structured patient interview data into a short, fluent narrative paragraph suitable for a PDF medical report.

Input:
- Interview data:
${JSON.stringify(interviewData, null, 2)}

- Diet goal: ${goal}
- Doctor's notes: ${recommendation}

Write only one natural paragraph in ${selectedLang}. Mention conditions, stress, sleep, activity, preferences if relevant. Avoid technical jargon.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a medical assistant writing patient-friendly PDF summaries.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    });

    const narrativeText = completion.choices[0].message.content ?? '⚠️ No response.';
    return res.status(200).json({ narrativeText });
  } catch (err) {
    console.error('❌ GPT error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
