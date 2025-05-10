import React from 'react';
import { LangKey } from '../utils/i18n';
import { section2 } from './utils/translations/interview/section2';


interface Props {
  data: { [key: string]: string };
  onChange: (key: string, value: string) => void;
  lang: LangKey;
}

export default function Section2Health({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section2): string =>
    section2[key]?.[lang] ?? section2[key]?.pl ?? key;

  return (
    <div className='space-y-2'>
      <h3 className='text-lg font-semibold'>2. {t('section2_title')}</h3>

      {['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9'].map((key) => {
        const fullKey = `q${key.replace('.', '_')}` as keyof typeof section2;

        return (
          <div key={key}>
            <label className='block font-medium'>
              {key} {t(fullKey)}
            </label>
            <textarea
              className='w-full border px-2 py-1'
              value={data[key] || ''}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
