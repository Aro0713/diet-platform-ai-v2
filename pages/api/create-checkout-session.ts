import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ceny brutto w groszach (PLN) i centach (USD/EUR)
const priceMap: Record<string, Record<'pln' | 'usd' | 'eur', number>> = {
  '7d': {
    pln: 2900,   // 29 PLN
    usd: 700,    // ~7 USD
    eur: 650,    // ~6.5 EUR
  },
  '30d': {
    pln: 4900,   // 49 PLN
    usd: 1200,   // ~12 USD
    eur: 1100,   // ~11 EUR
  },
  '90d': {
    pln: 14500,  // 145 PLN
    usd: 3500,   // ~35 USD
    eur: 3300,   // ~33 EUR
  },
  '365d': {
    pln: 49900,  // 499 PLN
    usd: 12000,  // ~120 USD
    eur: 11000,  // ~110 EUR
  },
};


const euCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'FI', 'GR', 'IE', 'PT', 'LU', 'SK', 'SI', 'LV', 'LT', 'EE', 'CY', 'MT', 'HR'];
const currencyByCountry = (countryCode: string): 'pln' | 'eur' | 'usd' => {
  if (countryCode === 'PL') return 'pln';
  if (euCountries.includes(countryCode)) return 'eur';
  return 'usd';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

    try {
    const {
      name: buyerName,
      address: buyerAddress,
      nip: buyerNIP,
      email,
      lang,
      service,
      plan,
      userId,
      country // np. 'PL', 'US', 'DE'
    } = req.body;

    // log wejścia
    console.log('🧾 Received request to create checkout session:', {
      email, plan, userId, country
    });

    // Walidacja danych wejściowych
    if (!plan || !email || !userId || !country) {
      console.warn('❌ Missing required fields:', { plan, email, userId, country });
      return res.status(400).json({ error: 'Missing required fields' });
    }

       const currency = currencyByCountry(country.toUpperCase());
    const price = priceMap[plan]?.[currency];

    if (!price) {
      console.warn('❌ Invalid plan or country combination:', { plan, currency });
      return res.status(400).json({ error: 'Invalid plan or country' });
    }

    console.log('💳 Creating checkout session', {
      plan,
      mode: plan === '30d' ? 'subscription' : 'payment',
      currency,
    });

    const vatRate = 0;
    const netAmount = price / 100;

          // ===============================
    // PLAN 30D → SUBSCRIPTION + 7-DAY TRIAL
    // ===============================
if (plan === '30d') {
  // 🚫 blokada ponownego triala – sprawdzamy w patients.trial_used
  const { data: p, error: pErr } = await supabaseAdmin
    .from('patients')
    .select('trial_used')
    .eq('user_id', userId)
    .maybeSingle();

  if (pErr) console.warn('⚠️ trial_used check failed:', pErr.message);

  const canTrial = !(p?.trial_used === true);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: 'price_1SmZmeLJvnGlkuM9f8WUhhOc',
        quantity: 1,
      },
    ],
    subscription_data: canTrial ? { trial_period_days: 7 } : {},
    customer_email: email,
    metadata: {
      userId,
      buyerName,
      buyerAddress,
      buyerNIP,
      email,
      lang: lang || 'pl',
      plan,
      service: service || 'Plan diety',
      currency,
      trialDays: canTrial ? '7' : '0',
      canTrial: String(canTrial),
    },
    success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.origin}/panel-patient?payment=cancel`,
  });

  console.log(`✅ Stripe subscription session created: ${session.id} canTrial=${canTrial}`);
  return res.status(200).json({ url: session.url });
}

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: service || 'Plan diety',
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId,
        buyerName,
        buyerAddress,
        buyerNIP,
        email,
        lang: lang || 'pl',
        plan,
        service: service || 'Plan diety',
        currency,
        netAmount: netAmount.toFixed(2),
        vatRate: 'zw'
      },
      
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/panel-patient?payment=cancel`,
    });

    console.log(`✅ Stripe session created: ${session.id}`);
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('❌ Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
