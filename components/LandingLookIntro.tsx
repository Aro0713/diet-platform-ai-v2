import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { tUI, LangKey } from '@/utils/i18n';
import { motion } from 'framer-motion';

export default function LandingLookIntro() {
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<LangKey>('pl');
  const [clicked, setClicked] = useState(false);
  const [randomTop, setRandomTop] = useState('50%');

  // 🔍 wykryj mobile (bez SSR błędów)
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    const storedLang = (typeof window !== 'undefined'
      ? localStorage.getItem('platformLang')
      : null) as LangKey | null;
    if (storedLang) setLang(storedLang);

    // losowe położenie tylko na desktopie; na mobile trzymamy stały „dock” przy krawędzi
    if (!isMobile && typeof window !== 'undefined') {
      const vh = window.innerHeight;
      const min = 96; // wysokość avatara
      const max = Math.max(min, Math.floor(vh * 0.75));
      const rnd = Math.floor(Math.random() * (max - min + 1)) + min;
      setRandomTop(`${rnd}px`);
    }

    return () => clearTimeout(timer);
  }, [isMobile]);

  // 🔊 audio po kliknięciu (mobile iOS wymaga gesture — mamy go)
  useEffect(() => {
    if (!clicked) return;
    const speak = async () => {
      try {
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: tUI('lookClickMessage', lang), lang }),
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play().catch(() => {/* ignoruj, jeśli user zablokował dźwięk */});
      } catch (err) {
        console.error('🔊 Błąd audio:', err);
      }
    };
    speak();
  }, [clicked, lang]);

  const message = tUI('lookIntroMessage', lang);
  const clickMessage = tUI('lookClickMessage', lang);

  // 📐 style/pozycja zależna od urządzenia
  const containerClass =
    'z-50 flex items-center gap-3 sm:gap-4 cursor-pointer';
  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: 'max(env(safe-area-inset-left), 16px)',
        bottom: 'max(env(safe-area-inset-bottom), 16px)',
      }
    : {
        position: 'fixed',
        left: '24px',
        top: randomTop,
      };

  const avatarSize = isMobile ? 72 : 96; // px
  const bubbleMaxWidth = isMobile ? '78vw' : '24rem';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: isMobile ? 0 : -40, y: isMobile ? 20 : 0 }}
        animate={visible ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={containerClass}
        style={containerStyle}
        onClick={() => setClicked(true)}
        role="button"
        aria-label="Look helper"
      >
        {/* Awatar Look */}
        <motion.div
          animate={clicked ? { rotate: [0, -10, 10, -6, 6, -2, 2, 0] } : {}}
          transition={{ duration: 0.6 }}
          className="rounded-full bg-white shadow-md border-4 border-green-600 overflow-hidden shrink-0"
          style={{ width: avatarSize, height: avatarSize }}
        >
          <Image
            src="/Look.png"
            alt="Look"
            width={avatarSize}
            height={avatarSize}
            priority
            unoptimized
            draggable={false}
            sizes={`${avatarSize}px`}
          />
        </motion.div>

        {/* Dymek z tekstem */}
        <div
          className={`relative text-[13px] sm:text-sm px-4 py-3 rounded-2xl shadow-xl comic-bubble bg-white text-gray-900 dark:bg-gray-800 dark:text-white max-w-[78vw] sm:max-w-md`}
          style={{ maxWidth: bubbleMaxWidth }}
        >
          {!isMobile ? (
            <div className="absolute -left-4 top-6 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-white dark:border-r-gray-800" />
          ) : (
            <div className="absolute left-6 -bottom-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white dark:border-t-gray-800" />
          )}
          <p className="whitespace-pre-line leading-relaxed font-medium break-words">
            {clicked ? clickMessage : message}
          </p>
        </div>
      </motion.div>

      <style jsx>{`
        .comic-bubble {
          border: 2px solid #222;
          font-family: 'Comic Sans MS', 'Comic Neue', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji';
        }
        @media (prefers-reduced-motion: reduce) {
          :global(*) {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
