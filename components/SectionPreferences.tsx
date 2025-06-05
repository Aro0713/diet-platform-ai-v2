import React from 'react';
import { LangKey, tUI } from '../utils/i18n';
import { section5 } from '@/utils/translations/interview/section5';

interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function SectionPreferences({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section5): string => {
    const val = section5[key]?.[lang] ?? section5[key]?.pl;
    return Array.isArray(val) ? (val.join(' / ') as string) : (val as string) ?? key;
  };

  const keys = (Object.keys(section5) as string[])
    .filter((k): k is keyof typeof section5 =>
      k.startsWith('q5_') && !k.endsWith('_options')
    )
    .sort();

  return (
    <div className="space-y-4 bg-[#f7f7f7] p-4 rounded shadow mt-4">
      <h3 className="text-xl font-semibold border-b pb-2">5. {tUI('section5_title', lang)}</h3>

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