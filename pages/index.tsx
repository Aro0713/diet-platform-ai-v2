import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { tUI, LangKey } from '@/utils/i18n';

export default function Home() {
  const [lang, setLang] = useState<LangKey>('pl');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supportedLangs: LangKey[] = ['pl', 'en', 'ua', 'es', 'fr', 'de', 'ru', 'zh', 'hi', 'ar', 'he'];
      const browserLang = navigator.language.slice(0, 2) as LangKey;
      const detected = supportedLangs.includes(browserLang) ? browserLang : 'en';
      setLang(detected);
      localStorage.setItem('platformLang', detected);
    }
  }, []);

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-start items-center pt-10"
      style={{ backgroundImage: 'url(/background.jpg)' }}
    >
      <Head>
        <title>Diet Care Platform</title>
      </Head>

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-[-1]" />

      {/* Language Selector */}
      <div className="absolute top-4 left-6 z-50">
        <select
          className="text-lg font-semibold bg-white/80 border border-gray-300 rounded px-4 py-2 shadow-md"
          value={lang}
          onChange={(e) => {
            const selected = e.target.value as LangKey;
            setLang(selected);
            localStorage.setItem('platformLang', selected);
          }}
        >
          <option value="pl">Polski</option>
          <option value="en">English</option>
          <option value="ua">Українська</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ru">Русский</option>
          <option value="zh">中文</option>
          <option value="hi">हिन्दी</option>
          <option value="ar">العربية</option>
          <option value="he">עברית</option>
        </select>
      </div>

      {/* Content */}
      <div className="z-10 flex flex-col items-center justify-start text-center px-4 mt-6 w-full max-w-5xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <Image
            src="/logo-dietcare.png"
            alt="Logo Diet Care Platform"
            width={280}
            height={90}
            className="mx-auto"
            priority
          />
        </motion.div>

        {/* Welcome */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 1 }}
          className="text-5xl md:text-6xl font-bold text-gray-900 mt-4 capitalize"
        >
          {tUI('welcome', lang)}
        </motion.h1>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-6 text-2xl md:text-[1.7rem] font-serif text-gray-800 max-w-4xl leading-relaxed whitespace-pre-line"
        >
          {tUI('slogan', lang)}
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          className="mt-10 flex flex-col md:flex-row gap-4"
        >
          <Link
            href="/panel"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-blue-700 transition text-center"
          >
            {tUI('enterAsDoctor', lang)}
          </Link>
          <Link
            href="/pacjent"
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-green-700 transition text-center"
          >
            {tUI('enterAsPatient', lang)}
          </Link>
        </motion.div>
      </div>

      {/* Signature */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 1 }}
        className="absolute bottom-[220px] right-[40px] text-[2.8rem] font-handwriting text-[#0d1b2a] tracking-wide"
        style={{ transform: 'rotate(-30deg)' }}
      >
        {tUI('signature', lang)}
      </motion.p>
    </div>
  );
}
