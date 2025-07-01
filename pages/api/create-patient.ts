import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔐 pełny dostęp
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, phone, name, lang } = req.body;
  const password = crypto.randomUUID();

  try {
    console.log('✅ Tworzenie użytkownika...', email);

    // 🔐 Tworzymy użytkownika
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: phone?.startsWith('+') ? phone : undefined, // dodaj tylko poprawne numery
    });

    if (createError || !data?.user?.id) {
      console.error('❌ Błąd createUser:', createError);
      return res.status(500).json({ error: createError?.message || 'Brak ID użytkownika' });
    }

    const userId = data.user.id;
    console.log('🔐 Użytkownik utworzony:', userId);

    // 🧑 Dodajemy do users
    const { error: userInsertError } = await supabase.from('users').insert({
      user_id: userId,
      name,
      email,
      phone,
      role: 'patient',
      lang,
    });

    if (userInsertError) {
      console.error('❌ Błąd insert do users:', userInsertError);
      return res.status(500).json({ error: userInsertError.message });
    }

    // 🧾 Dodajemy do patients
    const { error: patientInsertError } = await supabase.from('patients').insert({
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
      medical_data: {},
    });

    if (patientInsertError) {
      console.error('❌ Błąd insert do patients:', patientInsertError);
      return res.status(500).json({ error: patientInsertError.message });
    }

    // 📧 Link resetujący hasło
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://dcp.care/reset',
    });

    if (resetError) {
      console.error('❌ Błąd resetPassword:', resetError);
      return res.status(500).json({ error: resetError.message });
    }

    console.log('✅ Konto pacjenta utworzone pomyślnie');

    return res.status(200).json({ success: true, userId, password });
  } catch (err) {
    console.error('❌ Nieoczekiwany błąd:', err);
    return res.status(500).json({ error: (err as Error).message || 'Błąd serwera' });
  }
}
