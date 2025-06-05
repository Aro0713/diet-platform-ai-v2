import React from 'react';
import PanelCard from './PanelCard';

interface Props {
  selectedConditions: string[];
  conditionToTests: Record<string, string[]>;
  values: Record<string, string>;
  onChange: (test: string, value: string) => void;
}

const testInputTypes: Record<string, 'number' | 'range' | 'text'> = {
  'Glukoza': 'number',
  'HbA1c': 'number',
  'Kreatynina': 'number',
  'TSH': 'number',
  'Witamina D3': 'number',
  'Pomiar ciśnienia': 'range',
  'Saturacja': 'range',
  'EKG': 'text',
  'Gastroskopia': 'text',
  'Badanie kału': 'text',
  'USG': 'text'
  // Dodaj więcej jeśli chcesz
};

export default function TestInputList({
  selectedConditions,
  conditionToTests,
  values,
  onChange
}: Props) {
  const allTests = Array.from(
    new Set(selectedConditions.flatMap((cond) => conditionToTests[cond] || []))
  );

  return (
    <PanelCard title="🧪 Wprowadź wyniki badań" className="bg-[#0d1117] text-white border border-gray-600">
      {allTests.map((test) => {
        const type = testInputTypes[test] || 'text';
        return (
          <div key={test} className="mb-4">
            <label className="block text-sm mb-1 text-white font-medium">{test}</label>

            {type === 'text' && (
              <textarea
                className="w-full rounded-md px-3 py-2 bg-[#0f172a] text-white border border-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={values[test] || ''}
                onChange={(e) => onChange(test, e.target.value)}
                placeholder="np. prawidłowy, ujemny"
              />
            )}

            {type === 'range' && (
              <input
                type="text"
                className="w-full rounded-md px-3 py-2 bg-[#0f172a] text-white border border-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={values[test] || ''}
                onChange={(e) => onChange(test, e.target.value)}
                placeholder="np. 120/80"
              />
            )}

            {type === 'number' && (
              <input
                type="number"
                className="w-full rounded-md px-3 py-2 bg-[#0f172a] text-white border border-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={values[test] || ''}
                onChange={(e) => onChange(test, e.target.value)}
                placeholder="np. 85"
              />
            )}
          </div>
        );
      })}
    </PanelCard>
  );
}
