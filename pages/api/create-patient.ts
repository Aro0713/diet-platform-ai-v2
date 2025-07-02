import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔧 Oczyszcza numer z niepotrzebnych znaków i sprawdza czy zaczyna się od "+"
function normalizePhone(phone: string): string | undefined {
  if (!phone) return undefined;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return cleaned.startsWith('+') ? cleaned : undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    console.warn('❌ Zła metoda HTTP:', req.method);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, phone, name, lang } = req.body;

  if (!email || !phone || !name || !lang) {
    console.warn('❌ Brak wymaganych pól:', { email, phone, name, lang });
    return res.status(400).json({ error: 'Brakuje wymaganych danych (email, telefon, imię, język)' });
  }

  const password = crypto.randomUUID();
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    console.warn('❌ Nieprawidłowy numer telefonu:', phone);
    return res.status(400).json({ error: 'Nieprawidłowy numer telefonu' });
  }

  try {
    console.log('✅ 1️⃣ Tworzenie użytkownika:', email, normalizedPhone);

    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: normalizedPhone,
    });

    if (createError || !data?.user?.id) {
      console.error('❌ 1️⃣ Błąd createUser:', createError);
      return res.status(500).json({
        error: createError?.message || 'Błąd tworzenia użytkownika (brak ID)',
      });
    }

    const userId = data.user.id;
    console.log('✅ 2️⃣ Użytkownik utworzony:', userId);

    const { error: userInsertError } = await supabase.from('users').insert({
      user_id: userId,
      name,
      email,
      phone: normalizedPhone,
      role: 'patient',
      lang,
    });

    if (userInsertError) {
      console.error('❌ 2️⃣ Błąd insert do users:', userInsertError);
      return res.status(500).json({
        error: userInsertError.message || 'Błąd zapisu do tabeli users',
      });
    }

    console.log('✅ 3️⃣ Dodano do tabeli users');

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
      console.error('❌ 3️⃣ Błąd insert do patients:', patientInsertError);
      return res.status(500).json({
        error: patientInsertError.message || 'Błąd zapisu do tabeli patients',
      });
    }

    console.log('✅ 4️⃣ Dodano do tabeli patients');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://dcp.care/reset',
    });

    if (resetError) {
      console.error('❌ 4️⃣ Błąd resetPassword:', resetError);
      return res.status(500).json({
        error: resetError.message || 'Błąd przy wysyłce linku resetującego hasło',
      });
    }

    console.log('✅ 5️⃣ Link resetujący wysłany');

    return res.status(200).json({ success: true, userId, password });
  } catch (err: any) {
    console.error('❌ 🔚 Nieoczekiwany błąd:', err);

    const message = typeof err === 'string'
      ? err
      : err?.message || 'Błąd serwera – brak szczegółów';

    return res.status(500).json({ error: message });
  }
}

