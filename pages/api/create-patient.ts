// pages/api/create-patient.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, password, name, phone, lang = 'pl' } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      name,
      phone,
      role: 'patient',
      lang
    }
  });

  if (error || !data.user?.id) {
    return res.status(500).json({ error: error?.message || 'Create user error' });
  }

  const insert = await supabaseAdmin.from('patients').insert({
    user_id: data.user.id,
    email,
    name,
    phone,
    lang,
    sex: 'unknown',
    age: null,
    height: null,
    weight: null,
    region: 'default',
    allergies: '',
    conditions: [],
    health_status: '',
    medical_data: {}
  });

  if (insert.error) {
    return res.status(500).json({ error: insert.error.message });
  }

  return res.status(200).json({ user_id: data.user.id });
}
