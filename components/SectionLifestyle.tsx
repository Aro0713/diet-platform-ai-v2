import React from 'react';
import { LangKey } from '@/utils/i18n';
import { section3 } from '@/utils/translations/interview/section3';

interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function SectionLifestyle({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section3): string => {
    const val = section3[key]?.[lang] ?? section3[key]?.pl ?? key;
    return Array.isArray(val) ? val.join(' / ') : val;
  };

  const keys = Object.keys(section3).filter(
    (k): k is keyof typeof section3 =>
      typeof k === 'string' && k.startsWith('q3_') && !k.endsWith('_options')
  );

  return (
    <div className="space-y-4 bg-[#f7f7f7] p-4 rounded shadow mt-4">
      <h3 className="text-xl font-semibold border-b pb-2">
        3. {t('section3_title' as keyof typeof section3)}
      </h3>

      <div className="grid grid-cols-1 gap-4">
        {keys.map((key) => (
          <div key={key.toString()}>
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

