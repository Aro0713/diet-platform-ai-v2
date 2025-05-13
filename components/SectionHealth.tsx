import React from 'react';
import { LangKey } from '../utils/i18n';
import { section2 } from './utils/translations/interview/section2';

interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function SectionHealth({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section2): string =>
    section2[key]?.[lang] ?? section2[key]?.pl ?? key;

  return (
    <div className="space-y-4 bg-[#f7f7f7] p-4 rounded shadow mt-4">
      <h3 className="text-xl font-semibold border-b pb-2">{`2. ${t('section2_title')}`}</h3>

      <div className="grid grid-cols-1 gap-4">
        {['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9'].map((key) => {
          const fullKey = `q${key.replace('.', '_')}` as keyof typeof section2;

          return (
            <div key={key}>
              <label className="block font-medium text-sm mb-1 text-gray-700">
                {key}. {t(fullKey)}
              </label>
              <textarea
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data[key] || ''}
                onChange={(e) => onChange(key, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
