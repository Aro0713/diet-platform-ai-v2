import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { translationsUI } from '@/utils/translationsUI';


type Lang = 'pl'|'en'|'de'|'fr'|'es'|'ua'|'ru'|'zh'|'hi'|'ar'|'he';

function qp(name: string, fallback: string) {
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

export default function SuccessPage() {
  // język z URL
  const lang: Lang = useMemo(() => normalizeLang(qp('lang', 'pl')), []);
  const t = (key: string) =>
    translationsUI[key]?.[lang] ||
    translationsUI[key]?.['en'] ||
    key;

  // kwota i waluta
  const [currency, setCurrency] = useState<'PLN'|'EUR'|'USD'>('PLN');
  const [value, setValue] = useState<number>(1.0);

  useEffect(() => {
    const cur = (qp('currency', 'PLN').toUpperCase());
    const val = parseFloat(qp('value', '1.00'));
    setCurrency((['PLN','EUR','USD'] as const).includes(cur as any) ? (cur as 'PLN'|'EUR'|'USD') : 'PLN');
    setValue(Number.isFinite(val) ? val : 1.0);
  }, []);

  // RTL
  const isRTL = lang === 'ar' || lang === 'he';
  const dir = isRTL ? 'rtl' : 'ltr';
  const align = isRTL ? 'right' : 'center';

  // style zbliżone do index.tsx (gradient, karta, przycisk)
  const styles = {
    page: {
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        'linear-gradient(135deg, #0ea472 0%, #18b88a 35%, #59d3b0 70%, #b9f0df 100%)',
      direction: dir as any,
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    } as React.CSSProperties,
    card: {
      width: '100%',
      maxWidth: 640,
      background: 'rgba(255,255,255,0.96)',
      borderRadius: 20,
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      padding: '36px 32px',
      textAlign: align as any,
      backdropFilter: 'blur(6px)',
    } as React.CSSProperties,
    logoWrap: {
      display: 'flex',
      justifyContent: align as any,
      marginBottom: 16,
    },
    logo: {
      height: 40,
      width: 'auto',
    },
    h1: {
      margin: 0,
      fontSize: 28,
      lineHeight: 1.2,
      color: '#0f5132',
      fontWeight: 700,
    },
    p: {
      marginTop: 12,
      marginBottom: 0,
      fontSize: 16,
      color: '#214a3a',
    },
    amount: {
      marginTop: 8,
      opacity: 0.8,
      fontSize: 15,
      color: '#214a3a',
    },
    ctaWrap: {
      marginTop: 24,
    },
    cta: {
      display: 'inline-block',
      padding: '12px 18px',
      borderRadius: 12,
      background: '#0ea472',
      color: '#ffffff',
      textDecoration: 'none',
      fontWeight: 600,
      transition: 'transform .05s ease, box-shadow .2s ease',
      boxShadow: '0 6px 16px rgba(14,164,114,0.35)',
    } as React.CSSProperties,
  };

  return (
    <>
      <Head>
        <title>{t('success.title')}</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Google Ads conversion event */}
      <Script id="google-conversion" strategy="afterInteractive">
        {`
          (function () {
            try {
              var p = new URLSearchParams(window.location.search);
              var cur = (p.get('currency') || 'PLN').toUpperCase();
              var val = parseFloat(p.get('value') || '1.00');
              if (['PLN','EUR','USD'].indexOf(cur) === -1) cur = 'PLN';
              if (isNaN(val)) val = 1.00;
              if (typeof gtag === 'function') {
                gtag('event', 'conversion', {
                  'send_to': 'AW-17359421838/aSdGcLuCxvgaERxW5O2aJ',
                  'value': val,
                  'currency': cur
                });
              }
            } catch(_) {}
          })();
        `}
      </Script>

      <main style={styles.page}>
        <section style={styles.card}>

          <div style={styles.logoWrap}>
           <img
            src="/logo-dietcare.png"
            alt="Diet Care Platform"
            style={styles.logo}
            />
          </div>

          <h1 style={styles.h1}>{t('success.heading')}</h1>
          <p style={styles.p}>{t('success.activated')}</p>
          <p style={styles.amount}>
            {t('success.amount')}: {value.toFixed(2)} {currency}
          </p>

          <div style={styles.ctaWrap}>
            <Link href="/" style={styles.cta}>
              {t('success.back')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

