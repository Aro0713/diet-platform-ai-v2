import React from 'react';
import { LangKey, tUI } from '@/utils/i18n'; // 🔧 używamy aliasu i tłumaczenia interfejsu
import { section7 } from '@/utils/translations/interview/section7';

interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function SectionDigestion({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section7): string => {
    const val = section7[key]?.[lang] ?? section7[key]?.pl ?? key;
    return Array.isArray(val) ? val.join(' / ') : val;
  };

  // ✅ tylko klucze typu 'q7_...', bez section7_title
  const keys = Object.keys(section7).filter(
    (k) => typeof k === 'string' && k.startsWith('q7_')
  );

  return (
    <div className="space-y-4 bg-[#f7f7f7] p-4 rounded shadow mt-4">
      <h3 className="text-xl font-semibold border-b pb-2">7. {tUI('section7_title', lang)}</h3>

      <div className="grid grid-cols-1 gap-4">
        {keys.map((key) => (
          <div key={key.toString()}>
            <label className="block font-medium text-sm mb-1 text-gray-700">
              {t(key as keyof typeof section7)}
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