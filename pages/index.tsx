// pages/index.tsx
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { tUI, LangKey, languageLabels } from '@/utils/i18n';
import LandingLookIntro from '@/components/LandingLookIntro';
import IntroOverlay from '@/components/IntroOverlay';

export default function Home() {
  const [lang, setLang] = useState<LangKey>('pl');
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

// 👇 intro overlay (domyślnie raz, ale można odtworzyć)
const [showIntro, setShowIntro] = useState(false);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const forceIntro = params.get('intro') === '1';

  const seen = localStorage.getItem('introSeen_v1');
  // jeśli ?intro=1 → pokaż niezależnie od 'seen'
  setShowIntro(forceIntro || !seen);
}, []);

const finishIntro = () => {
  localStorage.setItem('introSeen_v1', '1');
  setShowIntro(false);
};

// ręczne odtworzenie intro
const replayIntro = () => {
  setShowIntro(true); // nie kasujemy 'seen', to tylko „podgląd”
};


  // Ustawienie darkMode i mounted po stronie klienta
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setDarkMode(theme === 'dark');
    setMounted(true);
  }, []);

  // Synchronizacja z klasą HTML i localStorage
  useEffect(() => {
    if (!mounted) return;
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode, mounted]);

  // Wykrywanie języka
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existing = localStorage.getItem('platformLang');
      if (existing && Object.keys(languageLabels).includes(existing)) {
        setLang(existing as LangKey);
      } else {
        const supportedLangs: LangKey[] = ['pl', 'en', 'ua', 'es', 'fr', 'de', 'ru', 'zh', 'hi', 'ar', 'he'];
        const browserLang = navigator.language.slice(0, 2) as LangKey;
        const detected = supportedLangs.includes(browserLang) ? browserLang : 'en';
        setLang(detected);
        localStorage.setItem('platformLang', detected);
      }
    }
  }, []);

  // Przechwycenie access_token i przekierowanie do resetu hasła
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('access_token') && !window.location.pathname.includes('/reset')) {
        window.location.href = '/reset' + hash;
      }
    }
  }, []);

  if (!mounted) return null;

return (
  <main
  className="relative min-h-screen
  bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60
  dark:from-[#0e231b]/80 dark:to-[#0c1f18]/60
  backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)]
  flex flex-col justify-start items-center pt-10 px-6
  text-gray-900 dark:text-white transition-all duration-300"
>
   <Head>
  <title>Diet Care Platform</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  </Head>

    {/* Pasek języka + odtwórz intro + tryb ciemny */}
    <nav className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <label htmlFor="language-select" className="sr-only">Wybierz język</label>
        <select
          id="language-select"
          value={lang}
          onChange={(e) => {
            const selected = e.target.value as LangKey;
            setLang(selected);
            localStorage.setItem('platformLang', selected);
          }}
          className="border rounded px-3 py-1 shadow bg-white/80 text-black backdrop-blur dark:bg-gray-800 dark:text-white"
          aria-label="Language selection"
        >
          {Object.entries(languageLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        {/* ▶️ Odtwórz intro (ręcznie) */}
        <button
          onClick={replayIntro}
          className="text-xs md:text-sm px-3 py-1 rounded-lg bg-white/80 text-black backdrop-blur hover:bg-white"
          aria-label={tUI('replayIntro', lang)}
          title={tUI('replayIntro', lang)}
        >
          {tUI('replayIntro', lang)}
        </button>

        {/* Przełącznik kontrastu */}
        <div className="flex items-center gap-2 group" title={darkMode ? tUI('lightMode', lang) : tUI('darkMode', lang)}>
          <span className="text-xs text-black dark:text-white">{tUI('toggleContrast', lang)}</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${darkMode ? 'bg-gray-700' : 'bg-yellow-400'}`}
            aria-label={tUI('toggleContrast', lang)}
          >
            <span className={`absolute left-1 text-sm transition-opacity duration-200 ${darkMode ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
            <span className={`absolute right-1 text-sm transition-opacity duration-200 ${darkMode ? 'opacity-100' : 'opacity-0'}`}>🌙</span>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </nav>

    {/* Główna zawartość */}
    <div
        className="z-10 flex flex-col items-center justify-start text-center px-4 mt-6
        w-full max-w-xl md:max-w-5xl
        bg-white/30 dark:bg-gray-900/30 backdrop-blur-md
        p-6 md:p-10 rounded-2xl shadow-xl transition-colors"
      >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <Image
        id="site-logo"
        src="/logo-dietcare.png"
        alt="Logo Diet Care Platform"
        width={260}
        height={80}
        className="mx-auto"
        priority
      />

      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 1 }}
        className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mt-4 capitalize drop-shadow-xl"
      >
        {tUI('welcome', lang)}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="mt-6 text-2xl md:text-[1.7rem] font-serif
        text-gray-800 dark:text-gray-200
        max-w-4xl leading-relaxed whitespace-pre-line drop-shadow"
      >
        {tUI('slogan', lang)}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        className="mt-10 flex flex-col md:flex-row gap-4 w-full md:w-auto"
      >
        <button
          onClick={() => {
            localStorage.setItem('entryMode', 'doctor');
            window.location.href = '/register?mode=doctor';
          }}
          className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-blue-700 transition text-center"
        >
          {tUI('enterAsDoctor', lang)}
        </button>

        <button
          onClick={() => {
            localStorage.setItem('entryMode', 'patient');
            window.location.href = '/register?mode=patient';
          }}
          className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-green-700 transition text-center"
        >
          {tUI('enterAsPatient', lang)}
        </button>
      </motion.div>
    </div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 3.5, duration: 1 }}
      className="hidden sm:block pointer-events-none select-none absolute bottom-16 right-4 md:bottom-24 md:right-6 text-3xl md:text-[2.6rem] font-handwriting text-[#f8f9fa] tracking-wide drop-shadow-xl"
      style={{ transform: 'rotate(-28deg)' }}
    >
      {tUI('signature', lang)}
    </motion.p>

    {/* 👇 LOOK pojawia się po podpisie Edyty */}
    <LandingLookIntro />

    {/* 👇 Intro overlay: auto raz, ale można odtworzyć z przycisku lub ?intro=1 */}
    {showIntro && (
      <IntroOverlay
        lang={lang}
        onFinish={finishIntro}
        // wideo leży w /public/screens/intro.mp4
        videoSrcs={{ mp4: '/screens/intro.mp4' }} 
        slides={[
          { image: '/screens/01-login.png',       titleKey: 'loginBenefit1', descKey: 'lookSlide1' },
          { image: '/screens/02-panel.png',       titleKey: 'loginBenefit2', descKey: 'lookSlide2' },
          { image: '/screens/03-diet-config.png', titleKey: 'loginBenefit2', descKey: 'lookSlide2' },
          { image: '/screens/04-diet-table.png',  titleKey: 'loginBenefit3', descKey: 'lookSlide3' },
          { image: '/screens/05-ask-look.png',    titleKey: 'lookCTAStart',  descKey: 'lookSlide3' },
        ]}
      />
    )}
  </main>
);
}
