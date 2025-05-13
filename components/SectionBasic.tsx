import React from 'react';
import { LangKey, translations } from '../utils/translations';

interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function Section1BasicGoal({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof translations.section1) =>
    translations.section1[key]?.[lang] ??
    translations.section1[key]?.["pl"] ??
    key;

  return (
    <div className="space-y-4 bg-[#f7f7f7] p-4 rounded shadow mt-4">
      <h3 className="text-xl font-semibold border-b pb-2">1. {t('section1_title')}</h3>

      <div className="grid grid-cols-1 gap-4">
        {['1.1', '1.2', '1.3', '1.4'].map((key) => (
          <div key={key}>
            <label className="block font-medium text-sm mb-1 text-gray-700">
              {key} {t(`q${key.replace('.', '_')}` as any)}
            </label>
            <textarea
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data[key]}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
