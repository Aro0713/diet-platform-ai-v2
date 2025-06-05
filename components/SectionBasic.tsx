import React from 'react';
import { section1 } from '@/utils/translations/interview/section1';
import { LangKey } from '@/utils/i18n';

interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function SectionBasic({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section1): string => {
    const value = section1[key]?.[lang] ?? section1[key]?.pl ?? key;
    return Array.isArray(value) ? value.join(' / ') : value;
  };

  const keys = Object.keys(section1).filter(
    (k): k is keyof typeof section1 => k.startsWith('q1_')
  );

  return (
    <div className="space-y-4 bg-[#f7f7f7] p-4 rounded shadow mt-4">
      <h3 className="text-xl font-semibold border-b pb-2">
        1. {t('section1_title' as keyof typeof section1)}
      </h3>

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
