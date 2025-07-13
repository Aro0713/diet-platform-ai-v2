import { useEffect, useState } from 'react';
import Image from 'next/image';
import { tUI, LangKey } from '@/utils/i18n';
import { motion } from 'framer-motion';

export default function LandingLookIntro() {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<LangKey>('pl');
  const [randomTop, setRandomTop] = useState('50%');
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    const storedLang = localStorage.getItem('platformLang') as LangKey;
    if (storedLang) setLang(storedLang);

    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const min = 80;
    const max = Math.floor(viewportHeight * 0.75);
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    setRandomTop(`${random}px`);

    return () => clearTimeout(timer);
  }, []);

  const message = tUI('lookIntroMessage', lang);
  const clickMessage = tUI('lookClickMessage', lang);

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={visible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed left-6 z-50 flex items-center gap-4 cursor-pointer"
      style={{ top: randomTop }}
      onClick={() => setClicked(true)}
    >
      {/* Look avatar */}
      <div className="w-24 h-24 rounded-full bg-white shadow-md border-4 border-green-600 overflow-hidden">
        <Image src="/Look.png" alt="Look" width={96} height={96} />
      </div>

      {/* Komiksowy dymek */}
      <div className="relative max-w-md text-sm px-5 py-4 rounded-2xl shadow-xl comic-bubble bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
        <div className="absolute -left-4 top-6 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-white dark:border-r-gray-800" />
        <p className="whitespace-pre-line leading-relaxed font-medium">
          {clicked ? clickMessage : message}
        </p>
      </div>

      <style jsx>{`
        .comic-bubble {
          border: 2px solid #222;
          font-family: 'Comic Sans MS', 'Comic Neue', sans-serif;
        }
      `}</style>
    </motion.div>
  );
}

