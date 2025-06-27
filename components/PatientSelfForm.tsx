import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { tUI, type LangKey } from '@/utils/i18n';

interface Props {
  lang: LangKey;
}

const PatientSelfForm: React.FC<Props> = ({ lang }) => {
  const [loading, setLoading] = useState(true);
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
  const fetchPatient = async () => {
    const userId = localStorage.getItem('currentUserID');
    if (!userId) {
      console.error('❌ Brak user_id w localStorage');
      return;
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('❌ Błąd pobierania danych pacjenta:', error);
      setLoading(false);
      return;
    }

    console.log('📦 Dane pacjenta z Supabase:', data);

    setPatient({
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      sex: data.sex || '',
      age: data.age?.toString() || '',
      height: data.height?.toString() || '',
      weight: data.weight?.toString() || '',
      region: data.region || '',
    });

    setLoading(false);
  };

  fetchPatient();
}, []);

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setPatient((prev) => ({ ...prev, [name]: value }));
};

const handleSave = async () => {
  const userId = localStorage.getItem('currentUserID');
  if (!userId) {
    console.error('❌ Brak user_id podczas zapisu');
    setMessage(tUI('saveError', lang));
    return;
  }

  console.log('💾 Zapis do Supabase dla user_id:', userId);

  setSaving(true);
  setMessage('');

  const { error } = await supabase
    .from('patients')
    .upsert([{
      user_id: userId,
      name: patient.name,
      phone: patient.phone,
      sex: patient.sex,
      age: patient.age ? parseInt(patient.age) : null,
      height: patient.height ? parseInt(patient.height) : null,
      weight: patient.weight ? parseInt(patient.weight) : null,
      region: patient.region,
    }]);

  if (error) {
    console.error('❌ Błąd zapisu danych pacjenta:', error.message);
    setMessage(tUI('saveError', lang));
  } else {
    console.log('✅ Dane pacjenta zapisane.');
    setMessage(tUI('saveSuccess', lang));
  }

  setSaving(false);
};

if (loading) {
  return <p className="text-sm text-gray-500">{tUI('loading', lang)}...</p>;
}

  return (
  <div className="space-y-4 max-w-xl mx-auto">
    <h2 className="text-xl font-bold">{tUI('patientData', lang)}</h2>

    <input
      name="name"
      value={patient.name}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
                 border border-gray-300 dark:border-gray-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      placeholder={tUI('fullName', lang)}
    />

    <input
      name="email"
      value={patient.email}
      disabled
      className="w-full px-4 py-2 rounded-md bg-gray-100 text-gray-500 
                 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
      placeholder="Email"
    />

    <input
      name="phone"
      value={patient.phone}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
                 border border-gray-300 dark:border-gray-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      placeholder={tUI('phone', lang)}
    />

    <select
      name="sex"
      value={patient.sex}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded-md bg-white text-black 
                 dark:bg-gray-800 dark:text-white 
                 border border-gray-300 dark:border-gray-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
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
      className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
                 border border-gray-300 dark:border-gray-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      placeholder={tUI('age', lang)}
    />

    <input
      name="height"
      type="number"
      value={patient.height}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
                 border border-gray-300 dark:border-gray-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      placeholder={tUI('height', lang)}
    />

    <input
      name="weight"
      type="number"
      value={patient.weight}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
                 border border-gray-300 dark:border-gray-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      placeholder={tUI('weight', lang)}
    />

    <input
      name="region"
      value={patient.region}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 
                 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
                 border border-gray-300 dark:border-gray-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
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
