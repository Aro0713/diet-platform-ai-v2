import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { generateInvoicePdf } from '@/utils/generateInvoicePdf';
import { generateInvoiceNumber } from '@/utils/generateInvoiceNumber';
import { sendInvoiceEmail } from '@/utils/sendInvoiceEmail';
import { supabase } from '@/lib/supabaseClient';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});
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
    console.log('📥 Webhook received: checkout.session.completed');

    const session = event.data.object as Stripe.Checkout.Session;

    if (!session.metadata || !session.metadata.plan || !session.customer_email) {
      console.error('❌ Missing metadata or email – cannot generate invoice');
      return res.status(400).json({ error: 'Missing required metadata or email' });
    }

    console.log('📦 Metadata:', session.metadata);

    // ✅ Fallbacky dla pól wymaganych do PDF
    const buyerName = session.metadata?.buyerName || session.customer_details?.name || 'Nieznany klient';
    const buyerAddress = session.metadata?.buyerAddress || 'Brak adresu';
    const buyerNIP = session.metadata?.buyerNIP || '';
    const service = session.metadata?.service || 'Usługa DCP';
    const netAmount = session.metadata?.netAmount || '0';
    const vatRate = session.metadata?.vatRate || '0.23';
    const plan = session.metadata?.plan;

    const email = session.customer_email;
    const paymentMethod = session.payment_method_types?.[0] === 'card' ? 'Karta' : 'Przelew';
    const paymentDate = new Date().toISOString();
    const lang = session.metadata?.lang === 'en' ? 'en' : 'pl';
    const currency = (session.currency?.toUpperCase() || 'PLN') as 'PLN' | 'EUR' | 'USD';

    const invoiceNumber = await generateInvoiceNumber();
    const net = parseFloat(netAmount.toString());
    const vat = parseFloat(vatRate.toString());
    const grossAmount = net + net * vat;

    let pdfBuffer;
        try {
        const vat = parseFloat(vatRate);
        const net = parseFloat(netAmount);
        const vatPercent = Math.round(vat * 100); // 0.23 → 23
        const grossAmount = net * (1 + vat);

        const invoiceData = {
            buyerName,
            buyerAddress,
            buyerNIP,
            email,
            paymentDate,
            paymentMethod,
            lang: lang as 'pl' | 'en',
            currency,
            items: [
            {
                name: service,
                quantity: 1,
                unit: 'szt.',
                unitPrice: net,
                vatRate: vatPercent,
            }
            ]
        };

        console.log('🧾 Dane do faktury:', invoiceData);

        pdfBuffer = await generateInvoicePdf(invoiceData);
        } catch (err: any) {
  console.error('❌ Błąd generowania PDF:', err.message);
  console.error('📄 Stack:', err.stack);
  return res.status(500).json({
    error: 'PDF generation failed',
    message: err.message,
    stack: err.stack
  });
}

    const year = new Date(paymentDate).getFullYear();
    const filename = `${invoiceNumber.replace(/\//g, '-')}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(`${year}/${filename}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
      return res.status(500).json({ error: 'Upload to Supabase failed' });
    }

    const url = supabase.storage.from('invoices').getPublicUrl(`${year}/${filename}`).data.publicUrl;

    await sendInvoiceEmail({
      to: email,
      invoiceNumber,
      url,
      service,
      gross: `${grossAmount.toFixed(2)} ${currency}`,
      lang,
    });

const { error: insertError } = await supabase
  .from('invoices')
  .insert({
    number: invoiceNumber,
    buyer: buyerName,
    email,
    file_url: url,
    amount: net,
    vat,
    paid_at: paymentDate,
    method: paymentMethod,
    user_id: null, // 👈 DODANE!
  });

if (insertError) {
  console.error('❌ Insert error:', insertError.message);
  return res.status(500).json({ error: 'Insert to invoices failed', message: insertError.message });
}

    const start = new Date();
    const end = new Date();
    switch (plan) {
      case '7d': end.setDate(start.getDate() + 7); break;
      case '30d': end.setDate(start.getDate() + 30); break;
      case '90d': end.setDate(start.getDate() + 90); break;
      case '365d': end.setDate(start.getDate() + 365); break;
      default: end.setDate(start.getDate() + 7); break;
    }

        const { error: updateError } = await supabase
        .from('patients')
        .update({
            subscription_status: plan,
            subscription_started_at: start.toISOString(),
            subscription_expires_at: end.toISOString(),
        })
        .eq('email', email);

        if (updateError) {
        console.error('❌ Update error (patients):', updateError.message);
        return res.status(500).json({
            error: 'Update patients failed',
            message: updateError.message,
        });
        } else {
        console.log(`✅ Plan: ${plan}, start: ${start.toISOString()}, koniec: ${end.toISOString()} dla ${email}`);
        }
        }

        res.status(200).json({ received: true });
        }
