import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { tUI, LangKey, languageLabels } from '@/utils/i18n';

export default function Home() {
  const [lang, setLang] = useState<LangKey>('pl');
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

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
      const supportedLangs: LangKey[] = ['pl', 'en', 'ua', 'es', 'fr', 'de', 'ru', 'zh', 'hi', 'ar', 'he'];
      const browserLang = navigator.language.slice(0, 2) as LangKey;
      const detected = supportedLangs.includes(browserLang) ? browserLang : 'en';
      setLang(detected);
      localStorage.setItem('platformLang', detected);
    }
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] flex flex-col justify-start items-center pt-10 px-6 text-white transition-all duration-300">
      <Head>
        <title>Diet Care Platform</title>
      </Head>

      {/* Pasek języka i trybu ciemnego */}
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
      </nav>

      {/* Główna zawartość */}
      <div className="z-10 flex flex-col items-center justify-start text-center px-4 mt-6 w-full max-w-5xl bg-white/30 backdrop-blur-md rounded-2xl shadow-xl p-10 dark:bg-gray-900/30 dark:text-white transition-colors">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <Image
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
          className="mt-6 text-2xl md:text-[1.7rem] font-serif text-[#f1f1f1] dark:text-[#e4e4e4] max-w-4xl leading-relaxed whitespace-pre-line drop-shadow"
        >
          {tUI('slogan', lang)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          className="mt-10 flex flex-col md:flex-row gap-4"
        >
          <button
            onClick={() => {
              localStorage.setItem('entryMode', 'doctor');
              window.location.href = '/register?mode=doctor';
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-blue-700 transition text-center"
          >
            {tUI('enterAsDoctor', lang)}
          </button>

          <button
            onClick={() => {
              localStorage.setItem('entryMode', 'patient');
              window.location.href = '/register?mode=patient';
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-green-700 transition text-center"
          >
            {tUI('enterAsPatient', lang)}
          </button>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 1 }}
        className="absolute bottom-[160px] right-[40px] text-[2.6rem] font-handwriting text-[#f8f9fa] tracking-wide drop-shadow-xl"
        style={{ transform: 'rotate(-28deg)' }}
      >
        {tUI('signature', lang)}
      </motion.p>
    </main>
  );
}
