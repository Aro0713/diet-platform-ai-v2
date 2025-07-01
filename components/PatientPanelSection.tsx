import React, { useState } from 'react';
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
    .from('patients')
    .select('*')
    .ilike('email', emailInput.trim()) 
    .maybeSingle();

    if (error || !data) {
      setStatus(tUI('patientNotFound', lang));
      return;
    }

    setForm({
      ...form,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      age: data.age || null,
      sex: data.sex || '',
      weight: data.weight || null,
      height: data.height || null,
    });

    setStatus(tUI('patientDataLoaded', lang));
  };

  const createPatientAccount = async () => {
    setStatus(tUI('sendingInvitation', lang));

    try {
      const res = await fetch('/api/create-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
          name: form.name,
          lang,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('❌ API error:', json.error);
        setStatus(tUI('createAccountError', lang));
        return;
      }

      console.log('📬 Tymczasowe hasło:', json.password);
      setStatus(tUI('invitationSent', lang));
    } catch (err) {
      console.error('❌ Błąd po stronie klienta:', err);
      setStatus(tUI('createAccountError', lang));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">🧍 {tUI('patientData', lang)}</h2>

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
};

export default PatientPanelSection;
