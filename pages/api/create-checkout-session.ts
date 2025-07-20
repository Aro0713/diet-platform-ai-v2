import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = process.env.STRIPE_SECRET_KEY;

  console.log('🔥 STRIPE_SECRET_KEY:', key ? 'LOADED' : 'MISSING');

  if (!key) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is missing' });
  }

  return res.status(200).json({ ok: true });
}
