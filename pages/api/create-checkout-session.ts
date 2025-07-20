// pages/api/create-checkout-session.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is missing');
    return res.status(500).json({ error: 'Stripe secret key not found' });
  }

  try {
    const {
      buyerName,
      buyerAddress,
      buyerNIP,
      email,
      lang,
      service,
      price,
    } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: service || 'Plan diety',
            },
            unit_amount: price || 12900, // w groszach (czyli 129,00 PLN)
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        name: buyerName,
        address: buyerAddress,
        nip: buyerNIP,
        lang: lang || 'pl',
      },
      success_url: `${req.headers.origin}/panel-patient?payment=success`,
     cancel_url: `${req.headers.origin}/panel-patient?payment=cancel`,

    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('❌ Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
