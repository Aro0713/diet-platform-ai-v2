import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { tUI, type LangKey, languageLabels } from '@/utils/i18n';
import 'react-international-phone/style.css';

const planPrices = {
  '7d': 12900,
  '30d': 24900,
  '90d': 59900,
  '365d': 129900
} as const;

type PlanKey = keyof typeof planPrices;

export default function PaymentPage() {
  const router = useRouter();
  const [lang, setLang] = useState<LangKey>('pl');
  const [userId, setUserId] = useState<string>('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    nip: '',
    region: 'PL' // domyślnie
  });
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang') as LangKey;
    if (storedLang) setLang(storedLang);

    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data?.session?.user?.id;
      if (!uid) return;
      setUserId(uid);
      const { data: patient } = await supabase
        .from('patients')
        .select('name, email, address, nip, region')
        .eq('user_id', uid)
        .maybeSingle();
      if (patient) {
        setForm({
          name: patient.name || '',
          email: patient.email || '',
          address: patient.address || '',
          nip: patient.nip || '',
          region: patient.region || 'PL'
        });
      }
    });
  }, []);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  if (!selectedPlan) {
    alert(tUI('selectPlanFirst', lang));
    return;
  }

  // jawne zawężenie typu (TS już wie, że to nie null)
  const plan = selectedPlan as PlanKey;
  const price = planPrices[plan];

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
    window.location.href = url;
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur text-white p-6">
      <nav className="flex justify-between mb-8">
        <select
          value={lang}
          onChange={(e) => {
            const val = e.target.value as LangKey;
            setLang(val);
            localStorage.setItem('platformLang', val);
          }}
          className="bg-white text-black px-3 py-1 rounded"
        >
          {Object.entries(languageLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </nav>

     <h1 className="text-2xl font-normal text-center mb-6">
    {tUI('choosePlan', lang)}
    </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {planOptions.map(plan => (
            <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id as any)}
                className={`cursor-pointer rounded-lg p-4 border ${
                selectedPlan === plan.id
                    ? 'border-green-400 bg-green-900/40'
                    : 'border-white/20 bg-white/10'
                }`}
            >
                <h2 className="text-xl font-bold mb-1">{plan.title}</h2>
                <p className="text-sm text-emerald-300 mb-2">
                {planPrices[plan.id]} PLN <span className="text-xs text-white/60">({tUI('vatIncluded', lang)})</span>
                </p>
                <p className="text-sm whitespace-pre-line">{plan.description}</p>
            </div>
            ))}
        </div>

        <button
          type="submit"
          disabled={!selectedPlan || isLoading}
          className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          {tUI('payNow', lang)}
        </button>
      </form>
    </main>
  );
}
