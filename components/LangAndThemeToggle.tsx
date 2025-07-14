"use client";

import { useEffect, useState } from 'react';
import { LangKey, languageLabels } from '@/utils/i18n';
import { useRouter } from 'next/router';
import { SunIcon, MoonIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { tUI } from '@/utils/i18n';

export default function LangAndThemeToggle() {
  const router = useRouter();

  const [lang, setLang] = useState<LangKey>('pl');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang') as LangKey;
    if (storedLang) setLang(storedLang);

    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value as LangKey;
    setLang(selectedLang);
    localStorage.setItem('platformLang', selectedLang);
    router.reload();
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // lub '/login' jeśli masz stronę logowania
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {/* LANGUAGE SELECTOR */}
      <select
        className="px-2 py-1 rounded-md border border-gray-300 text-black bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        value={lang}
        onChange={handleLangChange}
      >
        {Object.entries(languageLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* THEME TOGGLE */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="w-12 h-6 flex items-center bg-gray-300 dark:bg-gray-700 rounded-full p-1 transition-colors duration-300"
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
            isDark ? 'translate-x-6' : 'translate-x-0'
          }`}
        >
          {isDark ? (
            <MoonIcon className="w-3 h-3 text-gray-800 mx-auto mt-0.5" />
          ) : (
            <SunIcon className="w-3 h-3 text-yellow-500 mx-auto mt-0.5" />
          )}
        </div>
      </button>

      {/* 🔴 WYLOGUJ SIĘ */}
      <button
      onClick={handleLogout}
      className="text-sm text-red-300 hover:text-red-500 transition"
    >
      {tUI('logout', lang)}
    </button>
    </div>
  );
}
