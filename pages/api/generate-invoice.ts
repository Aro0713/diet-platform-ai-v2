import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { generateInvoicePdf } from '@/utils/generateInvoicePdf';
import { generateInvoiceNumber } from '@/utils/generateInvoiceNumber';
import { sendInvoiceEmail } from '@/utils/sendInvoiceEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    const {
      buyerName,
      buyerAddress,
      buyerNIP,
      email,
      paymentDate,
      paymentMethod,
      service,
      netAmount,
      vatRate = 0.23,
      lang = 'pl',
    } = req.body;

    const invoiceNumber = await generateInvoiceNumber();

    const pdfBuffer = await generateInvoicePdf({
      buyerName,
      buyerAddress,
      buyerNIP,
      email,
      paymentDate,
      paymentMethod,
      service,
      netAmount,
      vatRate,
    });

    const year = new Date(paymentDate).getFullYear();
    const filename = `${invoiceNumber.replace(/\//g, '-')}.pdf`; // e.g. 1-DCP-2025.pdf

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(`${year}/${filename}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Błąd zapisu faktury:', uploadError.message);
      return res.status(500).json({ error: 'Upload to Supabase failed' });
    }

    const url = supabase.storage
      .from('invoices')
      .getPublicUrl(`${year}/${filename}`).data.publicUrl;

    const grossAmount = netAmount + (netAmount * vatRate);

    // 📨 Wyślij e-mail z fakturą do klienta
    await sendInvoiceEmail({
      to: email,
      invoiceNumber,
      url,
      service,
      gross: grossAmount.toFixed(2) + ' zł',
      lang,
    });

    // 📥 (opcjonalnie) Zapisz wpis do tabeli
    await supabase.from('invoices').insert({
      number: invoiceNumber,
      buyer: buyerName,
      email,
      file_url: url,
      amount: netAmount,
      vat: vatRate,
      paid_at: paymentDate,
      method: paymentMethod,
    });

    return res.status(200).json({ invoiceNumber, url });
  } catch (err) {
    console.error('❌ Błąd generowania faktury:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
