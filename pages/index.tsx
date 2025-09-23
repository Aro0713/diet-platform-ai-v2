// pages/index.tsx
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { translationsUI } from '@/utils/translationsUI';
import { type LangKey, languageLabels } from '@/utils/i18n';

export default function Home() {
  const [lang, setLang] = useState<LangKey>('pl');
  const [langReady, setLangReady] = useState(false);

  // dark mode (jak w register.tsx)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') === 'dark';
    return false;
  });
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // tUI lokalne (jak w register.tsx)
  const tUI = (key: keyof typeof translationsUI): string => {
    const entry = translationsUI[key];
    if (!entry) {
      console.warn(`🔍 Brak tłumaczenia UI dla klucza: "${key}"`);
      return `[${String(key)}]`;
    }
    return entry[lang] || entry.pl || `[${String(key)}]`;
  };

  // detekcja języka (IP) + localStorage
  useEffect(() => {
    const initLang = async () => {
      try {
        const stored = localStorage.getItem('platformLang');
        if (stored && Object.keys(languageLabels).includes(stored)) {
          setLang(stored as LangKey);
          setLangReady(true);
          return;
        }
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const detected = data?.languages?.split(',')[0]?.toLowerCase();
        if (detected && Object.keys(languageLabels).includes(detected)) {
          setLang(detected as LangKey);
          localStorage.setItem('platformLang', detected);
        } else {
          setLang('en');
          localStorage.setItem('platformLang', 'en');
        }
      } catch {
        setLang('pl');
        localStorage.setItem('platformLang', 'pl');
      } finally {
        setLangReady(true);
      }
    };
    initLang();
  }, []);

  // Magic link → /reset
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('access_token') && !window.location.pathname.includes('/reset')) {
        window.location.href = '/reset' + hash;
      }
    }
  }, []);

  if (!langReady) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">⏳ Ładowanie języka...</p>
      </main>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PRICING DATA — Pacjenci: 7/30/90   ·  PRO: 90/365
  // ────────────────────────────────────────────────────────────────────────────
  const patientPlans = [
    {
      title: tUI('pricing.plan7.title'),
      price: '129 PLN',
      popular: false,
      bullets: [
        tUI('pricing.plan7.b1'),
        tUI('pricing.plan7.b2'),
        tUI('pricing.plan7.b3'),
        tUI('pricing.plan7.b4'),
      ],
    },
    {
      title: tUI('pricing.plan30.title'),
      price: '249 PLN',
      popular: true,
      bullets: [
        tUI('pricing.plan30.b1'),
        tUI('pricing.plan30.b2'),
        tUI('pricing.plan30.b3'),
        tUI('pricing.plan30.b4'),
      ],
    },
    {
      title: tUI('pricing.plan90.title'),
      price: '599 PLN',
      popular: false,
      bullets: [
        tUI('pricing.plan90.b1'),
        tUI('pricing.plan90.b2'),
        tUI('pricing.plan90.b3'),
        tUI('pricing.plan90.b4'),
      ],
    },
  ];

  const proPlans = [
    {
      title: tUI('pricing.pro90.title'), // NOWY klucz
      price: '390 PLN',
      bullets: [
        tUI('pricing.pro90.b1'),
        tUI('pricing.pro90.b2'),
        tUI('pricing.pro90.b3'),
        tUI('pricing.pro90.b4'),
      ],
    },
    {
      title: tUI('pricing.pro365.title'),
      price: '3800 PLN',
      bullets: [
        tUI('pricing.pro365.b1'),
        tUI('pricing.pro365.b2'),
        tUI('pricing.pro365.b3'),
        tUI('pricing.pro365.b4'),
      ],
    },
  ];

  const steps = [
    {
      title: tUI('steps.registration.title'),
      desc: tUI('steps.registration.desc'),
      icon: '/icons/registration.svg',
      alt: tUI('steps.registration.alt'),
    },
    {
      title: tUI('steps.medical.title'),
      desc: tUI('steps.medical.desc'),
      icon: '/icons/medical.svg',
      alt: tUI('steps.medical.alt'),
    },
    {
      title: tUI('steps.interview.title'),
      desc: tUI('steps.interview.desc'),
      icon: '/icons/interview.svg',
      alt: tUI('steps.interview.alt'),
    },
    {
      title: tUI('steps.calculator.title'),
      desc: tUI('steps.calculator.desc'),
      icon: '/icons/calculator.svg',
      alt: tUI('steps.calculator.alt'),
    },
    {
      title: tUI('steps.plan.title'),
      desc: tUI('steps.plan.desc'),
      icon: '/icons/plan.svg',
      alt: tUI('steps.plan.alt'),
    },
    {
      title: tUI('steps.recipes.title'),
      desc: tUI('steps.recipes.desc'),
      icon: '/icons/recipes.svg',
      alt: tUI('steps.recipes.alt'),
    },
    ];
    
  return (
    <main
      className="relative min-h-screen
      bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60
      dark:from-[#0e231b]/80 dark:to-[#0c1f18]/60
      text-gray-900 dark:text-white transition-all duration-300"
    >
      <Head>
        <title>{tUI('app.title')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={tUI('app.metaDescription')} />
      </Head>

      {/* NAV */}
      <nav className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-2 md:px-4">
        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="sr-only">
            {tUI('nav.languageLabel')}
          </label>
          <select
            id="language-select"
            value={lang}
            onChange={(e) => {
              const selected = e.target.value as LangKey;
              setLang(selected);
              localStorage.setItem('platformLang', selected);
            }}
            className="border rounded px-3 py-1 shadow bg-white/80 text-black backdrop-blur dark:bg-gray-800 dark:text-white"
            aria-label={tUI('nav.languageAria')}
          >
            {Object.entries(languageLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 group" title={darkMode ? tUI('nav.lightMode') : tUI('nav.darkMode')}>
          <span className="text-xs text-black/80 dark:text-white/80 hidden sm:block">
            {darkMode ? tUI('nav.lightMode') : tUI('nav.darkMode')}
          </span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${darkMode ? 'bg-gray-700' : 'bg-yellow-400'}`}
            aria-label={tUI('nav.toggleContrast')}
            title={tUI('nav.toggleContrast')}
          >
            <span className={`absolute left-1 text-sm ${darkMode ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
            <span className={`absolute right-1 text-sm ${darkMode ? 'opacity-100' : 'opacity-0'}`}>🌙</span>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative w-full">
        <div className="relative h-[520px] md:h-[640px] lg:h-[720px]">
          <Image
            src="/landing-hero.jpg"
            alt={tUI('landing.heroAlt')}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0f271e]/65" />
          <div className="absolute inset-0 flex flex-col items-end justify-center pr-6 md:pr-12 text-right">
            <Image
              src="/logo-dietcare.png"
              alt={tUI('landing.logoAlt')}
              width={220}
              height={70}
              className="mb-4 drop-shadow-xl"
              priority
            />
            <h1 className="text-3xl md:text-5xl font-bold drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)]">
              {tUI('landing.slogan')}
            </h1>
            <p className="mt-4 max-w-xl md:max-w-2xl text-base md:text-lg leading-relaxed opacity-95">
              {tUI('landing.subheadline')}
            </p>

            {/* Primary CTA w HERO */}
            <div className="mt-6">
              <button
                onClick={() => {
                  localStorage.setItem('entryMode', 'patient');
                  window.location.href = '/register?mode=patient';
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-lg shadow"
              >
                {tUI('cta.title')} {/* „Zacznij teraz” */}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="mx-auto max-w-6xl px-5 -mt-10 md:-mt-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
          {steps.map((s) => (
            <div
              key={s.title + s.icon}
              className="rounded-2xl bg-white/15 dark:bg-black/20 backdrop-blur p-4 md:p-5 shadow-lg border border-white/10 text-center"
            >
              <div className="mx-auto h-10 w-10 md:h-12 md:w-12 mb-2 relative">
                <Image src={s.icon} alt={s.alt} fill className="object-contain" />
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm opacity-90 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 mt-12 md:mt-16">
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-6">
          {tUI('pricing.title')}
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pacjenci */}
          <div>
            <h3 className="text-lg font-semibold mb-3 opacity-90">
              {tUI('pricing.patientsHeader')}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {patientPlans.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl bg-white/15 dark:bg-black/20 backdrop-blur p-5 border border-white/10 shadow-lg"
                >
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-semibold">{p.title}</h4>
                    <span className="text-emerald-300 font-semibold">{p.price}</span>
                  </div>
                  {p.popular && (
                    <div className="mt-1 text-xs inline-block px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40">
                      {tUI('pricing.popularTag')}
                    </div>
                  )}
                  <ul className="mt-3 space-y-2 text-sm opacity-95">
                    {p.bullets.map((b, i) => <li key={i}>• {b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* PRO */}
          <div>
            <h3 className="text-lg font-semibold mb-3 opacity-90">
              {tUI('pricing.proHeader')}
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {proPlans.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl bg-white/15 dark:bg-black/20 backdrop-blur p-5 border border-white/10 shadow-lg"
                >
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-semibold">{p.title}</h4>
                    <span className="text-emerald-300 font-semibold">{p.price}</span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm opacity-95">
                    {p.bullets.map((b, i) => <li key={i}>• {b}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA końcowe */}
      <section className="mx-auto max-w-6xl px-5 mt-10 mb-16">
        <p className="text-center text-xl md:text-2xl font-semibold mb-4">
          {tUI('cta.title')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              localStorage.setItem('entryMode', 'patient');
              window.location.href = '/register?mode=patient';
            }}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-lg shadow"
            aria-label={tUI('cta.patientAria')}
            title={tUI('cta.patientAria')}
          >
            {tUI('cta.enterAsPatient')}
          </button>

          <button
            onClick={() => {
              localStorage.setItem('entryMode', 'doctor');
              window.location.href = '/register?mode=doctor';
            }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg shadow"
            aria-label={tUI('cta.doctorAria')}
            title={tUI('cta.doctorAria')}
          >
            {tUI('cta.enterAsDoctor')}
          </button>
        </div>
      </section>
    </main>
  );
}
