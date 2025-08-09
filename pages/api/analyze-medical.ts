import type { NextApiRequest, NextApiResponse } from 'next';
import { medicalLabAgent } from '@/agents/medicalLabAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      testResults,
      description = '',
      lang,
      selectedConditions = []
    } = req.body || {};

    if (!testResults || !lang) {
      return res.status(400).send('❌ Missing testResults or lang');
    }

    const result = await medicalLabAgent({
      testResults,
      description,
      lang,
      selectedConditions
    });

    res.status(200).send(result);
  } catch (err) {
    console.error('❌ Błąd API /analyze-medical:', err);
    res.status(500).send('❌ Server error during medical analysis');
  }
}
