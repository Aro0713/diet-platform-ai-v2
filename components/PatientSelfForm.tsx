import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { tUI, type LangKey } from '@/utils/i18n';

interface Props {
  lang: LangKey;
  value: any;
  onChange?: (updated: any) => void;
}

const PatientSelfForm: React.FC<Props> = ({ lang, value, onChange }) => {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [patient, setPatient] = useState({
    name: '',
    email: '',
    phone: '',
    sex: '',
    age: '',
    height: '',
    weight: '',
    region: '',
  });

  useEffect(() => {
    if (value) {
      setPatient({
        name: value.name || '',
        email: value.email || '',
        phone: value.phone || '',
        sex: value.sex || '',
        age: value.age?.toString() || '',
        height: value.height?.toString() || '',
        weight: value.weight?.toString() || '',
        region: value.region || '',
      });
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updated = { ...patient, [name]: value };
    setPatient(updated);
    if (onChange) onChange(updated);
  };

  const handleSave = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('currentUserID') : null;
    if (!userId || !patient.email) {
      setMessage(tUI('saveError', lang));
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('patients')
      .upsert([
        {
          user_id: userId,
          ...patient,
          age: patient.age ? parseInt(patient.age) : null,
          height: patient.height ? parseInt(patient.height) : null,
          weight: patient.weight ? parseInt(patient.weight) : null,
        },
      ], { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Błąd zapisu danych pacjenta:', error.message);
      setMessage(tUI('saveError', lang));
    } else {
      setMessage(tUI('saveSuccess', lang));
    }

    setSaving(false);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold">{tUI('patientData', lang)}</h2>

      <input
        name="name"
        value={patient.name}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        placeholder={tUI('fullName', lang)}
      />

      <input
        name="email"
        value={patient.email}
        disabled
        className="w-full px-4 py-2 rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
        placeholder="Email"
      />

      <input
        name="phone"
        value={patient.phone}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        placeholder={tUI('phone', lang)}
      />

      <select
        name="sex"
        value={patient.sex}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded-md bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      >
        <option value="">{tUI('selectOption', lang)}</option>
        <option value="female">{tUI('female', lang)}</option>
        <option value="male">{tUI('male', lang)}</option>
        <option value="other">{tUI('other', lang)}</option>
      </select>

      <input
        name="age"
        type="number"
        value={patient.age}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        placeholder={tUI('age', lang)}
      />

      <input
        name="height"
        type="number"
        value={patient.height}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        placeholder={tUI('height', lang)}
      />

      <input
        name="weight"
        type="number"
        value={patient.weight}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        placeholder={tUI('weight', lang)}
      />

      <input
        name="region"
        value={patient.region}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        placeholder={tUI('region', lang)}
      />

      <button
        onClick={handleSave}
        className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition disabled:opacity-50"
        disabled={saving}
      >
        {saving ? tUI('saving', lang) : tUI('save', lang)}
      </button>

      {message && <p className="text-sm text-blue-600 mt-2">{message}</p>}
    </div>
  );
};

export default PatientSelfForm;
