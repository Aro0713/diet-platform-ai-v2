import type { NextApiRequest, NextApiResponse } from 'next';
import { interviewNarrativeAgent } from '@/agents/interviewNarrativeAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { interviewData, goal, recommendation, lang } = req.body;

  if (!interviewData || typeof lang !== 'string') {
    return res.status(400).json({ error: 'Missing input data' });
  }

  try {
    const result = await interviewNarrativeAgent({ interviewData, goal, recommendation, lang });

    const match = result.match(/```json\s*([\s\S]*?)```/);
    const narrativeText = result.split('```json')[0].trim();
    const structuredOutput = match?.[1] ? JSON.parse(match[1]) : null;

    return res.status(200).json({ narrativeText, structuredOutput });
  } catch (err) {
    console.error('❌ AI agent error:', err);
    return res.status(500).json({ error: 'Agent failed' });
  }
}
