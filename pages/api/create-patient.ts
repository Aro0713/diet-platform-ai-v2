import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📥 [API] POST /api/create-patient INIT');

  // ✅ Zmienne środowiskowe – bezpieczne pobranie i log
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔐 ENV check:', {
    SUPABASE_URL: !!supabaseUrl,
    SERVICE_ROLE_KEY: !!serviceRoleKey,
  });

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Brak SUPABASE_SERVICE_ROLE_KEY lub SUPABASE_URL w .env lub Vercel');
    return res.status(500).json({ error: 'Brak SUPABASE_SERVICE_ROLE_KEY lub SUPABASE_URL' });
  }

  // ✅ Utwórz klienta dopiero wewnątrz handlera
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  if (req.method !== 'POST') {
    console.warn('⛔ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, name, phone, lang = 'pl' } = req.body;

  if (!email || !password || !name) {
    console.warn('⛔ Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('🔐 Tworzenie konta pacjenta w Supabase...');
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

    if (error || !data?.user?.id) {
      console.error('❌ Błąd createUser:', error?.message);
      return res.status(500).json({ error: error?.message || 'Create user error' });
    }

    console.log('📄 Dodawanie pacjenta do tabeli `patients`...');
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
      console.error('❌ Błąd insertu do patients:', insert.error.message);
      return res.status(500).json({ error: insert.error.message });
    }

    console.log('✅ Pacjent utworzony:', data.user.id);
    return res.status(200).json({ user_id: data.user.id });
  } catch (err) {
    console.error('❌ Błąd serwera (exception):', err);
    return res.status(500).json({ error: (err as Error).message || 'Server error' });
  }
}
