import { useEffect, useState } from 'react';
import Image from 'next/image';
import { tUI, LangKey } from '@/utils/i18n';
import { useRouter } from 'next/router';

export default function LandingLookIntro() {
  const [visible, setVisible] = useState(false);
  const { locale } = useRouter();
  const lang = (locale || 'pl') as LangKey;
  const message = tUI('lookIntroMessage', lang);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed bottom-12 left-12 z-50 flex items-end gap-4 transition-all duration-700 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
      }`}
    >
      {/* Look avatar */}
      <div className="w-24 h-24 rounded-full bg-white shadow-md border-4 border-green-600 overflow-hidden">
        <Image src="/Look.png" alt="Look" width={96} height={96} />
      </div>

      {/* Dymek */}
      <div className="max-w-sm bg-white shadow-xl rounded-xl px-4 py-3 text-sm text-gray-900 relative">
        <div className="absolute -left-3 top-5 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-white" />
        <p className="whitespace-pre-line">{message}</p>
      </div>
    </div>
  );
}