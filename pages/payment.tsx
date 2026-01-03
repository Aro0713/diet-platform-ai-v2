import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { tUI, type LangKey, languageLabels } from '@/utils/i18n';
import 'react-international-phone/style.css';
import { openCheckout } from '../src/native/browser';

const planPrices = {
  '7d': 2900,    // 29 PLN
  '30d': 4900,   // 49 PLN
  '90d': 14500,  // 145 PLN
  '365d': 49900  // 499 PLN
} as const;


type PlanKey = keyof typeof planPrices;

// PROMO: 30-day diabetes discount 14.11 → 14.12
const PROMO_START = new Date(2025, 10, 14); // 14.11.2025
const PROMO_END   = new Date(2025, 11, 14); // 14.12.2025

const isPromoDate = (d: Date) => d >= PROMO_START && d <= PROMO_END;

// Cena planu w groszach, z uwzględnieniem promocji
function getPlanPrice(planId: PlanKey): number {
  const base = planPrices[planId];
  if (planId === '30d' && isPromoDate(new Date())) {
    return 4900; // 49,00 PLN w czasie promocji
  }
  return base;
}

const currencyByCountry = (country: string): 'pln' | 'eur' | 'usd' => {
  if (country === 'PL') return 'pln';
  const eu = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'GR', 'IE', 'PT', 'LU', 'SK', 'SI', 'LV', 'LT', 'EE', 'CY', 'MT', 'HR'];
  return eu.includes(country) ? 'eur' : 'usd';
};

        export default function PaymentPage() {
        const router = useRouter();
        const [lang, setLang] = useState<LangKey>('pl');
        const [userId, setUserId] = useState<string>('');
        const [form, setForm] = useState({
            name: '',
            email: '',
            address: '',
            nip: '',
            region: 'PL'
        });
        const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
        const [isLoading, setIsLoading] = useState(false);
        const [exchangeRates, setExchangeRates] = useState({ eur: 1, usd: 1 });

        useEffect(() => {
        const storedLang = localStorage.getItem('platformLang') as LangKey;
        if (storedLang) setLang(storedLang);

        supabase.auth.getSession().then(async ({ data }) => {
            const uid = data?.session?.user?.id;
            const userEmail = data?.session?.user?.email || '';
            if (!uid) return;

            setUserId(uid);

            const { data: patient } = await supabase
            .from('patients')
            .select('name, email, address, nip, region')
            .eq('user_id', uid)
            .maybeSingle();

            setForm({
            name: patient?.name || '',
            email: patient?.email || userEmail,
            address: patient?.address || '',
            nip: patient?.nip || '',
            region: patient?.region || 'PL'
            });
        });

        fetch('https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json')
            .then(res => res.json())
            .then(data => setExchangeRates(prev => ({ ...prev, eur: data.rates[0].mid })));

        fetch('https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json')
            .then(res => res.json())
            .then(data => setExchangeRates(prev => ({ ...prev, usd: data.rates[0].mid })));
        }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      alert(tUI('selectPlanFirst', lang));
      return;
    }

  const plan = selectedPlan as PlanKey;
const price = getPlanPrice(plan);


    setIsLoading(true);

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        plan,
        price,
        service: tUI(`plan${plan}`, lang),
        userId,
        lang,
        country: form.region || 'PL'
      })
    });

    const { url } = await res.json();

    if (url) {
  await openCheckout(url);
} else {
  alert(tUI('paymentInitError', lang));
}

    setIsLoading(false);
  };

  const planOptions: { id: PlanKey; title: string; description: string }[] = [
    {
      id: '7d',
      title: tUI('plan7d', lang),
      description: tUI('plan7dDesc', lang)
    },
    {
      id: '30d',
      title: tUI('plan30d', lang),
      description: tUI('plan30dDesc', lang)
    },
    {
      id: '90d',
      title: tUI('plan90d', lang),
      description: tUI('plan90dDesc', lang)
    },
    {
      id: '365d',
      title: tUI('plan365d', lang),
      description: tUI('plan365dDesc', lang)
    }
  ];

  const displayPrice = (planId: PlanKey) => {
    const base = getPlanPrice(planId);
    const currency = currencyByCountry(form.region.toUpperCase());
    if (currency === 'pln') return `${(base / 100).toFixed(2)} PLN`;
    const rate = exchangeRates[currency];
    if (!rate || isNaN(rate) || rate <= 0) return `${(base / 100).toFixed(2)} PLN`;
    const converted = (base / 100 / rate).toFixed(2);
    return `${converted} ${currency.toUpperCase()} (${(base / 100).toFixed(2)} PLN)`;
  };

  const handlePay = async () => {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // JEŚLI Twój endpoint wymaga danych (np. planId), dodaj je tutaj:
      // body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    const url =
      data.url ??
      data.sessionUrl ??
      data.checkoutUrl ??
      data.checkout_url;

    if (!url) throw new Error('Brak URL do Checkout');
    await openCheckout(url); // w app otworzy SFSafariView/Custom Tab; w web zrobi window.location
  } catch (e) {
    console.error('Nie udało się otworzyć płatności:', e);
    alert('Nie udało się otworzyć płatności.');
  }
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur text-white px-4 py-6 md:p-6 overflow-x-hidden">
      <nav className="flex items-center justify-between mb-6 md:mb-8 gap-3">
        <select
          value={lang}
          onChange={(e) => {
            const val = e.target.value as LangKey;
            setLang(val);
            localStorage.setItem('platformLang', val);
          }}
          className="bg-white text-black text-sm px-3 py-2 rounded w-auto"
        >
          {Object.entries(languageLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <button
          onClick={() => {
            const current = document.documentElement.classList.contains('dark');
            document.documentElement.classList.toggle('dark', !current);
            localStorage.setItem('theme', !current ? 'dark' : 'light');
          }}
          className="ml-auto text-sm text-white/80 hover:text-white"
        >
          {tUI('toggleContrast', lang)}
        </button>
      </nav>

      <h1 className="text-xl md:text-2xl font-semibold text-center mb-4 md:mb-6">
        {tUI('choosePlan', lang)}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
          {planOptions.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`cursor-pointer rounded-lg p-4 md:p-5 border transition-colors ${
                selectedPlan === plan.id
                  ? 'border-green-400 bg-green-900/40'
                  : 'border-white/20 bg-white/10'
              }`}
            >
              <h2 className="text-lg md:text-xl font-bold mb-1">{plan.title}</h2>
              <p className="text-sm text-emerald-300 mb-2">
            {displayPrice(plan.id)} <span className="text-xs text-white/60">({tUI('vatExemptNote', lang)})</span>
            </p>
              <p className="text-sm whitespace-pre-line">{plan.description}</p>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={!selectedPlan || isLoading}
          className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 md:py-2 px-4 rounded-lg disabled:opacity-50 text-base md:text-lg font-semibold"
        >
          {tUI('payNow', lang)}
        </button>
      </form>
    </main>
  );
}
