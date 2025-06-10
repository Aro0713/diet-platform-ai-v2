import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // tylko backend
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name, phone, lang } = req.body;

  try {
    const password = Math.random().toString(36).slice(-12);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) throw new Error(error.message);

    await supabaseAdmin.from('users').insert({
      user_id: data.user.id,
      email,
      name,
      phone,
      lang,
      role: 'patient'
    });

    res.status(200).json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ API error:', message);
    res.status(500).json({ error: message });
  }
}
