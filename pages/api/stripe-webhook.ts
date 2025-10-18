// pages/api/stripe-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { Buffer } from 'buffer';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePdf, type InvoiceData } from '@/utils/generateInvoicePdf';
import { generateInvoiceNumber } from '@/utils/generateInvoiceNumber';
import { sendInvoiceEmail } from '@/utils/sendInvoiceEmail';

export const config = {
  api: { bodyParser: false },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← service role key
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // 0) Weryfikacja podpisu (raw body!)
  let event: Stripe.Event;
  try {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err?.message);
    return res.status(400).send(`Webhook Error: ${err?.message}`);
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ ok: true, ignored: event.type });
  }

  console.log('📥 Webhook received: checkout.session.completed');
  const session = event.data.object as Stripe.Checkout.Session;

  // 1) Minimalna walidacja danych z sesji
  if (!session.customer_email || !session.metadata?.plan) {
    console.error('❌ Missing metadata or email – cannot activate subscription');
    return res.status(200).json({ ok: true, skipped: 'missing-email-or-plan' });
  }

  // 2) Dane wspólne
  const email = session.customer_email;
  const plan = session.metadata.plan;

  const buyerName =
    session.metadata?.buyerName || session.customer_details?.name || 'Nieznany klient';
  const buyerAddress = session.metadata?.buyerAddress || 'Brak adresu';
  const buyerNIP = session.metadata?.buyerNIP || '';
  const service = session.metadata?.service || 'Usługa DCP';

  const paymentMethod = session.payment_method_types?.[0] === 'card' ? 'Karta' : 'Przelew';
  const paymentDate = new Date().toISOString();
  const lang = (session.metadata?.lang === 'en' ? 'en' : 'pl') as 'pl' | 'en';

  // Stripe daje walutę jako string; zawęź do unii wymaganej przez InvoiceData
  const rawCurrency = (session.currency ?? 'pln').toUpperCase();
  const allowed = ['PLN', 'EUR', 'USD'] as const;
  type Currency3 = typeof allowed[number];
  const currency3: Currency3 = (allowed as readonly string[]).includes(rawCurrency)
    ? (rawCurrency as Currency3)
    : 'PLN';

  // Kwoty (centy/grosze → zł)
  const grossAmount = (session.amount_total ?? 0) / 100;
  const netAmount = grossAmount; // VAT zw
  const vatAmount = 0;

  // 3) ⛳ PRIORYTET: aktywacja subskrypcji (pacjent „wpuszczony” natychmiast)
  try {
    const start = new Date();
    const end = new Date();
    switch (plan) {
      case '7d':  end.setDate(start.getDate() + 7);   break;
      case '30d': end.setDate(start.getDate() + 30);  break;
      case '90d': end.setDate(start.getDate() + 90);  break;
      case '365d':end.setDate(start.getDate() + 365); break;
      default:    end.setDate(start.getDate() + 7);   break;
    }

    const { error: updatePatientsError } = await supabase
      .from('patients')
      .update({
        subscription_status: plan,
        subscription_started_at: start.toISOString(),
        subscription_expires_at: end.toISOString(),
      })
      .eq('email', email);

    if (updatePatientsError) {
      console.error('⚠️ Update patients failed:', updatePatientsError.message);
      // nie przerywamy – pacjent może i tak wejść po odświeżeniu widoku
    }

    const { error: updateUsersError } = await supabase
      .from('users')
      .update({
        plan: plan === '365d' ? 'pro_annual' : 'pro_monthly',
        subscription_start: start.toISOString(),
        subscription_end: end.toISOString(),
      })
      .eq('email', email);

    if (updateUsersError) {
      console.error('⚠️ Update users failed:', updateUsersError.message);
    }

    console.log(`✅ Subscription activated: plan=${plan} for ${email}`);
  } catch (e: any) {
    console.error('⚠️ Subscription activation error (non-blocking):', e?.message);
  }

  // 4) Numer faktury — bez RPC (używamy Twojego fallbacku)
  let invoiceNumber = 'UNASSIGNED';
  try {
    invoiceNumber = await generateInvoiceNumber(); // np. "7/DCP/2025"
  } catch (e: any) {
    console.error('⚠️ Invoice numbering failed (non-blocking):', e?.message);
  }

  // 5) PDF — best-effort (błąd nie blokuje)
  let fileUrl: string | null = null;
  try {
   const invoiceData: InvoiceData = {
  buyerName,
  buyerAddress,
  buyerNIP: buyerNIP || undefined,
  email,
  paymentDate,
  paymentMethod,
  placeOfIssue: session.metadata?.placeOfIssue || 'Zdzieszowice',
  items: [
    {
      name: service,
      quantity: 1,
      unit: 'pcs',
      unitPrice: netAmount, // netto = brutto (VAT zw)
      vatRate: 0,
    },
  ],
  lang,
  currency: currency3,          // 'PLN' | 'EUR' | 'USD'
  issuedBy: 'Diet Care Platform'
};

    console.log('🧾 Dane do faktury:', invoiceData);
    const pdfBuffer = await generateInvoicePdf(invoiceData);

    const year = new Date(paymentDate).getFullYear();
    const filename = `${invoiceNumber.replace(/\//g, '-')}.pdf`;
    const fileBody = Buffer.from(pdfBuffer);

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(`${year}/${filename}`, fileBody, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('⚠️ Upload to storage failed (non-blocking):', uploadError.message);
    } else {
      fileUrl = supabase.storage.from('invoices').getPublicUrl(`${year}/${filename}`).data.publicUrl;
    }
  } catch (e: any) {
    console.error('⚠️ PDF generation failed (non-blocking):', e?.message);
  }

  // 6) Zapis rekordu w public.invoices — tylko istniejące kolumny!
  try {
    const { error: insertError } = await supabase.from('invoices').insert({
      number: invoiceNumber,   // jeśli masz DB-trigger numeracji, możesz pominąć
      buyer: buyerName,
      email,
      file_url: fileUrl,
      amount: grossAmount,     // BRUTTO
      vat: 0,                  // VAT zw
      currency: currency3,     // text w DB; tutaj strict union → bez błędu TS
      paid_at: paymentDate,
      method: paymentMethod,
      user_id: null,
      // UWAGA: NIE wysyłamy tax_note – w tabeli jej nie ma
    });
    if (insertError) console.error('⚠️ Insert invoice failed (non-blocking):', insertError.message);
  } catch (e: any) {
    console.error('⚠️ Insert invoice threw (non-blocking):', e?.message);
  }

  // 7) E-mail z linkiem do PDF — też best-effort
  try {
    await sendInvoiceEmail({
      to: email,
      invoiceNumber,
      url: fileUrl ?? '',
      service,
      gross: `${grossAmount.toFixed(2)} ${currency3}`,
      lang,
    });
  } catch (e: any) {
    console.error('⚠️ sendInvoiceEmail failed (non-blocking):', e?.message);
  }

  // 8) ZAWSZE 200 → Stripe nie retryuje, pacjent pozostaje aktywny
  return res.status(200).json({ received: true, ok: true });
}
