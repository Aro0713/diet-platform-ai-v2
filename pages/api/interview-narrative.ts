import type { NextApiRequest, NextApiResponse } from 'next';
import { interviewNarrativeAgent } from '@/agents/interviewNarrativeAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { interviewData, goal, recommendation, lang } = req.body;

  if (
    !interviewData || typeof lang !== 'string' ||
    typeof interviewData !== 'object' || Object.keys(interviewData).length < 3
  ) {
    return res.status(400).json({ error: 'Insufficient input data' });
  }

  try {
    const result = await interviewNarrativeAgent({ interviewData, goal, recommendation, lang });

    // 🔍 Oddziel opis narracyjny od JSON-a (```json ... ```)
    const match = result.match(/```json\s*([\s\S]*?)```/);
    const narrativeText = result.split('```json')[0].trim();
    let structuredOutput = null;

    if (match && match[1]) {
      try {
        structuredOutput = JSON.parse(match[1]);
      } catch (e) {
        console.warn('⚠️ JSON parsing failed in API handler:', e);
      }
    }

    return res.status(200).json({
      narrativeText,
      structuredOutput
    });

  } catch (err) {
    console.error('❌ interviewNarrativeAgent error:', err);
    return res.status(500).json({ error: 'Agent failed' });
  }
}

