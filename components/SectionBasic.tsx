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
    <div className='space-y-2'>
      <h3 className='text-lg font-semibold'>1. {t('section1_title')}</h3>

      <div>
        <label className='block font-medium'>1.1 {t('q1_1')}</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data['1.1']}
          onChange={(e) => onChange('1.1', e.target.value)}
        />
      </div>

      <div>
        <label className='block font-medium'>1.2 {t('q1_2')}</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data['1.2']}
          onChange={(e) => onChange('1.2', e.target.value)}
        />
      </div>

      <div>
        <label className='block font-medium'>1.3 {t('q1_3')}</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data['1.3']}
          onChange={(e) => onChange('1.3', e.target.value)}
        />
      </div>

      <div>
        <label className='block font-medium'>1.4 {t('q1_4')}</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data['1.4']}
          onChange={(e) => onChange('1.4', e.target.value)}
        />
      </div>
    </div>
  );
}
