import React from 'react';
import Image from 'next/image';
import { regulamin } from '@/utils/translations/legal/regulamin';
import {
  section1reg,
  section2reg,
  section3reg,
  section4reg,
  section5reg,
  section6reg,
  section7reg,
  section8reg,
  section9reg,
} from '../components/utils/translations/legal/sections/indexReg';
import { LangKey } from '@/utils/i18n';


type TermsKey = keyof typeof regulamin;

export default function RegulaminPage() {
  const lang: LangKey = typeof window !== 'undefined'
    ? (localStorage.getItem('platformLang') as LangKey) || 'pl'
    : 'pl';

  const t = (key: TermsKey): string =>
    regulamin[key]?.[lang] ?? regulamin[key]?.['pl'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-8">
        <Image src="/logo-als.png" alt="ALS logo" width={120} height={60} />
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">{t('title')}</h1>

      <p className="mb-4 text-center text-sm text-gray-600">
        Administratorem Platformy jest ALS sp. z o.o. z siedzibą w 47-330 Zdzieszowice (Poland), ul. Filarskiego 39,
        NIP PL6252121456, REGON: 276795439.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">I. {t('section1')}</h2>
      <p className="mb-6 whitespace-pre-line">{section1reg[lang]}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">II. {t('section2')}</h2>
      <p className="mb-6 whitespace-pre-line">{section2reg[lang]}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">III. {t('section3')}</h2>
      <p className="mb-6 whitespace-pre-line">{section3reg[lang]}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">IV. {t('section4')}</h2>
      <p className="mb-6 whitespace-pre-line">{section4reg[lang]}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">V. {t('section5')}</h2>
      <p className="mb-6 whitespace-pre-line">{section5reg[lang]}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">VI. {t('section6')}</h2>
      <p className="mb-6 whitespace-pre-line">{section6reg[lang]}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">VII. {t('section7')}</h2>
      <p className="mb-6 whitespace-pre-line">{section7reg[lang]}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">VIII. {t('section8')}</h2>
      <p className="mb-6 whitespace-pre-line">{section8reg[lang]}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">IX. {t('section9')}</h2>
      <p className="mb-6 whitespace-pre-line">{section9reg[lang]}</p>
    </div>
  );
}
