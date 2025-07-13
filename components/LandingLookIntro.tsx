import { useEffect, useState } from 'react';
import Image from 'next/image';
import { tUI, LangKey } from '@/utils/i18n';

export default function LandingLookIntro() {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<LangKey>('pl');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    const storedLang = localStorage.getItem('platformLang') as LangKey;
    if (storedLang) setLang(storedLang);
    return () => clearTimeout(timer);
  }, []);

  const message = tUI('lookIntroMessage', lang);

  return (
    <div
      className={`fixed top-1/2 left-6 z-50 flex items-center gap-4 transition-all duration-700 transform -translate-y-1/2 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
      }`}
    >
      {/* Look avatar */}
      <div className="w-24 h-24 rounded-full bg-white shadow-md border-4 border-green-600 overflow-hidden">
        <Image src="/Look.png" alt="Look" width={96} height={96} />
      </div>

      {/* Komiksowy dymek */}
      <div className="relative max-w-md text-sm px-5 py-4 rounded-2xl shadow-xl comic-bubble bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
        <div className="absolute -left-4 top-6 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-white" />
        <p className="whitespace-pre-line leading-relaxed font-medium">{message}</p>
      </div>

      <style jsx>{`
        .comic-bubble {
          border: 2px solid #222;
          font-family: 'Comic Sans MS', 'Comic Neue', sans-serif;
        }
      `}</style>
    </div>
  );
}