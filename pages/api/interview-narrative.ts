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
    return res.status(200).send(result); // send full text (including ```json block)
  } catch (err) {
    console.error('❌ interviewNarrativeAgent error:', err);
    return res.status(500).json({ error: 'Agent failed' });
  }
}
