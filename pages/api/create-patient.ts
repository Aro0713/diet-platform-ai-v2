// pages/api/create-patient.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔐 pełny dostęp
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, phone, name, lang } = req.body;
  const password = crypto.randomUUID();

  try {
    // 🔐 Tworzymy użytkownika
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      phone,
      password,
      email_confirm: true
    });

    if (error || !data?.user?.id) {
      return res.status(500).json({ error: error?.message || 'Brak ID użytkownika' });
    }

    const userId = data.user.id;

    // 🧑 Dodajemy do users
    await supabase.from('users').insert({
      user_id: userId,
      name,
      email,
      phone,
      role: 'patient',
      lang
    });

    // 🧾 Dodajemy do patients
    await supabase.from('patients').insert({
      user_id: userId,
      name,
      email,
      phone,
      lang,
      sex: 'unknown',
      age: null,
      weight: null,
      height: null,
      region: '',
      allergies: '',
      conditions: [],
      health_status: '',
      medical_data: {}
    });

    // 🔄 Link resetujący hasło
    await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://dcp.care/reset',
    });

    return res.status(200).json({ success: true, password });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
