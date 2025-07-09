// pages/api/create-patient.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📥 [API] POST /api/create-patient INIT');

  // 🔍 DEBUG: Sprawdź zmienne środowiskowe
  console.log('🛠️ DEBUG ENV SUPABASE_URL:', process.env.SUPABASE_URL ? '[OK]' : '[MISSING]');
  console.log('🛠️ DEBUG ENV SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[OK]' : '[MISSING]');
  console.log('🛠️ DEBUG ENV VERCEL_ENV:', process.env.VERCEL_ENV || '[undefined]');

  if (req.method !== 'POST') {
    console.warn('⛔ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ ENV problem: SUPABASE_URL or SERVICE_ROLE_KEY is missing');
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { email, password, name, phone, lang = 'pl' } = req.body;

  if (!email || !password || !name) {
    console.warn('⛔ Missing required fields');
    return res.status(400).json({ error: 'Missing required fields: email, password, name' });
  }

  try {
    console.log('🔐 Tworzenie konta pacjenta w Supabase (auth.users)...');
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      phone,
      user_metadata: {
        name,
        role: 'patient',
        lang
      }
    });

    if (createError || !userData?.user?.id) {
      console.error('❌ Błąd createUser:', createError?.message);
      return res.status(500).json({ error: createError?.message || 'Create user error' });
    }

    const user_id = userData.user.id;

    console.log('📄 Dodawanie rekordu do tabeli `patients`...');
    const { error: insertError } = await supabaseAdmin.from('patients').insert({
      user_id,
      email,
      name,
      phone,
      lang,
      role: 'patient',
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

    if (insertError) {
      console.error('❌ Błąd insertu do patients:', insertError.message);
      return res.status(500).json({ error: insertError.message });
    }

    console.log('✅ Pacjent utworzony i zapisany. Trigger wyśle e-mail.');
    return res.status(200).json({ user_id });
  } catch (err) {
    console.error('❌ Błąd serwera (exception):', err);
    return res.status(500).json({ error: (err as Error).message || 'Server error' });
  }
}
