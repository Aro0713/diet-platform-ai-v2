import { supabase } from '@/lib/supabaseClient';

/**
 * Generates the next available invoice number in format: X/DCP/YYYY
 * Resets numbering every new calendar year.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `/DCP/${currentYear}`;

  const { data: existingInvoices, error } = await supabase
    .from('invoices')
    .select('number')
    .like('number', `%${prefix}`)
    .order('number', { ascending: false });

  if (error) {
    console.error('❌ Błąd pobierania faktur:', error.message);
    throw new Error('Failed to fetch invoice numbers');
  }

  const lastNumberRaw = existingInvoices?.[0]?.number?.split('/')[0];
  const lastNumber = parseInt(lastNumberRaw, 10) || 0;
  const nextNumber = lastNumber + 1;

  return `${nextNumber}/DCP/${currentYear}`;
}
