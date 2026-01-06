import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, returnUrl } = req.body as {
      userId?: string;
      returnUrl?: string;
    };

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // 🔍 Pobierz Stripe customer ID pacjenta
    const { data: patient, error } = await supabase
      .from('patients')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!patient?.stripe_customer_id) {
      return res.status(400).json({
        error: 'No Stripe customer associated with this user',
      });
    }

    // 🔁 Utwórz sesję Customer Portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: patient.stripe_customer_id,
      return_url: returnUrl || `${req.headers.origin}/panel-patient`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err: any) {
    console.error('❌ create-portal-session error:', err?.message);
    return res.status(500).json({
      error: err?.message || 'Internal Server Error',
    });
  }
}
