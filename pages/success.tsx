// pages/success.tsx
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { translationsUI } from '@/utils/translationsUI';
import { createClient } from '@supabase/supabase-js';

type Lang = 'pl'|'en'|'de'|'fr'|'es'|'ua'|'ru'|'zh'|'hi'|'ar'|'he';
type Currency3 = 'PLN'|'EUR'|'USD';

function qp(name: string, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  const v = new URLSearchParams(window.location.search).get(name);
  return v ?? fallback;
}

function normalizeLang(v?: string): Lang {
  const supported: Lang[] = ['pl','en','de','fr','es','ua','ru','zh','hi','ar','he'];
  const s = (v || '').toLowerCase();
  if ((supported as string[]).includes(s)) return s as Lang;
  const short = s.slice(0,2);
  if ((supported as string[]).includes(short)) return short as Lang;
  return 'pl';
}

// Supabase client (public, przeglądarka)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SuccessPage() {
  const lang: Lang = useMemo(() => normalizeLang(qp('lang', 'pl')), []);
  const isRTL = lang === 'ar' || lang === 'he';
  const t = (key: string) =>
    translationsUI[key]?.[lang] ||
    translationsUI[key]?.['en'] ||
    key;

  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<Currency3>('PLN');
  const [loading, setLoading] = useState(true);

  // Pobierz kwotę i walutę z Supabase po stripe_session_id
  useEffect(() => {
    let cancelled = false;
    const sessionId = qp('session_id', '');

    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Polling: 6 prób co ~1.5s (max ~9s) – webhook może się spóźnić
    const MAX_TRIES = 6;
    let tries = 0;

    const fetchOnce = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('amount, currency')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          // cicho – spróbujemy jeszcze raz
        } else if (data?.amount != null && data?.currency) {
          setAmount(Number(data.amount));
          const cur = String(data.currency).toUpperCase();
          setCurrency((['PLN','EUR','USD'] as const).includes(cur as Currency3) ? (cur as Currency3) : 'PLN');
          setLoading(false);
          return;
        }

        tries += 1;
        if (tries < MAX_TRIES) {
          setTimeout(fetchOnce, 1500);
        } else {
          // Fallback wyświetleniowy (bez wczytanej kwoty)
          setLoading(false);
        }
      }
    };

    fetchOnce();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Head>
        <title>{t('success.title')}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main
        dir={isRTL ? 'rtl' : 'ltr'}
        className="relative min-h-screen bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] flex flex-col justify-start items-center pt-6 px-4 md:pt-10 md:px-6 text-white transition-all duration-300 overflow-x-hidden"
      >
        {/* kontener */}
        <section className="w-full max-w-xl md:max-w-2xl">
          {/* karta */}
          <div className="mx-auto w-full rounded-2xl bg-white/95 text-[#0f271e] shadow-xl ring-1 ring-black/5 p-5 sm:p-6 md:p-8 backdrop-blur">
            {/* logo */}
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} mb-4`}>
              <img
                src="/logo-dietcare.png"
                alt="Diet Care Platform"
                className="h-9 w-auto sm:h-10"
              />
            </div>

            {/* nagłówek */}
            <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-emerald-900">
              {t('success.heading')}
            </h1>

            {/* opis */}
            <p className="mt-2 text-base sm:text-lg text-emerald-900/80">
              {t('success.activated')}
            </p>

            {/* kwota */}
            <div className="mt-3">
              {loading ? (
                <div className="h-5 w-40 rounded bg-emerald-100 animate-pulse" />
              ) : amount != null ? (
                <p className="text-sm sm:text-base text-emerald-900/80">
                  {t('success.amount')}: {amount.toFixed(2)} {currency}
                </p>
              ) : (
                <p className="text-sm sm:text-base text-emerald-900/70">
                  {t('success.amount')}: —
                </p>
              )}
            </div>

            {/* CTA */}
            <div className={`mt-6 ${isRTL ? 'text-left' : 'text-right'}`}>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm sm:text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition"
              >
                {t('success.back')}
              </Link>
            </div>
          </div>
        </section>

        {/* margines dolny na małych ekranach */}
        <div className="h-10 md:h-12" />
      </main>
    </>
  );
}
