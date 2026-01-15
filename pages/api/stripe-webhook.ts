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

const relevant = new Set([
  'checkout.session.completed',
  'invoice.paid',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

if (!relevant.has(event.type)) {
  return res.status(200).json({ ok: true, ignored: event.type });
}
  // ✅ PAID / ACTIVATION (moment pobrania opłaty po trialu)
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;

    const subscriptionId =
      typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription?.id;

    const customerId =
      typeof (invoice as any).customer === 'string'
        ? (invoice as any).customer
        : (invoice as any).customer?.id;

    if (!subscriptionId || !customerId) {
      console.warn('⚠️ invoice.paid missing subscription/customer', { subscriptionId, customerId });
      return res.status(200).json({ ok: true, skipped: 'missing-sub-or-customer' });
    }

    // Stripe = źródło prawdy (status + okres rozliczeniowy)
    const subResp = await stripe.subscriptions.retrieve(subscriptionId);
    const sub = subResp as unknown as Stripe.Subscription;

    const status = sub.status; // zwykle 'active' po invoice.paid
    const cps = (sub as any).current_period_start as number | undefined;
    const cpe = (sub as any).current_period_end as number | undefined;

    const periodStart = cps ? new Date(cps * 1000).toISOString() : new Date().toISOString();
    const periodEnd = cpe ? new Date(cpe * 1000).toISOString() : null;

    // ✅ update pacjenta po customer_id (najpewniej)
    let updated = false;

    const { error: updByCustomer } = await supabase
      .from('patients')
      .update({
        subscription_status: status,
        subscription_started_at: periodStart,
        subscription_expires_at: periodEnd,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('stripe_customer_id', customerId);

    if (!updByCustomer) updated = true;

    // fallback po subscription_id
    if (!updated) {
      const { error: updBySub } = await supabase
        .from('patients')
        .update({
          subscription_status: status,
          subscription_started_at: periodStart,
          subscription_expires_at: periodEnd,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (updBySub) console.error('⚠️ invoice.paid update patients failed:', updBySub.message);
      else updated = true;
    }
    // 🧯 FINAL FALLBACK: po email z customer (gdy rekord nie był jeszcze spięty)
    if (!updated) {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const emailFromCustomer = (customer as any)?.email;

      if (emailFromCustomer) {
        const { error: updByEmail } = await supabase
          .from('patients')
          .update({
            subscription_status: status,
            subscription_started_at: periodStart,
            subscription_expires_at: periodEnd,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq('email', emailFromCustomer);

        if (updByEmail) {
          console.error('⚠️ invoice.paid update by email failed:', updByEmail.message);
        } else {
          updated = true;
        }
      }
    }

    // (opcjonalnie) users
    const { error: updUsers } = await supabase
      .from('users')
      .update({
        subscription_status: status,
        subscription_start: periodStart,
        subscription_end: periodEnd,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('stripe_customer_id', customerId);

    if (updUsers) console.warn('⚠️ invoice.paid update users warn:', updUsers.message);

    console.log('✅ invoice.paid -> Supabase updated:', {
      subscriptionId,
      customerId,
      status,
      periodEnd,
      updated,
    });

    return res.status(200).json({ ok: true, invoice_paid: true, status, periodEnd });
  }

  // ✅ STATUS SYNC (trial -> active, active -> past_due, cancel_at_period_end, itd.)
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;

    const customerId =
      typeof (sub as any).customer === 'string'
        ? (sub as any).customer
        : (sub as any).customer?.id;

    const cps = (sub as any).current_period_start as number | undefined;
    const cpe = (sub as any).current_period_end as number | undefined;

    const periodStart = cps ? new Date(cps * 1000).toISOString() : null;
    const periodEnd = cpe ? new Date(cpe * 1000).toISOString() : null;

    const { error: upd } = await supabase
      .from('patients')
      .update({
        subscription_status: sub.status,
        subscription_started_at: periodStart,
        subscription_expires_at: periodEnd,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
      })
      .eq('stripe_customer_id', customerId || '');

    if (upd) {
      // fallback po subscription_id
      const { error: upd2 } = await supabase
        .from('patients')
        .update({
          subscription_status: sub.status,
          subscription_started_at: periodStart,
          subscription_expires_at: periodEnd,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
        })
        .eq('stripe_subscription_id', sub.id);

      if (upd2) console.error('⚠️ subscription.updated update failed:', upd2.message);
    }

    console.log('✅ subscription.updated -> Supabase synced:', {
      subId: sub.id,
      customerId,
      status: sub.status,
      periodEnd,
    });

    return res.status(200).json({ ok: true, sub_updated: true, status: sub.status, periodEnd });
  }

  // ✅ CANCEL SUBSCRIPTION (blokada dostępu + blokada ponownego triala)
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;

    const customerId =
      typeof (sub as any).customer === 'string'
        ? (sub as any).customer
        : (sub as any).customer?.id;

    // trial end (zostawiamy w DB, nawet jeśli user anulował)
    const te = (sub as any).trial_end as number | null | undefined;
    const trialEndIso = te ? new Date(te * 1000).toISOString() : null;

    // ✅ aktualizujemy patients po stripe_subscription_id (najpewniejsze)
    const { data: patient, error: findErr } = await supabase
      .from('patients')
      .select('id, trial_ends_at')
      .eq('stripe_subscription_id', sub.id)
      .maybeSingle();

    if (findErr) {
      console.error('⚠️ patients lookup by stripe_subscription_id failed:', findErr.message);
      return res.status(200).json({ ok: true, lookup_failed: true });
    }

    if (!patient?.id) {
      // fallback: po customer_id
      const { data: patient2, error: findErr2 } = await supabase
        .from('patients')
        .select('id, trial_ends_at')
        .eq('stripe_customer_id', customerId || '')
        .maybeSingle();

      if (findErr2) console.error('⚠️ patients lookup by stripe_customer_id failed:', findErr2.message);

      if (!patient2?.id) {
        console.warn('⚠️ No patient found for canceled subscription:', { subId: sub.id, customerId });
        return res.status(200).json({ ok: true, skipped: 'no-patient' });
      }

      const { error: upd2 } = await supabase
        .from('patients')
        .update({
          subscription_status: 'canceled',     // 👈 blokuje dostęp od razu
          trial_used: true,                   // 👈 blokada ponownego triala
          trial_canceled_at: new Date().toISOString(),
          // zostaw trial_ends_at (jeśli null, ustaw z Stripe)
          ...(patient2.trial_ends_at ? {} : { trial_ends_at: trialEndIso }),
        })
        .eq('id', patient2.id);

      if (upd2) console.error('⚠️ patients update cancel failed:', upd2.message);
      return res.status(200).json({ ok: true, canceled: true });
    }

    // primary update (patient found by subscription_id)
    const { error: upd } = await supabase
      .from('patients')
      .update({
        subscription_status: 'canceled',     // 👈 blokuje dostęp od razu
        trial_used: true,                   // 👈 blokada ponownego triala
        trial_canceled_at: new Date().toISOString(),
        ...(patient.trial_ends_at ? {} : { trial_ends_at: trialEndIso }),
      })
      .eq('id', patient.id);

    if (upd) console.error('⚠️ patients update cancel failed:', upd.message);

    console.log('✅ Subscription canceled -> access blocked, trial locked:', { subId: sub.id });
    return res.status(200).json({ ok: true, canceled: true });
  }

  console.log('📥 Webhook received: checkout.session.completed');
  const session = event.data.object as Stripe.Checkout.Session;
  // ✅ TRIAL / SUBSCRIPTION (Plan 30d)
  // Jeśli Checkout był w trybie subscription, nie wystawiamy faktury tutaj.
  if (session.mode === 'subscription' && session.subscription) {
    // Minimalna walidacja
    if (!session.customer_email || !session.metadata?.plan) {
      console.error('❌ Missing metadata or email – cannot set trial');
      return res.status(200).json({ ok: true, skipped: 'missing-email-or-plan' });
    }

    const email = session.customer_email;
    const plan = session.metadata.plan;
   // ❗️Plan 30d jest subscription (trial) – nie obsługujemy go jako one-time


    const subId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as any).id;

    const subResp = await stripe.subscriptions.retrieve(subId);
    const sub = subResp as unknown as Stripe.Subscription;

    const status = sub.status; // 'trialing' / 'active' / ...
    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
    const cps = (sub as any).current_period_start as number | undefined;
    const cpe = (sub as any).current_period_end as number | undefined;

    const periodStart = cps ? new Date(cps * 1000).toISOString() : new Date().toISOString();
    const periodEnd = cpe
  ? new Date(cpe * 1000).toISOString()
  : (trialEnd ?? null);


    const stripeCustomerId =
      typeof sub.customer === 'string' ? sub.customer : (sub.customer as any).id;

    // ✅ Zapis do Supabase: trial info
    const { error: pErr } = await supabase
      .from('patients')
      .update({
        plan,
        subscription_status: status,
        subscription_started_at: periodStart,
        subscription_expires_at: periodEnd,
        trial_ends_at: trialEnd,
        trial_used: true, // ✅ BLOKADA PONOWNEGO TRIALA (od startu)
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: sub.id,
      })

      .eq('email', email);

    if (pErr) console.error('⚠️ Update patients trial failed:', pErr.message);

    // (opcjonalnie) users
    const { error: uErr } = await supabase
      .from('users')
      .update({
        plan,
        subscription_status: status,
        subscription_start: periodStart,
        subscription_end: periodEnd,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: sub.id,
      })
      .eq('email', email);

    if (uErr) console.error('⚠️ Update users trial failed:', uErr.message);

    console.log(`✅ Trial saved in Supabase: ${email} status=${status} trialEnd=${trialEnd}`);

    // ❗️WAŻNE: nie generujemy faktury na trialu
    return res.status(200).json({ received: true, ok: true, trial: true });
  }

  // 1) Minimalna walidacja danych z sesji
  if (!session.customer_email || !session.metadata?.plan) {
    console.error('❌ Missing metadata or email – cannot activate subscription');
    return res.status(200).json({ ok: true, skipped: 'missing-email-or-plan' });
  }

  // 2) Dane wspólne
  const email = session.customer_email;
  const plan = session.metadata.plan;
  if (plan === '30d') {
  console.log('ℹ️ Skipping legacy one-time flow for plan 30d (subscription-based).');
  return res.status(200).json({ ok: true, skipped: '30d-legacy-flow' });
}

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
        plan: plan,
        subscription_status: 'active',
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
      plan: plan,
      subscription_status: 'active',
      subscription_started_at: start.toISOString(),
      subscription_expires_at: end.toISOString(),
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
