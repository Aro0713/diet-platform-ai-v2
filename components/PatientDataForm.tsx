import React from 'react';
import { PatientData } from '@/types';

interface Props {
  form: PatientData;
  setForm: (data: PatientData) => void;
}

export default function PatientDataForm({ form, setForm }: Props) {
  return (
    <div className="bg-white/70 dark:bg-white/10 border border-white/30 dark:border-white/10 rounded-2xl p-4 md:p-6 mb-6 space-y-4">
      <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
        🧍 Dane fizyczne pacjenta
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <input
          type="number"
          placeholder="Wiek"
          className="w-full text-sm md:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-md"
          value={form.age || ''}
          onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
        />

        <select
          className="w-full text-sm md:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-md"
          value={form.sex}
          onChange={(e) => setForm({ ...form, sex: e.target.value as 'male' | 'female' })}
        >
          <option value="">Płeć</option>
          <option value="female">Kobieta</option>
          <option value="male">Mężczyzna</option>
        </select>

        <input
          type="number"
          placeholder="Waga (kg)"
          className="w-full text-sm md:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-md"
          value={form.weight || ''}
          onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
        />

        <input
          type="number"
          placeholder="Wzrost (cm)"
          className="w-full text-sm md:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white px-3 py-2 rounded-md"
          value={form.height || ''}
          onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
