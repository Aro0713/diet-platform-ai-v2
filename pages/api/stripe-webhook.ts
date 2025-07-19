import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { generateInvoicePdf } from '@/utils/generateInvoicePdf';
import { generateInvoiceNumber } from '@/utils/generateInvoiceNumber';
import { sendInvoiceEmail } from '@/utils/sendInvoiceEmail';
import { supabase } from '@/lib/supabaseClient';

export const config = {
  api: {
    bodyParser: false, // 🚨 Wymagane do poprawnej weryfikacji podpisu
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const rawBody = await buffer(req);
  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const {
      buyerName,
      buyerAddress,
      buyerNIP,
      service,
      netAmount,
      vatRate,
    } = session.metadata || {};

    const email = session.customer_details?.email || session.customer_email || 'brak@dcp.care';
    const paymentMethod = session.payment_method_types?.[0] === 'card' ? 'Karta' : 'Przelew';
    const paymentDate = new Date().toISOString();
    const lang = session.metadata?.lang === 'en' ? 'en' : 'pl';

    const invoiceNumber = await generateInvoiceNumber();
    const net = parseFloat(netAmount?.toString() || '0');
    const vat = parseFloat(vatRate?.toString() || '0.23');

    const pdfBuffer = await generateInvoicePdf({
      buyerName,
      buyerAddress,
      buyerNIP,
      email,
      paymentDate,
      paymentMethod,
      service,
      netAmount: net,
      vatRate: vat,
      lang,
    });

    const year = new Date(paymentDate).getFullYear();
    const filename = `${invoiceNumber.replace(/\//g, '-')}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(`${year}/${filename}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return res.status(500).json({ error: 'Upload to Supabase failed' });
    }

    const url = supabase.storage.from('invoices').getPublicUrl(`${year}/${filename}`).data.publicUrl;
    const grossAmount = net + (net * vat);

    await sendInvoiceEmail({
      to: email,
      invoiceNumber,
      url,
      service,
      gross: grossAmount.toFixed(2) + ' zł',
      lang,
    });

    await supabase.from('invoices').insert({
      number: invoiceNumber,
      buyer: buyerName,
      email,
      file_url: url,
      amount: net,
      vat,
      paid_at: paymentDate,
      method: paymentMethod,
    });

    await supabase.from('patients').update({ has_paid: true }).eq('email', email);
  }

  res.status(200).json({ received: true });
}
