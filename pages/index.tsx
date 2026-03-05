// pages/index.tsx
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { translationsUI } from "@/utils/translationsUI";
import { type LangKey, languageLabels } from "@/utils/i18n";

// KONTAKT / SOCIAL
const FOOTER = {
  email: "contact@dcp.care",
  facebook: "https://www.facebook.com/profile.php?id=61580694946237",
  youtube: "https://www.youtube.com/@DietCarePlatform",
  adminName: "ALS sp. z o.o.",
};

// ────────────────────────────────────────────────────────────────────────────
// PRICING — market-aware (PL → PLN, EU → EUR, OTHER → USD)
// ────────────────────────────────────────────────────────────────────────────

// 1) Cennik per rynek (stałe biznesowe – bez FX)
const MARKET_PRICING = {
  PL: {
    currency: "PLN",
    patient: {
      plan7: 29,
      plan30: 49,
      plan90: 145,
      plan365: 499,
    },
    pro: {
      plan30: 390,
      plan365: 3800,
    },
  },
  EU: {
    currency: "EUR",
    patient: {
      plan7: 7,
      plan30: 13,
      plan90: 33,
      plan365: 110,
    },
    pro: {
      plan30: 99,
      plan365: 899,
    },
  },
  OTHER: {
    currency: "USD",
    patient: {
      plan7: 8,
      plan30: 14,
      plan90: 35,
      plan365: 120,
    },
    pro: {
      plan30: 99,
      plan365: 899,
    },
  },
} as const;

type Market = keyof typeof MARKET_PRICING;

// 2) UE (bez PL – PL ma własny cennik)
const EU_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * 2026 GLASS BACKGROUND (visual only):
 * - icy blue glass base
 * - subtle watermark logo (selectively blended)
 * - fiber optic threads (SVG, very subtle)
 */
function GlassBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_15%,rgba(56,189,248,.22),transparent_60%),radial-gradient(900px_600px_at_80%_25%,rgba(167,139,250,.16),transparent_60%),radial-gradient(900px_700px_at_55%_85%,rgba(16,185,129,.10),transparent_60%)]" />

      {/* Glass veil */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.10)_0%,rgba(255,255,255,.04)_30%,rgba(0,0,0,.10)_100%)] opacity-70" />

      {/* Subtle noise (CSS-only) */}
      <div className="absolute inset-0 opacity-[0.10] mix-blend-overlay">
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:18px_18px] blur-[0.2px]" />
      </div>

      {/* Logo watermark (selective + subtle)
          Jeśli masz lepszy znak (np. samo serce) podmień src na np. /logo-mark.png */}
      <div className="absolute inset-0 opacity-[0.12]">
        <div className="absolute -top-20 -left-10 h-[520px] w-[520px] blur-[0.2px] rotate-[-10deg]">
          <Image
            src="/logo-dietcare.png"
            alt=""
            fill
            className="object-contain opacity-[0.45]"
            priority={false}
          />
        </div>
        <div className="absolute -bottom-24 right-[-60px] h-[620px] w-[620px] blur-[0.4px] rotate-[12deg]">
          <Image
            src="/logo-dietcare.png"
            alt=""
            fill
            className="object-contain opacity-[0.25]"
            priority={false}
          />
        </div>
      </div>

      {/* Fiber threads (very subtle) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="fiberA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(56,189,248,0.00)" />
            <stop offset="35%" stopColor="rgba(56,189,248,0.45)" />
            <stop offset="70%" stopColor="rgba(167,139,250,0.35)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.00)" />
          </linearGradient>
          <linearGradient id="fiberB" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(251,113,133,0.00)" />
            <stop offset="40%" stopColor="rgba(167,139,250,0.25)" />
            <stop offset="70%" stopColor="rgba(56,189,248,0.30)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.00)" />
          </linearGradient>
          <filter id="fiberGlow">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Lines */}
        <path
          d="M-40,620 C180,520 240,420 420,380 C620,335 720,470 860,420 C1010,365 1080,200 1240,120"
          fill="none"
          stroke="url(#fiberA)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="8 14"
          className="dcp-fiber"
          filter="url(#fiberGlow)"
        />
        <path
          d="M-60,220 C120,280 260,120 420,160 C620,210 650,320 820,300 C980,280 1060,520 1260,560"
          fill="none"
          stroke="url(#fiberB)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="10 18"
          className="dcp-fiber dcp-fiber-slow"
          filter="url(#fiberGlow)"
        />

        {/* Micro sparkles */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 60 + i * 80;
          const y = 120 + ((i * 37) % 520);
          return (
            <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(255,255,255,.55)" opacity="0.35">
              <animate attributeName="opacity" values="0.10;0.55;0.10" dur={`${5 + (i % 6)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>

      {/* Bottom fade for readability */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06131a] to-transparent opacity-60" />
    </div>
  );
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
    tvSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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
      win.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
      win.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [100] }), "*");
      win.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
    }
  };

  const [lang, setLang] = useState<LangKey>("pl");
  const [langReady, setLangReady] = useState(false);

    // logo: scroll -> subtle scale
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); // ustaw od razu

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Autoodtwarzanie TV (sterowane przez przycisk „Zobacz co Cię czeka”)
  const [autoPlayVideo, setAutoPlayVideo] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAutoPlayVideo(!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // ──────────────────────────────────────────────────────────────
  // MARKET-AWARE PRICING (hooki muszą być wewnątrz komponentu)
  // ──────────────────────────────────────────────────────────────
  const [market, setMarket] = useState<Market>("PL");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const cc = String(data?.country_code || "").toUpperCase();
        if (cc === "PL") {
          if (mounted) setMarket("PL");
        } else if (EU_COUNTRIES.has(cc)) {
          if (mounted) setMarket("EU");
        } else {
          if (mounted) setMarket("OTHER");
        }
      } catch {
        if (mounted) setMarket("OTHER"); // fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Dołącz skrypt Iframe API tylko raz
    if (typeof window === "undefined") return;
    if (window.YT && window.YT.Player) {
      setYtReady(true);
      ytPlayerRef.current = new window.YT.Player("introPlayer", {
        events: { onReady: () => setYtReady(true) },
      });
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      ytPlayerRef.current = new window.YT.Player("introPlayer", {
        events: { onReady: () => setYtReady(true) },
      });
    };
  }, []);

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
        const stored = localStorage.getItem("platformLang");
        if (stored && Object.keys(languageLabels).includes(stored)) {
          setLang(stored as LangKey);
          setLangReady(true);
          return;
        }
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const detected = data?.languages?.split(",")[0]?.toLowerCase();
        if (detected && Object.keys(languageLabels).includes(detected)) {
          setLang(detected as LangKey);
          localStorage.setItem("platformLang", detected);
        } else {
          setLang("en");
          localStorage.setItem("platformLang", "en");
        }
      } catch {
        setLang("pl");
        localStorage.setItem("platformLang", "pl");
      } finally {
        setLangReady(true);
      }
    };
    initLang();
  }, []);

  // Magic link → /reset
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("access_token") && !window.location.pathname.includes("/reset")) {
        window.location.href = "/reset" + hash;
      }
    }
  }, []);

  if (!langReady) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm" aria-live="polite" role="status">
          ⏳ Ładowanie języka...
        </p>
      </main>
    );
  }

  // 5) Formatowanie ceny
  function formatPrice(value: number, currency: string) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
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
  const promoEnd = new Date(2025, 11, 14); // 14.12.2025

  const isPromo = now >= promoStart && now <= promoEnd;

  // ceny promocyjne globalnie
  const PROMO_PRICE = {
    PL: 49,
    EU: 13,
    OTHER: 14,
  } as const;

  // 7) Sformatowane ceny
  const pricePatient7 = formatPrice(pp.plan7, cur);
  const basePatient30 = pp.plan30;

  const promoPatient30 = PROMO_PRICE[market];

  const pricePatient30 = formatPrice(isPromo ? promoPatient30 : basePatient30, cur);

  const pricePatient90 = formatPrice(pp.plan90, cur);
  const pricePatient365 = formatPrice(pp.plan365, cur);

  const pricePro30 = formatPrice(pr.plan30, cur);
  const pricePro365 = formatPrice(pr.plan365, cur);

  const patientPlans = [
    {
      title: tUI("pricing.plan7.title"),
      price: pricePatient7,
      popular: false,
      bullets: [
        tUI("pricing.plan7.b1"),
        tUI("pricing.plan7.b2"),
        tUI("pricing.plan7.b3"),
        tUI("pricing.plan7.b4"),
        tUI("pricing.plan7.b5"),
        tUI("pricing.plan7.b6"),
        tUI("pricing.plan7.b7"),
        tUI("pricing.plan7.b8"),
        tUI("pricing.plan7.b9"),
        tUI("pricing.plan7.b10"),
      ],
    },
    {
      title: tUI("pricing.plan30.title"),
      price: pricePatient30,
      popular: true,
      bullets: [
        tUI("pricing.plan30.b1"),
        tUI("pricing.plan30.b2"),
        tUI("pricing.plan30.b3"),
        tUI("pricing.plan30.b4"),
        tUI("pricing.plan30.b5"),
        tUI("pricing.plan30.b6"),
        tUI("pricing.plan30.b7"),
        tUI("pricing.plan30.b8"),
        tUI("pricing.plan30.b9"),
        tUI("pricing.plan30.b10"),
      ],
    },
    {
      title: tUI("pricing.plan90.title"),
      price: pricePatient90,
      popular: false,
      bullets: [
        tUI("pricing.plan90.b1"),
        tUI("pricing.plan90.b2"),
        tUI("pricing.plan90.b3"),
        tUI("pricing.plan90.b4"),
        tUI("pricing.plan90.b5"),
        tUI("pricing.plan90.b6"),
        tUI("pricing.plan90.b7"),
        tUI("pricing.plan90.b8"),
        tUI("pricing.plan90.b9"),
        tUI("pricing.plan90.b10"),
      ],
    },
    {
      title: tUI("pricing.plan365.title"),
      price: pricePatient365,
      popular: false,
      bullets: [
        tUI("pricing.plan365.b1"),
        tUI("pricing.plan365.b2"),
        tUI("pricing.plan365.b3"),
        tUI("pricing.plan365.b4"),
        tUI("pricing.plan365.b5"),
        tUI("pricing.plan365.b6"),
        tUI("pricing.plan365.b7"),
        tUI("pricing.plan365.b8"),
        tUI("pricing.plan365.b9"),
        tUI("pricing.plan365.b10"),
      ],
    },
  ];

  const proPlans = [
    {
      title: tUI("pricing.pro30.title"),
      price: pricePro30,
      bullets: [
        tUI("pricing.pro30.b1"),
        tUI("pricing.pro30.b2"),
        tUI("pricing.pro30.b3"),
        tUI("pricing.pro30.b4"),
        tUI("pricing.pro30.b5"),
        tUI("pricing.pro30.b6"),
        tUI("pricing.pro30.b7"),
        tUI("pricing.pro30.b8"),
        tUI("pricing.pro30.b9"),
      ],
    },
    {
      title: tUI("pricing.pro365.title"),
      price: pricePro365,
      bullets: [
        tUI("pricing.pro365.b1"),
        tUI("pricing.pro365.b2"),
        tUI("pricing.pro365.b3"),
        tUI("pricing.pro365.b4"),
        tUI("pricing.pro365.b5"),
        tUI("pricing.pro365.b6"),
        tUI("pricing.pro365.b7"),
        tUI("pricing.pro365.b8"),
        tUI("pricing.pro365.b9"),
      ],
    },
  ];

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const videoId = "kSc0F38T3ac";

  const videoSrc =
    `https://www.youtube-nocookie.com/embed/${videoId}?` +
    new URLSearchParams({
      autoplay: autoPlayVideo ? "1" : "0",
      mute: autoPlayVideo ? "1" : "0", // autoplay tylko w ciszy
      controls: "0",
      rel: "0",
      modestbranding: "1",
      loop: autoPlayVideo ? "1" : "0",
      playlist: videoId, // WYMAGANE do loop
      playsinline: "1",
      enablejsapi: "1",
      origin,
    }).toString();

  const steps = [
    {
      title: tUI("steps.registration.title"),
      desc: tUI("steps.registration.desc"),
      icon: "/icons/registration.svg",
      alt: tUI("steps.registration.alt"),
      color: "text-red-500",
    },
    {
      title: tUI("steps.medical.title"),
      desc: tUI("steps.medical.desc"),
      icon: "/icons/medical.svg",
      alt: tUI("steps.medical.alt"),
      color: "text-orange-500",
    },
    {
      title: tUI("steps.interview.title"),
      desc: tUI("steps.interview.desc"),
      icon: "/icons/interview.svg",
      alt: tUI("steps.interview.alt"),
      color: "text-yellow-500",
    },
    {
      title: tUI("steps.calculator.title"),
      desc: tUI("steps.calculator.desc"),
      icon: "/icons/calculator.svg",
      alt: tUI("steps.calculator.alt"),
      color: "text-green-500",
    },
    {
      title: tUI("steps.plan.title"),
      desc: tUI("steps.plan.desc"),
      icon: "/icons/plan.svg",
      alt: tUI("steps.plan.alt"),
      color: "text-blue-500",
    },
    {
      title: tUI("steps.recipes.title"),
      desc: tUI("steps.recipes.desc"),
      icon: "/icons/recipes.svg",
      alt: tUI("steps.recipes.alt"),
      color: "text-cyan-500",
    },
  ];

  return (
    <main className="relative min-h-[100dvh] text-white transition-all duration-300 bg-[#06131a]">
            {/* Global logo – prawy górny róg strony */}
      <div
        className={`absolute top-6 right-6 z-40 hidden lg:block pointer-events-none transition-all duration-500 ${
          scrolled ? "scale-75 opacity-90" : "scale-100"
        }`}
      >
        <div className="relative h-64 w-64">
          <div className="logo-mask" />
          <Image
            src="/logo-dietcare.png"
            alt={tUI("landing.logoAlt")}
            fill
            className="object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,.65)]"
            priority
          />
        </div>
      </div>

      <Head>
        <title>{tUI("app.title")}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={tUI("app.metaDescription")} />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
      </Head>

      <style jsx global>{`
                /* subtle gradient mask for logo readability */
          .logo-mask {
            position: absolute;
            inset: -60px;
            background: radial-gradient(
              circle at center,
              rgba(6,19,26,0) 0%,
              rgba(6,19,26,0.35) 70%,
              rgba(6,19,26,0.65) 100%
            );
            z-index: -1;
          }
        /* iOS Safari: backdrop-filter + sticky scroll => delayed repaints ("kontenery doczytują się") */
          @supports (-webkit-touch-callout: none) {
            .ios-no-backdrop {
              -webkit-backdrop-filter: none !important;
              backdrop-filter: none !important;
            }
            .ios-glass-bg {
              background: rgba(255,255,255,0.08) !important; /* szkło bez blur */
              border-color: rgba(255,255,255,0.14) !important;
            }
          }
          html, body {
            background: #06131a;
            height: 100%;
          }
            @supports (-webkit-touch-callout: none) {
            nav.dcp-ios-no-sticky {
              position: static !important;
            }
          }
        @keyframes dcpPediatricGlow {
          0% {
            background-position: 0% 50%;
            filter: saturate(1.1) brightness(1);
          }
          50% {
            background-position: 100% 50%;
            filter: saturate(1.3) brightness(1.08);
          }
          100% {
            background-position: 0% 50%;
            filter: saturate(1.1) brightness(1);
          }
        }

        /* subtle fiber motion */
        @keyframes dcpFiberDash {
          0% {
            stroke-dashoffset: 0;
            opacity: 0.55;
          }
          50% {
            opacity: 0.75;
          }
          100% {
            stroke-dashoffset: -240;
            opacity: 0.55;
          }
        }
        .dcp-fiber {
          animation: dcpFiberDash 14s linear infinite;
        }
        .dcp-fiber-slow {
          animation-duration: 22s;
        }
      `}</style>

      {/* GLOBAL BACKDROP */}
      <div className="absolute inset-0 -z-10">
        <GlassBackdrop />
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 w-full dcp-ios-no-sticky">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mt-3 mb-2 rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.35)] ios-no-backdrop ios-glass-bg">
            <div className="flex items-center justify-between px-3 py-2 md:px-4">
              <div className="flex items-center gap-2">
                <label htmlFor="language-select" className="sr-only">
                  {tUI("nav.languageLabel")}
                </label>
                <select
                  id="language-select"
                  value={lang}
                  onChange={(e) => {
                    const selected = e.target.value as LangKey;
                    setLang(selected);
                    localStorage.setItem("platformLang", selected);
                  }}
                  className="border border-white/10 rounded-xl px-3 py-1.5 shadow bg-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  aria-label={tUI("nav.languageAria")}
                >
                  {Object.entries(languageLabels).map(([key, label]) => (
                    <option key={key} value={key} className="text-black">
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </nav>

            {/* HERO */}
            <section className="relative w-full">
        <div className="relative">
          {/* Hero container wrapper (logo poza kontenerami jak na szkicu) */}
          <div className="relative overflow-visible mx-auto max-w-6xl px-5 pt-6 md:pt-10 lg:pr-64">

            {/* Hero container (glass panel) */}
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,.45)] ios-no-backdrop ios-glass-bg">
              {/* inner highlight */}
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_0%,rgba(255,255,255,.10),transparent_55%)] opacity-70" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.08),rgba(0,0,0,.10))] opacity-50" />

              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
                {/* Left: Copy + CTA */}
                <div className="flex flex-col gap-6">
                  <div className="relative">
                    <p className="text-base sm:text-lg md:text-xl font-semibold tracking-tight leading-[1.6] text-white/95">
                      <span>{tUI("landing.tagline.title")}</span>
                      <sup className="align-super text-xs ml-1">
                        <a
                          href="#claim-footnote"
                          aria-describedby="claim-footnote"
                          className="no-underline hover:underline focus:outline-none focus:ring-2 focus:ring-sky-400/60 rounded-sm"
                        >
                          *
                        </a>
                      </sup>
                    </p>

                    <p className="mt-4 text-base sm:text-lg md:text-xl font-semibold tracking-tight leading-[1.6] text-white/90">
                      {tUI("landing.tagline.desc")}
                    </p>

                    {isPromo && (
                      <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 shadow-lg border border-white/12 backdrop-blur-xl">
                        <span aria-hidden className="h-6 w-6 rounded-full border-[3px] border-white bg-sky-500/70 shadow-inner" />
                        <div className="text-xs sm:text-sm leading-snug">
                          <div className="font-semibold">{tUI("promo")}</div>
                          <div className="opacity-90">
                            Plan 30 dni: <span className="font-semibold">49 PLN</span> (~13 EUR / 14 USD)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 w-full flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        localStorage.setItem("entryMode", "patient");
                        window.location.href = "/register?mode=patient";
                      }}
                      className="w-full sm:w-auto rounded-2xl px-6 py-3 text-base sm:text-lg font-semibold shadow-lg border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,.35),rgba(16,185,129,.25))] hover:bg-[linear-gradient(135deg,rgba(56,189,248,.45),rgba(16,185,129,.32))] backdrop-blur-xl"
                      aria-label={tUI("cta.title")}
                      title={tUI("cta.title")}
                    >
                      {tUI("cta.title")}
                    </button>

                    <button
                      onClick={goToTv}
                      className="w-full sm:w-auto rounded-2xl px-6 py-3 text-base sm:text-lg font-semibold shadow-lg border border-white/10 bg-white/10 hover:bg-white/14 backdrop-blur-xl"
                      aria-label={tUI("cta.preview")}
                      title={tUI("cta.preview")}
                    >
                      {tUI("cta.preview")}
                    </button>
                  </div>
                </div>

                {/* Right: “glass preview” panel */}
                <div className="relative rounded-3xl border border-white/10 bg-white/7 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,.35)] overflow-hidden ios-no-backdrop ios-glass-bg">
                  <div className="absolute inset-0 bg-[radial-gradient(140%_90%_at_10%_0%,rgba(255,255,255,.10),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.05),rgba(0,0,0,.12))] opacity-70" />

                  <div className="relative p-6 sm:p-8">
                    <div className="text-sm opacity-80">{tUI("landing.heroAlt")}</div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {steps.slice(0, 4).map((s) => (
                        <div
                          key={s.title + s.icon}
                          className="rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-2xl border border-white/10 bg-white/8 flex items-center justify-center ${s.color}`}>
                              <span
                                aria-hidden
                                className="h-6 w-6 bg-current"
                                style={{
                                  WebkitMaskImage: `url(${s.icon})`,
                                  maskImage: `url(${s.icon})`,
                                  WebkitMaskRepeat: "no-repeat",
                                  maskRepeat: "no-repeat",
                                  WebkitMaskPosition: "center",
                                  maskPosition: "center",
                                  WebkitMaskSize: "contain",
                                  maskSize: "contain",
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">{s.title}</div>
                              <div className="text-xs opacity-70 line-clamp-2">{s.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl px-4 py-3">
                      <div className="text-xs uppercase tracking-wide opacity-70">AI + Clinician loop</div>
                      <div className="mt-1 text-sm opacity-85">
                        Medical → Interview → Model → Diet → QA → PDF → Recipes
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
                        <div className="h-full w-[62%] bg-[linear-gradient(90deg,rgba(56,189,248,.60),rgba(167,139,250,.45),rgba(16,185,129,.45))]" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* end right */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS (pełne) */}
      <section className="mx-auto max-w-6xl px-5 mt-10 md:mt-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
          {steps.map((s) => (
            <div
              key={s.title + s.icon}
              className="rounded-3xl bg-white/7 backdrop-blur-2xl p-4 md:p-5 shadow-[0_18px_60px_rgba(0,0,0,.30)] border border-white/10 text-center"
            >
              <div className={`mx-auto h-10 w-10 md:h-12 md:w-12 mb-2 relative flex items-center justify-center ${s.color}`}>
                <span className="absolute inset-0 rounded-2xl opacity-20 ring-1 ring-current/30" />
                <span
                  aria-hidden
                  className="relative z-10 h-8 w-8 md:h-10 md:w-10 bg-current"
                  style={{
                    WebkitMaskImage: `url(${s.icon})`,
                    maskImage: `url(${s.icon})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </div>
              <h3 className={`font-semibold ${s.color}`}>{s.title}</h3>
              <p className="text-sm opacity-85 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 mt-12 md:mt-16">
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-6">
          {tUI("pricing.title")}
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pacjenci — 4 plany */}
          <div>
            <h3 className="text-lg font-semibold mb-3 opacity-90">{tUI("pricing.patientsHeader")}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {patientPlans.map((p) => (
                <div
                  key={p.title}
                  className={
                    "relative rounded-3xl backdrop-blur-2xl p-5 border transition overflow-hidden " +
                    (p.title === tUI("pricing.plan30.title")
                      ? "bg-white/8 border-sky-300/25 shadow-[0_0_0_1px_rgba(255,255,255,.06),0_26px_90px_rgba(0,0,0,.45)]"
                      : "bg-white/7 border-white/10 shadow-[0_18px_60px_rgba(0,0,0,.30)]")
                  }
                >
                  {/* PREMIUM GLOW tylko dla Plan 30 */}
                  {p.title === tUI("pricing.plan30.title") && (
                    <>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -inset-10 opacity-70 blur-2xl"
                        style={{
                          background:
                            "radial-gradient(60% 60% at 20% 15%, rgba(56,189,248,.45), transparent 60%)," +
                            "radial-gradient(55% 55% at 85% 30%, rgba(167,139,250,.40), transparent 60%)," +
                            "radial-gradient(60% 60% at 55% 90%, rgba(16,185,129,.28), transparent 60%)",
                        }}
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 opacity-40"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.03) 35%, rgba(0,0,0,.10) 100%)",
                        }}
                      />
                    </>
                  )}

                  <div className="relative">
                    <div className="flex items-baseline justify-between">
                      <h4 className="font-semibold">{p.title}</h4>
                      <span className="text-sky-200 font-semibold">{p.price}</span>
                    </div>

                    {p.popular && (
                      <div className="mt-1 text-xs inline-block px-2 py-0.5 rounded bg-sky-500/15 border border-sky-300/25">
                        {tUI("pricing.popularTag")}
                      </div>
                    )}

                    {/* Badge trialu – tylko na Plan 30 */}
                    {p.title === tUI("pricing.plan30.title") && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border border-white/15 bg-white/8">
                        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-sky-200 shadow-[0_0_18px_rgba(56,189,248,.65)]" />
                        <span>{tUI("pricing.trial7Badge")}</span>
                      </div>
                    )}

                    {isPromo && p.title === tUI("pricing.plan30.title") && (
                      <div className="mt-2 text-xs inline-block px-2 py-0.5 rounded bg-sky-500/15 border border-sky-300/25 text-sky-200">
                        {tUI("promo")}
                      </div>
                    )}

                    <ul className="mt-3 space-y-2 text-sm opacity-95">
                      {p.bullets.map((b, i) => (
                        <li key={i}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lekarze & dietetycy (PRO) — 2 plany */}
          <div>
            <h3 className="text-lg font-semibold mb-3 opacity-90">{tUI("pricing.doctorsHeader")}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {proPlans.map((p) => (
                <div
                  key={p.title}
                  className="rounded-3xl bg-white/7 backdrop-blur-2xl p-5 border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,.30)]"
                >
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-semibold">{p.title}</h4>
                    <span className="text-sky-200 font-semibold">{p.price}</span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm opacity-95">
                    {p.bullets.map((b, i) => (
                      <li key={i}>• {b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODERN TV – osadzone w sekcji PRICING */}
        <div id="intro-tv" ref={tvSectionRef} className="mt-10 md:mt-12">
          <div className="relative mx-auto w-full max-w-6xl px-2 sm:px-4" aria-label="Modern TV – intro video player">
            <div
              className="relative mx-auto w-full aspect-video rounded-[18px] bg-black/85 shadow-[0_28px_90px_rgba(0,0,0,.55)] ring-1 ring-white/10 overflow-hidden"
              style={{
                boxShadow: "0 34px 100px rgba(0,0,0,.60), inset 0 0 0 1px rgba(255,255,255,.04)",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-white/6 to-transparent" />
              <div className="pointer-events-none absolute inset-0 hidden sm:block bg-[radial-gradient(120%_80%_at_10%_0%,rgba(255,255,255,.06),transparent_55%)]" />
              <iframe
                id="introPlayer"
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

            <div className="mx-auto mt-3 h-2 sm:h-2.5 w-[88%] rounded-full bg-white/8 ring-1 ring-white/10 backdrop-blur-xl" />
            <div className="mx-auto mt-3 flex w-[92%] items-center justify-between">
              <span className="h-1.5 w-16 sm:w-24 rounded-full bg-white/8" />
              <span className="h-1.5 w-16 sm:w-24 rounded-full bg-white/8" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA końcowe */}
      <section className="mx-auto max-w-6xl px-5 mt-10 mb-16">
        <p className="text-center text-xl md:text-2xl font-semibold mb-4">{tUI("cta.title")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              localStorage.setItem("entryMode", "patient");
              window.location.href = "/register?mode=patient";
            }}
           className="w-full sm:w-auto rounded-2xl px-6 py-3 text-lg font-semibold shadow-lg border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,.35),rgba(16,185,129,.25))] hover:bg-[linear-gradient(135deg,rgba(56,189,248,.45),rgba(16,185,129,.32))] backdrop-blur-xl"
            aria-label={tUI("cta.patientAria")}
            title={tUI("cta.patientAria")}
          >
            {tUI("cta.enterAsPatient")}
          </button>

          <button
            onClick={() => {
              localStorage.setItem("entryMode", "doctor");
              window.location.href = "/register?mode=doctor";
            }}
            className="w-full sm:w-auto rounded-2xl px-6 py-3 text-lg font-semibold shadow-lg border border-white/10 bg-white/10 hover:bg-white/14 backdrop-blur-xl"
            aria-label={tUI("cta.doctorAria")}
            title={tUI("cta.doctorAria")}
          >
            {tUI("cta.enterAsDoctor")}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-12 md:mt-16 border-t border-white/10 bg-white/6 backdrop-blur-2xl">
        <div className="mx-auto max-w-6xl px-5 py-8 md:py-10 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">{tUI("footer.contact")}</h3>
            <p className="mt-2 text-sm opacity-90">
              <span className="font-medium">{tUI("footer.admin")}:</span> ALS sp. z o.o.
            </p>
            <p className="mt-2 text-sm">
              <span className="font-medium">{tUI("footer.email")}:</span>{" "}
              <a href="mailto:contact@dcp.care" className="underline decoration-white/30 hover:decoration-white">
                contact@dcp.care
              </a>
            </p>
          </div>

          <div className="md:text-right">
            <h3 className="text-lg font-semibold">{tUI("footer.followUs")}</h3>

            <div className="mt-4 flex gap-6 md:gap-8 justify-center md:justify-end items-center">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/profile.php?id=61580694946237"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="opacity-90 hover:opacity-100 transition"
              >
                <svg width="36" height="36" viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="4" fill="#1877F2" />
                  <path
                    d="M13.4 8.7h2V6.2c-.4-.1-1.2-.2-2.1-.2-2.1 0-3.5 1.3-3.5 3.6v2H7.9v2.5h1.9V21h2.6v-6h2.1l.4-2.5H12.4v-1.7c0-.7.2-1.1 1-1.1z"
                    fill="#fff"
                  />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/diet.care88"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="opacity-90 hover:opacity-100 transition"
              >
                <svg width="36" height="36" viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <defs>
                    <linearGradient id="igGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F58529" />
                      <stop offset="50%" stopColor="#DD2A7B" />
                      <stop offset="100%" stopColor="#8134AF" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#igGrad)" />
                  <rect x="6" y="6" width="12" height="12" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1" />
                  <circle cx="12" cy="12" r="3.5" fill="none" stroke="#fff" strokeWidth="2" />
                  <circle cx="16.6" cy="7.4" r="1.2" fill="#fff" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://www.youtube.com/@DietCarePlatform"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="opacity-90 hover:opacity-100 transition"
              >
                <svg width="36" height="36" viewBox="0 0 24 24" role="img" aria-hidden="true">
                  <rect x="2" y="6" width="20" height="12" rx="3" fill="#FF0000" />
                  <path d="M10 9l5 3-5 3V9z" fill="#fff" />
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
                <Image src="/als-512.png" alt="ALS sp. z o.o." width={36} height={36} className="rounded-md shadow-sm" priority />
              </a>
            </div>
          </div>
        </div>

        <div id="claim-footnote" className="mx-auto max-w-6xl px-5 pt-1 pb-3 text-[11px] md:text-xs opacity-80 leading-snug">
          * {tUI("hero.claimFootnote")}
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-6 text-xs opacity-70 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span>© {new Date().getFullYear()} Diet Care Platform</span>
          <span>{tUI("footer.rights")}</span>
        </div>
      </footer>
    </main>
  );
}