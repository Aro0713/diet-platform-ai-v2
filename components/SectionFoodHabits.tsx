import React from 'react';
import { LangKey } from '../utils/i18n';
import { section4 } from './utils/translations/interview/section4';

interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function SectionFoodHabits({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section4): string =>
    section4[key]?.[lang] ?? section4[key]?.pl ?? key;

  const keys: (keyof typeof section4)[] = [
    'q4_1',
    'q4_2',
    'q4_3',
    'q4_4',
    'q4_5',
    'q4_6',
    'q4_7',
    'q4_8',
    'q4_9'
  ];

  return (
    <div className="space-y-4 bg-[#f7f7f7] p-4 rounded shadow mt-4">
      <h3 className="text-xl font-semibold border-b pb-2">4. {t('section4_title')}</h3>

      <div className="grid grid-cols-1 gap-4">
        {keys.map((key) => (
          <div key={key}>
            <label className="block font-medium text-sm mb-1 text-gray-700">
              {t(key)}
            </label>
            <textarea
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data[key] || ''}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
