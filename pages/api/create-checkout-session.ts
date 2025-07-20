import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('❌ STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
 apiVersion: '2025-06-30.basil'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const {
    buyerName,
    buyerAddress,
    buyerNIP,
    email,
    lang = 'pl',
    service = 'Plan diety 7 dni',
    price = 12900
  } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      locale: lang,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'pln',
            unit_amount: price,
            product_data: {
              name: service
            }
          }
        }
      ],
      metadata: {
        buyerName,
        buyerAddress,
        buyerNIP: buyerNIP || '',
        service,
        netAmount: (price / 1.23 / 100).toFixed(2),
        vatRate: '0.23',
        lang
      },
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('❌ Stripe session error:', err);
    res.status(500).json({ error: err.message });
  }
}
