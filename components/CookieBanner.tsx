import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { tUI, type LangKey } from '@/utils/i18n';

export default function CookieBanner() {
  const router = useRouter();
  const lang = (router.locale || 'pl') as LangKey;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-black text-white text-sm px-6 py-4 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
      <div className="text-center md:text-left max-w-[640px]">
        {tUI('cookieConsentText', lang)}{' '}
        <Link
          href="/polityka-prywatnosci"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-300"
        >
          {tUI('privacyPolicy', lang)}
        </Link>.
      </div>
      <button
        onClick={handleAccept}
        className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition"
      >
        {tUI('cookieAcceptButton', lang)}
      </button>
    </div>
  );
}
