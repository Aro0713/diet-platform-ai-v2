import React from 'react';
import { PatientData } from '@/types';

interface Props {
  form: PatientData;
  setForm: (data: PatientData) => void;
}

export default function PatientDataForm({ form, setForm }: Props) {
  return (
    <div className="bg-white/70 border rounded p-4 mb-6 space-y-4">
      <h2 className="text-lg font-semibold">🧍 Dane fizyczne pacjenta</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="number"
          placeholder="Wiek"
          className="border px-3 py-2 rounded"
          value={form.age || ''}
          onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
        />
        <select
          className="border px-3 py-2 rounded"
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
          className="border px-3 py-2 rounded"
          value={form.weight || ''}
          onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
        />
        <input
          type="number"
          placeholder="Wzrost (cm)"
          className="border px-3 py-2 rounded"
          value={form.height || ''}
          onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
