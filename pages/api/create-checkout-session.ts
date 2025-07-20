import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});

// ceny brutto w groszach (lub centach dla USD)
const priceMap: Record<string, Record<'pln' | 'usd' | 'eur', number>> = {
  '7d': { pln: 12900, usd: 1500, eur: 1400 },
  '30d': { pln: 24900, usd: 3000, eur: 2800 },
  '90d': { pln: 59900, usd: 8000, eur: 7500 },
  '365d': { pln: 129900, usd: 29000, eur: 27000 },
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
      buyerName,
      buyerAddress,
      buyerNIP,
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

    const vatRate = 0.23;
    const netAmount = currency === 'pln'
      ? price / 100 / (1 + vatRate)
      : price / 100;

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
        vatRate: currency === 'pln' ? vatRate.toFixed(2) : '0'
      },
      success_url: `${req.headers.origin}/panel-patient?payment=success`,
      cancel_url: `${req.headers.origin}/panel-patient?payment=cancel`,
    });

    console.log(`✅ Stripe session created: ${session.id}`);
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('❌ Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
