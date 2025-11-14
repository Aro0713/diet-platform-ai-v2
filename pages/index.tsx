// pages/index.tsx
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { translationsUI } from '@/utils/translationsUI';
import { type LangKey, languageLabels } from '@/utils/i18n';


// KONTAKT / SOCIAL
const FOOTER = {
  email: 'contact@dcp.care', 
  facebook: 'https://www.facebook.com/profile.php?id=61580694946237',
  youtube: 'https://www.youtube.com/@DietCarePlatform',
  adminName: 'ALS sp. z o.o.',
};

// ────────────────────────────────────────────────────────────────────────────
// PRICING — market-aware (PL → PLN, EU → EUR, OTHER → USD)
// ────────────────────────────────────────────────────────────────────────────

// 1) Cennik per rynek (stałe biznesowe – bez FX)
const MARKET_PRICING = {
  PL: {
    currency: 'PLN',
    patient: { plan7: 129, plan30: 249, plan90: 599, plan365: 1299 },
    pro:     { plan30: 390, plan365: 3800 },
  },
  EU: {
    currency: 'EUR',
    patient: { plan7: 39,  plan30: 79,  plan90: 179, plan365: 349 },
    pro:     { plan30: 99,  plan365: 899 },
  },
  OTHER: {
    currency: 'USD',
    patient: { plan7: 39,  plan30: 79,  plan90: 179, plan365: 349 },
    pro:     { plan30: 99,  plan365: 899 },
  },
} as const;

type Market = keyof typeof MARKET_PRICING;

// 2) UE (bez PL – PL ma własny cennik)
const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
  'LV','LT','LU','MT','NL','PT','RO','SK','SI','ES','SE'
]);
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function Home() {
    // ──────────────────────────────────────────────────────────────
  // TV — obsługa przewijania i sterowania YouTube
  // ──────────────────────────────────────────────────────────────
  const tvSectionRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLIFrameElement | null>(null);
  const [ytReady, setYtReady] = useState(false);
  const ytPlayerRef = useRef<any>(null);

 const goToTv = () => {
  // 1) Scroll
  tvSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 2) Odpal audio/wideo wprost z YouTube API (gest użytkownika)
  setAutoPlayVideo(true);

  // iOS: wywołania MUSZĄ być wprost z handlera kliknięcia
  const p = ytPlayerRef.current;
  if (p && ytReady) {
    try {
      p.unMute();
      p.setVolume(100);
      p.playVideo();
      return;
    } catch {}
  }

  // Fallback: stary mechanizm postMessage (gdy player jeszcze się inicjuje)
  const win = playerRef.current?.contentWindow;
  if (win) {
    win.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
    win.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
    win.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
  }
};

  const [lang, setLang] = useState<LangKey>('pl');
  const [langReady, setLangReady] = useState(false);

  // dark mode (jak w register.tsx)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') === 'dark';
    return false;
  });
  // Autoodtwarzanie TV (sterowane przez przycisk „Zobacz co Cię czeka”)
    const [autoPlayVideo, setAutoPlayVideo] = useState(true);
  
    useEffect(() => {
  if (typeof window === 'undefined') return;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const apply = () => setAutoPlayVideo(!mq.matches);
  apply();
  mq.addEventListener?.('change', apply);
  return () => mq.removeEventListener?.('change', apply);
}, []);

  // ──────────────────────────────────────────────────────────────
  // MARKET-AWARE PRICING (hooki muszą być wewnątrz komponentu)
  // ──────────────────────────────────────────────────────────────
  const [market, setMarket] = useState<Market>('PL');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const cc = String(data?.country_code || '').toUpperCase();
        if (cc === 'PL') {
          if (mounted) setMarket('PL');
        } else if (EU_COUNTRIES.has(cc)) {
          if (mounted) setMarket('EU');
        } else {
          if (mounted) setMarket('OTHER');
        }
      } catch {
        if (mounted) setMarket('OTHER'); // fallback
      }
    })();
    return () => { mounted = false; };
  }, []);
    useEffect(() => {
  // Dołącz skrypt Iframe API tylko raz
  if (typeof window === 'undefined') return;
  if (window.YT && window.YT.Player) {
    setYtReady(true);
    ytPlayerRef.current = new window.YT.Player('introPlayer', {
      events: { onReady: () => setYtReady(true) },
    });
    return;
  }
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    ytPlayerRef.current = new window.YT.Player('introPlayer', {
      events: { onReady: () => setYtReady(true) },
    });
  };
}, []);

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
      <p
        className="text-gray-500 text-sm"
        aria-live="polite"
        role="status"
      >
        ⏳ Ładowanie języka...
      </p>
    </main>
  );
}

// 5) Formatowanie ceny
function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
}

// 6) Pomocnicze aliasy
const P = MARKET_PRICING[market];
const cur = P.currency;
const pp = P.patient;
const pr = P.pro;

// ─────────────────────────────────────────────
// PROMO: World Diabetes Day – 30-day discount
// 14.11.2025 → 14.12.2025
// ─────────────────────────────────────────────
const now = new Date();

// Uwaga: miesiące są 0–11, więc listopad = 10
const promoStart = new Date(2025, 10, 14); // 14.11.2025
const promoEnd   = new Date(2025, 11, 14); // 14.12.2025

const isPromo =
  now >= promoStart &&
  now <= promoEnd;

// ceny promocyjne globalnie
const PROMO_PRICE = {
  PL: 49,
  EU: 13,
  OTHER: 14
} as const;

// 7) Sformatowane ceny
const pricePatient7   = formatPrice(pp.plan7, cur);
const basePatient30 = pp.plan30;

const promoPatient30 = PROMO_PRICE[market];

const pricePatient30 = formatPrice(
  isPromo ? promoPatient30 : basePatient30,
  cur
);

const pricePatient90  = formatPrice(pp.plan90, cur);
const pricePatient365 = formatPrice(pp.plan365, cur);

const pricePro30  = formatPrice(pr.plan30, cur);
const pricePro365 = formatPrice(pr.plan365, cur);

const patientPlans = [
  {
    title: tUI('pricing.plan7.title'),
    price: pricePatient7,
    popular: false,
    bullets: [
      tUI('pricing.plan7.b1'),
      tUI('pricing.plan7.b2'),
      tUI('pricing.plan7.b3'),
      tUI('pricing.plan7.b4'),
      tUI('pricing.plan7.b5'),
      tUI('pricing.plan7.b6'),
      tUI('pricing.plan7.b7'),
      tUI('pricing.plan7.b8'),
      tUI('pricing.plan7.b9'),
      tUI('pricing.plan7.b10'),
    ],
  },
  {
    title: tUI('pricing.plan30.title'),
    price: pricePatient30,
    popular: true,
    bullets: [
      tUI('pricing.plan30.b1'),
      tUI('pricing.plan30.b2'),
      tUI('pricing.plan30.b3'),
      tUI('pricing.plan30.b4'),
      tUI('pricing.plan30.b5'),
      tUI('pricing.plan30.b6'),
      tUI('pricing.plan30.b7'),
      tUI('pricing.plan30.b8'),
      tUI('pricing.plan30.b9'),
      tUI('pricing.plan30.b10'),
    ],
  },
  {
    title: tUI('pricing.plan90.title'),
    price: pricePatient90,
    popular: false,
    bullets: [
      tUI('pricing.plan90.b1'),
      tUI('pricing.plan90.b2'),
      tUI('pricing.plan90.b3'),
      tUI('pricing.plan90.b4'),
      tUI('pricing.plan90.b5'),
      tUI('pricing.plan90.b6'),
      tUI('pricing.plan90.b7'),
      tUI('pricing.plan90.b8'),
      tUI('pricing.plan90.b9'),
      tUI('pricing.plan90.b10'),
    ],
  },
  {
    title: tUI('pricing.plan365.title'),
    price: pricePatient365,
    popular: false,
    bullets: [
      tUI('pricing.plan365.b1'),
      tUI('pricing.plan365.b2'),
      tUI('pricing.plan365.b3'),
      tUI('pricing.plan365.b4'),
      tUI('pricing.plan365.b5'),
      tUI('pricing.plan365.b6'),
      tUI('pricing.plan365.b7'),
      tUI('pricing.plan365.b8'),
      tUI('pricing.plan365.b9'),
      tUI('pricing.plan365.b10'),
    ],
  },
];

const proPlans = [
  {
    title: tUI('pricing.pro30.title'),
    price: pricePro30,
    bullets: [
      tUI('pricing.pro30.b1'),
      tUI('pricing.pro30.b2'),
      tUI('pricing.pro30.b3'),
      tUI('pricing.pro30.b4'),
      tUI('pricing.pro30.b5'),
      tUI('pricing.pro30.b6'),
      tUI('pricing.pro30.b7'),
      tUI('pricing.pro30.b8'),
      tUI('pricing.pro30.b9'),
    ],
  },
  {
    title: tUI('pricing.pro365.title'),
    price: pricePro365,
    bullets: [
      tUI('pricing.pro365.b1'),
      tUI('pricing.pro365.b2'),
      tUI('pricing.pro365.b3'),
      tUI('pricing.pro365.b4'),
      tUI('pricing.pro365.b5'),
      tUI('pricing.pro365.b6'),
      tUI('pricing.pro365.b7'),
      tUI('pricing.pro365.b8'),
      tUI('pricing.pro365.b9'),
    ],
  },
];
const origin = typeof window !== 'undefined' ? window.location.origin : '';
const videoSrc = `https://www.youtube-nocookie.com/embed/Ou56AtcivkA?` + new URLSearchParams({
  autoplay: autoPlayVideo ? '1' : '0',
  mute:     autoPlayVideo ? '1' : '0', // jeśli autoplay, domyślnie w ciszy (odmutujemy po kliknięciu)
  controls: '0',
  rel: '0',
  modestbranding: '1',
  loop: autoPlayVideo ? '1' : '0',
  playlist: 'Ou56AtcivkA',
  playsinline: '1',
  enablejsapi: '1',
  origin,
}).toString();


const steps = [
  {
    title: tUI('steps.registration.title'),
    desc: tUI('steps.registration.desc'),
    icon: '/icons/registration.svg',
    alt: tUI('steps.registration.alt'),
    color: 'text-red-500',
  },
  {
    title: tUI('steps.medical.title'),
    desc: tUI('steps.medical.desc'),
    icon: '/icons/medical.svg',
    alt: tUI('steps.medical.alt'),
    color: 'text-orange-500',
  },
  {
    title: tUI('steps.interview.title'),
    desc: tUI('steps.interview.desc'),
    icon: '/icons/interview.svg',
    alt: tUI('steps.interview.alt'),
    color: 'text-yellow-500',
  },
  {
    title: tUI('steps.calculator.title'),
    desc: tUI('steps.calculator.desc'),
    icon: '/icons/calculator.svg',
    alt: tUI('steps.calculator.alt'),
    color: 'text-green-500',
  },
  {
    title: tUI('steps.plan.title'),
    desc: tUI('steps.plan.desc'),
    icon: '/icons/plan.svg',
    alt: tUI('steps.plan.alt'),
    color: 'text-blue-500',
  },
  {
    title: tUI('steps.recipes.title'),
    desc: tUI('steps.recipes.desc'),
    icon: '/icons/recipes.svg',
    alt: tUI('steps.recipes.alt'),
    color: 'text-cyan-500',
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
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
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

      <section className="relative w-full">
        <div className="relative h-[680px] md:h-[700px] lg:h-[720px]">
          <Image
            src="/landing-hero.jpg"
            alt={tUI('landing.heroAlt')}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0f271e]/65 dark:bg-[#0c1f18]/65" />

          {/* OVERLAY: grid → logo w 1. wierszu, treść w 2. */}
          <div className="absolute inset-0">
            <div className="h-full grid grid-rows-[auto,1fr] gap-y-4 sm:gap-y-6">
              {/* LOGO — zawsze nad treścią, wyśrodkowane */}
              <div className="flex justify-center pt-2">
                <Image
                  src="/logo-dietcare.png"
                  alt={tUI('landing.logoAlt')}
                  width={300}
                  height={96}
                  className="drop-shadow-2xl w-40 sm:w-56 md:w-64 lg:w-[300px] h-auto"
                  priority
                />
              </div>

              {/* TEKST + CTA — prawa strona, bez nakładania na logo */}
              <div className="flex items-start justify-end px-6 md:pr-12 lg:pr-24">
                <div className="max-w-[560px] md:max-w-[640px] text-justify">
                  <p className="text-base md:text-lg lg:text-xl font-semibold tracking-tight leading-[1.6] text-white/95">
                    <span>{tUI('landing.tagline.title')}</span>
                    <sup className="align-super text-xs ml-1">
                    <a
                    href="#claim-footnote"
                    aria-describedby="claim-footnote"
                    className="no-underline hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-sm"
                    >
                    *
                    </a>
                    </sup>
                    </p>
                  <p className="mt-4 text-base md:text-lg lg:text-xl font-semibold tracking-tight leading-[1.6] text-white/95">
                    {tUI('landing.tagline.desc')}
                  </p>

                 <div className="mt-6 w-full flex flex-col sm:flex-row gap-3 justify-end pb-6 md:pb-10">
                  <button
                    onClick={() => {
                      localStorage.setItem('entryMode', 'patient');
                      window.location.href = '/register?mode=patient';
                    }}
                    className="w-full sm:w-auto max-w-[260px] bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-base sm:text-lg shadow-lg"
                    aria-label={tUI('cta.title')}
                    title={tUI('cta.title')}
                  >
                    {tUI('cta.title')}
                  </button>

                  <button
                    onClick={goToTv}
                    className="w-full sm:w-auto max-w-[260px] bg-white/90 text-gray-900 hover:bg-white px-6 py-3 rounded-xl text-base sm:text-lg shadow-lg border border-white/40 dark:bg-black/30 dark:text-white dark:hover:bg-black/40"
                    aria-label={tUI('cta.preview')}
                    title={tUI('cta.preview')}
                  >
                    {tUI('cta.preview')}
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* STEPS */}
      <section className="mx-auto max-w-6xl px-5 mt-8 md:mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
          {steps.map((s) => (
            <div
              key={s.title + s.icon}
              className="rounded-2xl bg-white/15 dark:bg-black/20 backdrop-blur p-4 md:p-5 shadow-lg border border-white/10 text-center"
            >
            <div className={`mx-auto h-10 w-10 md:h-12 md:w-12 mb-2 relative flex items-center justify-center ${s.color}`}>
              {/* pastelowa pastylka w tle, obręcz przyjmuje ten sam kolor */}
              <span className="absolute inset-0 rounded-2xl opacity-20 ring-1 ring-current/30" />
              {/* ikona „pomalowana” bieżącym kolorem */}
              <span
                aria-hidden
                className="relative z-10 h-8 w-8 md:h-10 md:w-10 bg-current"
                style={{
                  WebkitMaskImage: `url(${s.icon})`,
                  maskImage: `url(${s.icon})`,
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                }}
              />
            </div>
            <h3 className={`font-semibold ${s.color}`}>{s.title}</h3>
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
    {/* Pacjenci — 4 plany */}
    <div>
      <h3 className="text-lg font-semibold mb-3 opacity-90">
        {tUI('pricing.patientsHeader')}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {patientPlans.map((p) => (
        <div
          key={p.title}
          className={
            "rounded-2xl backdrop-blur p-5 shadow-lg border transition " +
            (isPromo && p.title === tUI('pricing.plan30.title')
              ? "bg-sky-500/20 border-sky-400/40 shadow-sky-500/30"
              : "bg-white/15 dark:bg-black/20 border-white/10"
            )
          }
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

          {isPromo && p.title === tUI('pricing.plan30.title') && (
            <div className="mt-1 text-xs inline-block px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-200">
              {tUI('promo')}
            </div>
          )}
            <ul className="mt-3 space-y-2 text-sm opacity-95">
              {p.bullets.map((b, i) => <li key={i}>• {b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>

    {/* Lekarze & dietetycy (PRO) — 2 plany */}
    <div>
      <h3 className="text-lg font-semibold mb-3 opacity-90">
        {tUI('pricing.doctorsHeader')}
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
 {/* MODERN TV – osadzone w sekcji PRICING (w pełni responsywne) */}
<div id="intro-tv" ref={tvSectionRef} className="mt-10 md:mt-12">
  <div
    className="relative mx-auto w-full max-w-6xl px-2 sm:px-4"
    aria-label="Modern TV – intro video player"
  >
    {/* Ekran z ultracienką ramką */}
    <div
      className="relative mx-auto w-full aspect-video rounded-[14px] bg-black/95 shadow-[0_20px_60px_rgba(0,0,0,.45)] ring-1 ring-white/10 overflow-hidden"
      style={{
        boxShadow:
          '0 30px 80px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.04)',
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-white/6 to-transparent" />
      <div className="pointer-events-none absolute inset-0 hidden sm:block bg-[radial-gradient(120%_80%_at_10%_0%,rgba(255,255,255,.06),transparent_55%)]" />
      <iframe
        ref={playerRef}
        className="absolute inset-0 h-full w-full"
        src={videoSrc}
        title="Diet Care Platform — intro"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>

    {/* Soundbar (dyskretny) */}
    <div className="mx-auto mt-3 h-2 sm:h-2.5 w-[88%] rounded-full bg-gradient-to-b from-gray-800 to-gray-900 ring-1 ring-white/10" />

    {/* Stojak – dwie stopy */}
    <div className="mx-auto mt-3 flex w-[92%] items-center justify-between">
      <span className="h-1.5 w-16 sm:w-24 rounded-full bg-black/60" />
      <span className="h-1.5 w-16 sm:w-24 rounded-full bg-black/60" />
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
      {/* FOOTER */}

<footer className="mt-12 md:mt-16 border-t border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur">
  <div className="mx-auto max-w-6xl px-5 py-8 md:py-10 grid gap-8 md:grid-cols-2">
    {/* Kontakt (bez adresu) */}
    <div>
      <h3 className="text-lg font-semibold">{tUI('footer.contact')}</h3>
      <p className="mt-2 text-sm opacity-90">
        <span className="font-medium">{tUI('footer.admin')}:</span> ALS sp. z o.o.
      </p>
      <p className="mt-2 text-sm">
        <span className="font-medium">{tUI('footer.email')}:</span>{' '}
        <a href="mailto:contact@dcp.care" className="underline decoration-white/40 hover:decoration-white">
          contact@dcp.care
        </a>
      </p>
    </div>

          {/* Social + strona www */}
          <div className="md:text-right">
        <h3 className="text-lg font-semibold">{tUI('footer.followUs')}</h3>

        <div className="mt-4 flex gap-6 md:gap-8 justify-center md:justify-end items-center">
         
          {/* Facebook */}
          <a href="https://www.facebook.com/profile.php?id=61580694946237" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="opacity-90 hover:opacity-100 transition">
            <svg width="36" height="36" viewBox="0 0 24 24" role="img" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#1877F2"/>
              <path d="M13.4 8.7h2V6.2c-.4-.1-1.2-.2-2.1-.2-2.1 0-3.5 1.3-3.5 3.6v2H7.9v2.5h1.9V21h2.6v-6h2.1l.4-2.5H12.4v-1.7c0-.7.2-1.1 1-1.1z" fill="#fff"/>
            </svg>
           </a>
            {/* Instagram */}
            <a href="https://www.instagram.com/diet.care88" target="_blank" rel="noopener noreferrer"
            aria-label="Instagram" title="Instagram" className="opacity-90 hover:opacity-100 transition">
            <svg width="36" height="36" viewBox="0 0 24 24" role="img" aria-hidden="true">
            <defs>
              <linearGradient id="igGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F58529"/>
                <stop offset="50%" stopColor="#DD2A7B"/>
                <stop offset="100%" stopColor="#8134AF"/>
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#igGrad)"/>
            {/* obramowanie „korpusu” aparatu */}
            <rect x="6" y="6" width="12" height="12" rx="4" ry="4"
                  fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1"/>
            {/* obiektyw */}
            <circle cx="12" cy="12" r="3.5" fill="none" stroke="#fff" strokeWidth="2"/>
            {/* „dioda” w prawym górnym rogu */}
            <circle cx="16.6" cy="7.4" r="1.2" fill="#fff"/>
          </svg>
          </a>

          {/* YouTube */}
          <a href="https://www.youtube.com/@DietCarePlatform" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="opacity-90 hover:opacity-100 transition">
            <svg width="36" height="36" viewBox="0 0 24 24" role="img" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="3" fill="#FF0000"/>
              <path d="M10 9l5 3-5 3V9z" fill="#fff"/>
            </svg>
          </a>
           {/* ALS – strona administratora */}
          <a
            href="https://alsolution.pl/produkty-1/diet-care-platform"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ALS – strona administratora"
            className="opacity-90 hover:opacity-100 transition"
            title="ALS – administrator serwisu"
          >
            <Image
              src="/als-512.png"
              alt="ALS sp. z o.o."
              width={36}
              height={36}
              className="rounded-md shadow-sm"
              priority
            />
          </a>
        </div>
      </div>
        </div>
        <div id="claim-footnote" className="mx-auto max-w-6xl px-5 pt-1 pb-3 text-[11px] md:text-xs opacity-80 leading-snug">
          * {tUI('hero.claimFootnote')}
          </div>    
        <div className="mx-auto max-w-6xl px-5 pb-6 text-xs opacity-70 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span>© {new Date().getFullYear()} Diet Care Platform</span>
          <span>{tUI('footer.rights')}</span>
        </div>
      </footer>
    </main>
  );
}
