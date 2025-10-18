// pages/api/stripe-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { Buffer } from 'buffer';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePdf, type InvoiceData } from '@/utils/generateInvoicePdf';
import { sendInvoiceEmail } from '@/utils/sendInvoiceEmail';

export const config = {
  api: { bodyParser: false },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key (RLS bypass na backendzie)
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

  // Waluta
  const rawCurrency = (session.currency ?? 'pln').toUpperCase();
  const allowed = ['PLN', 'EUR', 'USD'] as const;
  type Currency3 = typeof allowed[number];
  const currency3: Currency3 = (allowed as readonly string[]).includes(rawCurrency)
    ? (rawCurrency as Currency3)
    : 'PLN';

  // Kwoty (centy/grosze → zł)
  const grossAmount = (session.amount_total ?? 0) / 100;
  const netAmount = grossAmount; // VAT zw
  // const vatAmount = 0; // niepotrzebne w tym pliku

  // 3) ⛳ PRIORYTET: aktywacja subskrypcji (pacjent „wpuszczony” natychmiast)
  try {
    const start = new Date();
    const end = new Date();
    switch (plan) {
      case '7d':   end.setDate(start.getDate() + 7);   break;
      case '30d':  end.setDate(start.getDate() + 30);  break;
      case '90d':  end.setDate(start.getDate() + 90);  break;
      case '365d': end.setDate(start.getDate() + 365); break;
      default:     end.setDate(start.getDate() + 7);   break;
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

  // 4) 🧾 FAKTURA — idempotencja + numer z DB (trigger/RPC)
  let invoiceId: string | null = null;
  let invoiceNumber = 'UNASSIGNED';

  try {
    // a) idempotencja: czy już jest faktura dla tej sesji?
    const { data: existing, error: selErr } = await supabase
      .from('invoices')
      .select('id, number, file_url')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    if (selErr) console.warn('invoices select by session warn:', selErr.message);

    if (existing) {
      invoiceId = existing.id;
      invoiceNumber = existing.number || 'UNASSIGNED';
      console.log('ℹ️ Invoice already exists for this session:', invoiceNumber);
    } else {
      // b) wstaw nowy rekord — numer nada trigger w DB
      const { data: inv, error: insErr } = await supabase
        .from('invoices')
        .insert({
          buyer: buyerName,
          email,
          amount: grossAmount, // brutto
          vat: 0,
          currency: currency3,
          paid_at: paymentDate,
          method: paymentMethod,
          user_id: null,
          stripe_session_id: session.id,
        })
        .select('id, number')
        .single();

      if (insErr) {
        throw new Error(`invoices.insert failed: ${insErr.message}`);
      }
      invoiceId = inv.id;
      invoiceNumber = inv.number;
      console.log('🧾 New invoice inserted with number:', invoiceNumber);
    }
  } catch (e: any) {
    console.error('⚠️ Invoice DB insert/select error:', e?.message);
    // NIE przerywamy — spróbujemy wygenerować PDF i wysłać maila best-effort
  }

  // 5) PDF — render z numerem z DB → upload → update file_url
  let fileUrl: string | null = null;
  try {
    const invoiceData: InvoiceData = {
      invoiceNumber, // ⬅️ wymagane przez generateInvoicePdf
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
      currency: currency3,
      issuedBy: 'Diet Care Platform',
    };

    console.log('🧾 Dane do faktury (PDF):', invoiceData);
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

      // podbij URL w rekordzie (jeśli mamy id)
      if (invoiceId) {
        const { error: updErr } = await supabase
          .from('invoices')
          .update({ file_url: fileUrl })
          .eq('id', invoiceId);
        if (updErr) console.warn('invoices.update file_url warn:', updErr.message);
      }
    }
  } catch (e: any) {
    console.error('⚠️ PDF generation/upload failed (non-blocking):', e?.message);
  }

  // 6) E-mail z linkiem do PDF — best-effort
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

  // 7) ZAWSZE 200 → Stripe nie retryuje, pacjent pozostaje aktywny
  return res.status(200).json({ received: true, ok: true });
}
