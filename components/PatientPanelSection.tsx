import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PatientData } from '@/types';
import { LangKey, tUI } from '@/utils/i18n';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

interface Props {
  form: PatientData;
  setForm: (data: PatientData) => void;
  lang: LangKey;
}

const PatientPanelSection = ({ form, setForm, lang }: Props) => {
  const [mode, setMode] = useState<'lookup' | 'create'>('lookup');
  const [emailInput, setEmailInput] = useState('');
  const [status, setStatus] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<'pl'>('pl');

  useEffect(() => {
    fetch('https://ip-api.com/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data?.countryCode) {
          setDetectedCountry(data.countryCode.toLowerCase());
        }
      })
      .catch(() => setDetectedCountry('pl'));
  }, []);

const fetchPatientData = async () => {
  setStatus(tUI('searchingPatient', lang));

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*, user_id')
      .ilike('email', emailInput.trim())
      .maybeSingle();

    if (error || !data) {
      console.warn('❌ Nie znaleziono pacjenta:', emailInput);
      setStatus(tUI('patientNotFound', lang));
      return;
    }

    console.log('✅ Dane pacjenta z Supabase:', data);

    setForm({
      user_id: data.user_id || '',
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      age: data.age || null,
      sex: data.sex || '',
      weight: data.weight || null,
      height: data.height || null,
      region: data.region || '',
      allergies: data.allergies || '',
      conditions: data.conditions || [],
      medical: data.medical || [],
      goal: data.goal || '',
      cuisine: data.cuisine || '',
      model: data.model || '',
    });

    // Dane medyczne
    if (typeof window !== 'undefined' && (window as any).setMedicalDataFromPanel) {
      (window as any).setMedicalDataFromPanel({
        summary: data.health_status || '',
        json: data.medical_data || null,
      });
    }

    // Dane z wywiadu
    if (typeof window !== 'undefined' && (window as any).setInterviewDataFromPanel) {
      (window as any).setInterviewDataFromPanel(data.interview_data || {});
    }

    setStatus(tUI('patientDataLoaded', lang));
  } catch (err) {
    console.error('❌ Błąd podczas pobierania pacjenta:', err);
    setStatus('Błąd po stronie klienta.');
  }
};

  const createPatientAccount = async () => {
    setStatus(tUI('sendingInvitation', lang));

    try {
      const password = Math.random().toString(36).slice(2, 10) + 'Dcp!'; // tymczasowe hasło

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password,
        options: {
          emailRedirectTo: 'https://dcp.care/register?confirmed=true',
          data: {
            name: form.name,
            phone: form.phone,
            role: 'patient',
            lang,
          },
        },
      });

      if (error) {
        console.error('❌ Błąd rejestracji pacjenta:', error.message);
        setStatus(error.message || tUI('createAccountError', lang));
        return;
      }

      console.log('📬 Link aktywacyjny wysłany do pacjenta:', form.email);
      setStatus(tUI('invitationSent', lang));
    } catch (err) {
      console.error('❌ Wyjątek podczas rejestracji:', err);
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
          <PhoneInput
            defaultCountry={detectedCountry}
            value={form.phone}
            onChange={(phone) => setForm({ ...form, phone })}
            inputClassName="w-full h-[44px] text-sm bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
            inputProps={{
              name: 'phone',
              required: true,
              id: 'phone',
              'aria-label': tUI('phone', lang),
              placeholder: tUI('phone', lang),
            }}
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
