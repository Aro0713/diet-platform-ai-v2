import React from 'react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PatientData } from '@/types';
import { LangKey, tUI } from '@/utils/i18n';

interface Props {
  form: PatientData;
  setForm: (data: PatientData) => void;
  lang: LangKey;
}

const PatientPanelSection = ({ form, setForm, lang }: Props) => {
  const [mode, setMode] = useState<'lookup' | 'create'>('lookup');
  const [emailInput, setEmailInput] = useState('');
  const [status, setStatus] = useState('');

  const fetchPatientData = async () => {
    setStatus(tUI('searchingPatient', lang));
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', emailInput)
      .single();

    if (error || !data) {
      setStatus(tUI('patientNotFound', lang));
      return;
    }

    setForm({
      ...form,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
    });

    setStatus(tUI('patientDataLoaded', lang));
  };

  const createPatientAccount = async () => {
    setStatus(tUI('sendingInvitation', lang));

    const tempPassword = crypto.randomUUID();

    const { data, error } = await supabase.auth.admin.createUser({
      email: form.email,
      phone: form.phone,
      password: tempPassword,
      email_confirm: true,
    });

    if (error || !data?.user?.id) {
      console.error('❌ Błąd tworzenia konta pacjenta:', error);
      setStatus(tUI('createAccountError', lang));
      return;
    }

    const insertResult = await supabase.from('users').insert([
      {
        user_id: data.user.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: 'patient',
        lang: lang,
        jurisdiction: null,
        license_number: null,
      },
    ]);

    if (insertResult.error) {
      console.error('❌ Błąd zapisu do public.users:', insertResult.error);
      setStatus(tUI('createAccountError', lang));
      return;
    }

    const resetResult = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: 'https://dcp.care/reset',
    });

    if (resetResult.error) {
      console.error('❌ Błąd wysyłania linku resetującego hasło:', resetResult.error);
      setStatus(tUI('createAccountError', lang));
      return;
    }

    console.log('🔐 Tymczasowe hasło pacjenta:', tempPassword);
    setStatus(tUI('invitationSent', lang));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{`\ud83d\udc64 ${tUI('patientData', lang)}`}</h2>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="lookup"
            checked={mode === 'lookup'}
            onChange={() => setMode('lookup')}
          />
          {tUI('patientHasAccount', lang)}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="create"
            checked={mode === 'create'}
            onChange={() => setMode('create')}
          />
          {tUI('createAccountForPatient', lang)}
        </label>
      </div>

      {mode === 'lookup' ? (
        <div className="space-y-2">
          <input
            type="email"
            className="w-full border px-3 py-2 rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder={tUI('enterPatientEmail', lang)}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          <button
            onClick={fetchPatientData}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            🔍 {tUI('fetchPatientData', lang)}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder={tUI('name', lang)}
            className="border px-3 py-2 rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            placeholder={tUI('email', lang)}
            className="border px-3 py-2 rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="tel"
            placeholder={tUI('phone', lang)}
            className="border px-3 py-2 rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button
            type="button"
            onClick={createPatientAccount}
            className="bg-green-700 text-white px-4 py-2 rounded"
          >
            ➕ {tUI('createAccount', lang)}
          </button>
        </div>
      )}

      {status && <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>}

      <div className="grid grid-cols-2 gap-4 mt-4">
        <input
          type="number"
          placeholder={tUI('age', lang)}
          className="border px-3 py-2 rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={form.age || ''}
          onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
        />
        <select
          className="border px-3 py-2 rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={form.sex}
          onChange={(e) => setForm({ ...form, sex: e.target.value as 'male' | 'female' })}
        >
          <option value="">{tUI('sex', lang)}</option>
          <option value="female">{tUI('female', lang)}</option>
          <option value="male">{tUI('male', lang)}</option>
        </select>
        <input
          type="number"
          placeholder={tUI('weight', lang)}
          className="border px-3 py-2 rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={form.weight || ''}
          onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
        />
        <input
          type="number"
          placeholder={tUI('height', lang)}
          className="border px-3 py-2 rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={form.height || ''}
          onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
export default PatientPanelSection;
