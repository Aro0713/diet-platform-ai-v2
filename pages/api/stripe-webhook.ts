// pages/api/stripe-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { generateInvoicePdf } from '@/utils/generateInvoicePdf';
import { generateInvoiceNumber } from '@/utils/generateInvoiceNumber'; // fallback
import { sendInvoiceEmail } from '@/utils/sendInvoiceEmail';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let event: Stripe.Event;

  try {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err?.message);
    return res.status(400).send(`Webhook Error: ${err?.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    console.log('📥 Webhook received: checkout.session.completed');

    const session = event.data.object as Stripe.Checkout.Session;

    // Wymagane do obsługi abonamentu i faktury
    if (!session.metadata || !session.metadata.plan || !session.customer_email) {
      console.error('❌ Missing metadata or email – cannot generate invoice');
      return res.status(400).json({ error: 'Missing required metadata or email' });
    }

    const plan = session.metadata.plan;
    const email = session.customer_email;

    // Dane nabywcy (z metadanych lub z obiektu klienta)
    const buyerName =
      session.metadata?.buyerName || session.customer_details?.name || 'Nieznany klient';
    const buyerAddress = session.metadata?.buyerAddress || 'Brak adresu';
    const buyerNIP = session.metadata?.buyerNIP || '';
    const service = session.metadata?.service || 'Usługa DCP';

    const paymentMethod =
      session.payment_method_types?.[0] === 'card' ? 'Karta' : 'Przelew';
    const paymentDate = new Date().toISOString();
    const lang = session.metadata?.lang === 'en' ? 'en' : 'pl';
    const currency = (session.currency?.toUpperCase() || 'PLN') as 'PLN' | 'EUR' | 'USD';

    // ─────────────────────────────────────────────────────────────────────────
    // KWOTY: BRUTTO z Stripe, VAT=0 (zwolnienie – art. 43 ust. 1 pkt 19)
    // ─────────────────────────────────────────────────────────────────────────
    const grossAmount = (session.amount_total ?? 0) / 100; // Stripe zwraca w centach/groszach
    const vatRate = 0;
    const vatAmount = 0;
    const netAmount = grossAmount; // przy VAT=0 netto = brutto

    // ─────────────────────────────────────────────────────────────────────────
    // NUMERACJA: RPC next_invoice_number (gapless) z fallbackiem
    // ─────────────────────────────────────────────────────────────────────────
    let invoiceNumber: string | null = null;

    try {
      const { data: rpcNum, error: rpcErr } = await supabase.rpc('next_invoice_number', {
        p_prefix: 'DCP',
        p_date: new Date().toISOString(),
      });

      if (rpcErr) {
        console.warn('⚠️ next_invoice_number RPC failed, fallback to generateInvoiceNumber:', rpcErr.message);
        invoiceNumber = await generateInvoiceNumber();
      } else {
        invoiceNumber = rpcNum as string;
      }
    } catch (e: any) {
      console.warn('⚠️ RPC error (exception), fallback to generateInvoiceNumber:', e?.message);
      invoiceNumber = await generateInvoiceNumber();
    }

    if (!invoiceNumber) {
      console.error('❌ Invoice numbering failed');
      return res.status(500).json({ error: 'Invoice numbering failed' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENEROWANIE PDF
    // ─────────────────────────────────────────────────────────────────────────
    let pdfBuffer: Uint8Array;

    try {
      const invoiceData = {
        number: invoiceNumber,
        buyerName,
        buyerAddress,
        buyerNIP,
        email,
        paymentDate,
        paymentMethod,
        lang: lang as 'pl' | 'en',
        currency,
        taxNote: 'Zwolnienie z VAT – art. 43 ust. 1 pkt 19 ustawy o VAT',
        items: [
          {
            name: service,
            quantity: 1,
            unit: 'szt.',
            unitPrice: netAmount, // = grossAmount przy VAT=0
            vatRate: 0,
          },
        ],
        totals: {
          net: netAmount,
          vat: vatAmount,
          gross: grossAmount,
        },
      };

      console.log('🧾 Dane do faktury:', invoiceData);
      pdfBuffer = await generateInvoicePdf(invoiceData);
    } catch (err: any) {
      console.error('❌ Błąd generowania PDF:', err?.message);
      console.error('📄 Stack:', err?.stack);
      return res.status(500).json({
        error: 'PDF generation failed',
        message: err?.message,
        stack: err?.stack,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPLOAD PDF do Supabase Storage
    // ─────────────────────────────────────────────────────────────────────────
    const year = new Date(paymentDate).getFullYear();
    const filename = `${invoiceNumber.replace(/\//g, '-')}.pdf`;

  // Konwersja Uint8Array -> ArrayBuffer (uwzględnij offset/length)
// Konwersja Uint8Array -> Node Buffer (najbezpieczniej dla uploadu w Node)
const fileBody = Buffer.from(pdfBuffer);

const { error: uploadError } = await supabase.storage
  .from('invoices')
  .upload(`${year}/${filename}`, fileBody, {
    contentType: 'application/pdf',
    upsert: true,
  });



    if (uploadError) {
      console.error('❌ Upload error (storage):', uploadError.message);
      return res.status(500).json({
        error: 'Upload to storage failed',
        message: uploadError.message,
      });
    }

    const url = supabase.storage.from('invoices').getPublicUrl(`${year}/${filename}`).data.publicUrl;

    // ─────────────────────────────────────────────────────────────────────────
    // WYSYŁKA MAILA — podajemy kwotę BRUTTO
    // ─────────────────────────────────────────────────────────────────────────
    await sendInvoiceEmail({
      to: email,
      invoiceNumber,
      url,
      service,
      gross: `${grossAmount.toFixed(2)} ${currency}`,
      lang,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // INSERT do public.invoices
    // amount = BRUTTO, vat = 0
    // ─────────────────────────────────────────────────────────────────────────
    const { error: insertError } = await supabase.from('invoices').insert({
      number: invoiceNumber,
      buyer: buyerName,
      email,
      file_url: url,
      amount: grossAmount, // BRUTTO
      vat: 0,              // VAT=0
      currency,            // jeśli masz kolumnę; w razie czego usuń
      paid_at: paymentDate,
      method: paymentMethod,
      user_id: null,
      tax_note: 'Zwolnienie z VAT – art. 43 ust. 1 pkt 19 ustawy o VAT', // jeśli masz kolumnę
    });

    if (insertError) {
      console.error('❌ Insert error (invoices):', insertError.message);
      return res.status(500).json({
        error: 'Insert to invoices failed',
        message: insertError.message,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AKTUALIZACJA ABONAMENTU (patients i users)
    // ─────────────────────────────────────────────────────────────────────────
    const start = new Date();
    const end = new Date();
    switch (plan) {
      case '7d':
        end.setDate(start.getDate() + 7);
        break;
      case '30d':
        end.setDate(start.getDate() + 30);
        break;
      case '90d':
        end.setDate(start.getDate() + 90);
        break;
      case '365d':
        end.setDate(start.getDate() + 365);
        break;
      default:
        end.setDate(start.getDate() + 7);
        break;
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
      console.error('❌ Update error (patients):', updatePatientsError.message);
      return res.status(500).json({
        error: 'Update patients failed',
        message: updatePatientsError.message,
      });
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
      // nie przerywamy webhooka — logujemy
      console.error('❌ Update error (users):', updateUsersError.message);
    } else {
      console.log(`👨‍⚕️ Zaktualizowano abonament lekarza: ${plan}`);
    }

    console.log(
      `✅ Plan: ${plan}, start: ${start.toISOString()}, koniec: ${end.toISOString()} dla ${email}`
    );
  }

  return res.status(200).json({ received: true });
}
