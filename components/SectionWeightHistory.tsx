import React from 'react';
import { LangKey } from '../utils/i18n';
import { section6 } from './utils/translations/interview/section6';

interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function SectionWeightHistory({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section6): string =>
    section6[key]?.[lang] ?? section6[key]?.pl ?? key;

  const keys: (keyof typeof section6)[] = [
    'q6_1',
    'q6_2',
    'q6_3',
    'q6_4',
    'q6_5'
  ];

  return (
    <div className="space-y-4 bg-[#f7f7f7] p-4 rounded shadow mt-4">
      <h3 className="text-xl font-semibold border-b pb-2">6. {t('section6_title')}</h3>

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
