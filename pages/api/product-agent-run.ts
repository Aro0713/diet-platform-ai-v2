import type { NextApiRequest, NextApiResponse } from 'next';
import { productAgent } from '@/agents/productAgent';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const input = req.body;

   const result = await (productAgent.tools[0] as any).execute(input);

    res.status(200).json(result);
  } catch (err: any) {
    console.error('❌ API error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
