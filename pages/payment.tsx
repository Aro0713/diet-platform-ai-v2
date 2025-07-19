import React, { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { type LangKey, languageLabels, tUI as getTUI } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';

export default function PaymentPage() {
  const router = useRouter();
  const [lang, setLang] = useState<LangKey>('pl');
  const tUI = (key: keyof typeof translationsUI) => getTUI(key, lang);

  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    nip: ''
  });

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang') as LangKey;
    const storedTheme = localStorage.getItem('theme');
    if (storedLang) setLang(storedLang);
    if (storedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerName: form.name,
        buyerAddress: form.address,
        buyerNIP: form.nip,
        email: form.email,
        lang,
        service: 'Plan diety 7 dni',
        price: 12900
      })
    });

    const { url } = await res.json();
    if (url) window.location.href = url;
    else alert('Błąd inicjacji płatności');

    setIsLoading(false);
  };

  return (
    <main className="relative min-h-screen bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] flex flex-col justify-start items-center pt-10 px-6 text-white transition-all duration-300">
      <nav className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="sr-only">Język</label>
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

        <div className="flex items-center gap-2 group" title={darkMode ? tUI('lightMode') : tUI('darkMode')}>
          <span className="text-xs text-black dark:text-white">{tUI('toggleContrast')}</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${darkMode ? 'bg-gray-700' : 'bg-yellow-400'}`}
            aria-label={tUI('toggleContrast')}
          >
            <span className={`absolute left-1 text-sm ${darkMode ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
            <span className={`absolute right-1 text-sm ${darkMode ? 'opacity-100' : 'opacity-0'}`}>🌙</span>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </nav>

      <section className="z-10 mt-20 max-w-xl w-full bg-white/30 dark:bg-gray-900/30 backdrop-blur-md p-10 rounded-2xl shadow-xl transition-colors dark:text-white">
        <h2 className="text-2xl font-bold text-center mb-6">{tUI('paymentTitle')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder={tUI('fullName')}
            className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            required
            placeholder={tUI('email')}
            className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="text"
            required
            placeholder={tUI('address')}
            className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <input
            type="text"
            placeholder={tUI('nip')}
            className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
            value={form.nip}
            onChange={(e) => setForm({ ...form, nip: e.target.value })}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded w-full transition disabled:opacity-50"
          >
            {isLoading ? tUI('loading') : tUI('payNow')}
          </button>
        </form>
      </section>
    </main>
  );
}
