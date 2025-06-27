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
      if (!userId) return;

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
    if (!userId) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('patients')
      .update({
        name: patient.name,
        phone: patient.phone,
        sex: patient.sex,
        age: patient.age ? parseInt(patient.age) : null,
        height: patient.height ? parseInt(patient.height) : null,
        weight: patient.weight ? parseInt(patient.weight) : null,
        region: patient.region,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Błąd zapisu danych pacjenta:', error.message);
      setMessage(tUI('saveError', lang));
    } else {
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
        className="w-full rounded px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        placeholder={tUI('fullName', lang)}
      />

      <input
        name="email"
        value={patient.email}
        disabled
        className="w-full rounded px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500"
        placeholder="Email"
      />

      <input
        name="phone"
        value={patient.phone}
        onChange={handleChange}
        className="w-full rounded px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        placeholder={tUI('phone', lang)}
      />

      <select
        name="sex"
        value={patient.sex}
        onChange={handleChange}
        className="w-full rounded px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
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
        className="w-full rounded px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        placeholder={tUI('age', lang)}
      />

      <input
        name="height"
        type="number"
        value={patient.height}
        onChange={handleChange}
        className="w-full rounded px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        placeholder={tUI('height', lang)}
      />

      <input
        name="weight"
        type="number"
        value={patient.weight}
        onChange={handleChange}
        className="w-full rounded px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        placeholder={tUI('weight', lang)}
      />

      <input
        name="region"
        value={patient.region}
        onChange={handleChange}
        className="w-full rounded px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
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
