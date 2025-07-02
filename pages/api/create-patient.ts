import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ Normalizacja numeru – dodaj +48 jeśli wygląda na polski
function normalizePhone(phone: string): string | undefined {
  const cleaned = phone.trim();
  if (cleaned.startsWith('+')) return cleaned;
  if (/^\d{9}$/.test(cleaned)) return `+48${cleaned}`; // domyślnie Polska
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, phone, name, lang } = req.body;
  const password = crypto.randomUUID();
  const normalizedPhone = normalizePhone(phone);

  try {
    console.log('✅ Tworzenie użytkownika...', email, normalizedPhone);

    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: normalizedPhone,
    });

    if (createError || !data?.user?.id) {
      console.error('❌ Błąd createUser:', createError);
      return res.status(500).json({
        error: createError?.message || 'Błąd tworzenia użytkownika (brak ID)',
      });
    }

    const userId = data.user.id;
    console.log('🔐 Użytkownik utworzony:', userId);

    const { error: userInsertError } = await supabase.from('users').insert({
      user_id: userId,
      name,
      email,
      phone: normalizedPhone,
      role: 'patient',
      lang,
    });

    if (userInsertError) {
      console.error('❌ Błąd insert do users:', userInsertError);
      return res.status(500).json({
        error: userInsertError.message || 'Błąd zapisu do tabeli users',
      });
    }

    const { error: patientInsertError } = await supabase.from('patients').insert({
      user_id: userId,
      name,
      email,
      phone: normalizedPhone,
      lang,
      sex: 'unknown',
      age: null,
      weight: null,
      height: null,
      region: '',
      allergies: '',
      conditions: [],
      health_status: '',
      medical_data: {},
    });

    if (patientInsertError) {
      console.error('❌ Błąd insert do patients:', patientInsertError);
      return res.status(500).json({
        error: patientInsertError.message || 'Błąd zapisu do tabeli patients',
      });
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://dcp.care/reset',
    });

    if (resetError) {
      console.error('❌ Błąd resetPassword:', resetError);
      return res.status(500).json({
        error: resetError.message || 'Błąd przy wysyłce linku resetującego hasło',
      });
    }

    console.log('✅ Konto pacjenta utworzone pomyślnie');
    return res.status(200).json({ success: true, userId, password });
  } catch (err: any) {
    console.error('❌ Nieoczekiwany błąd:', err);

    const message = typeof err === 'string'
      ? err
      : err?.message || 'Błąd serwera – brak szczegółów';

    return res.status(500).json({ error: message });
  }
}
