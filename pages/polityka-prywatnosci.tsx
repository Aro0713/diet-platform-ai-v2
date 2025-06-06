import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { privacyPolicy } from '@/utils/translations/legal/polityka';
import { LangKey } from '@/utils/i18n';

type PrivacyKey = keyof typeof privacyPolicy;

export default function PolitykaPrywatnosciPage() {
  const [lang, setLang] = useState<LangKey>('pl');
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('platformLang') as LangKey;
      setLang(stored || 'pl');
      setLangReady(true);
    }
  }, []);

  const t = (key: PrivacyKey): string | string[] =>
    privacyPolicy[key]?.[lang] ?? privacyPolicy[key]?.['pl'];

  if (!langReady) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-8">
        <Image src="/logo-als.png" alt="ALS logo" width={120} height={60} />
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">{t('title') as string}</h1>
      <p className="mb-4 text-center text-sm text-gray-600">{t('intro') as string}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section1Title') as string}</h2>
      <p className="mb-4">{t('section1Content') as string}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section2Title') as string}</h2>
      <p className="mb-4">{t('section2Content') as string}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section3Title') as string}</h2>
      <p className="mb-4">{t('section3Content') as string}</p>
      <ul className="list-disc list-inside mb-4">
        {(t('section3List') as string[]).map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section4Title') as string}</h2>
      <p className="mb-4">{t('section4Content') as string}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section5Title') as string}</h2>
      <p className="mb-4">{t('section5Content') as string}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section6Title') as string}</h2>
      <p className="mb-4">{t('section6Content') as string}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section7Title') as string}</h2>
      <ul className="list-disc list-inside mb-4">
        {(t('section7List') as string[]).map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section8Title') as string}</h2>
      <p className="mb-4">{t('section8Content') as string}</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">{t('section9Title') as string}</h2>
      <p className="mb-4">{t('section9Content') as string}</p>
    </div>
  );
}
