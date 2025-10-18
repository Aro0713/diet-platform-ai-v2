// utils/generateInvoicePdf.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { tUI } from '@/utils/i18n';

interface InvoiceItem {
  name: string;
  code?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

export interface InvoiceData {
  /** Numer faktury nadany przez Supabase (trigger/RPC/insert returning) */
  invoiceNumber: string;

  buyerName: string;
  buyerAddress: string;
  buyerNIP?: string;
  email: string;
  paymentDate: string;     // ISO string
  paymentMethod: string;   // np. "Karta" / "Przelew"
  placeOfIssue?: string;   // domyślnie Zdzieszowice
  items: InvoiceItem[];
  lang?: 'pl' | 'en';
  currency: 'PLN' | 'EUR' | 'USD';
  issuedBy?: string;       // np. "Diet Care Platform"
}

function stripDiacritics(text: string): string {
  const map: Record<string, string> = {
    ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n',
    ó: 'o', ś: 's', ż: 'z', ź: 'z',
    Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N',
    Ó: 'O', Ś: 'S', Ż: 'Z', Ź: 'Z',
  };
  return text.replace(/[ąćęłńóśżźĄĆĘŁŃÓŚŻŹ]/g, (m) => map[m] || m);
}

function formatCurrency(value: number, currency: string, lang: string): string {
  const symbol = currency === 'PLN' ? 'zł' : currency;
  const amount = value.toFixed(2);
  return lang === 'pl' ? amount.replace('.', ',') + ' ' + symbol : amount + ' ' + symbol;
}

// Zostawiamy, jeśli kiedyś chcesz wydruk słowny kwoty (obecnie niewykorzystywane)
function numberToWords(amount: number, currency: string, lang: string): string {
  const main = Math.floor(amount);
  const minor = Math.round((amount - main) * 100);
  return lang === 'pl'
    ? `${main} ${currency} ${minor.toString().padStart(2, '0')}/100`
    : `${main} ${currency} and ${minor.toString().padStart(2, '0')}/100`;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  console.log('📥 Dane wejściowe do PDF:', JSON.stringify(data, null, 2));

  if (!data.items || data.items.length === 0) {
    throw new Error('Brak pozycji na fakturze (items)');
  }

  data.items.forEach((item, index) => {
    if (!item.name || typeof item.unitPrice !== 'number' || typeof item.vatRate !== 'number') {
      throw new Error(`Nieprawidłowa pozycja [${index}]: ${JSON.stringify(item)}`);
    }
    if (isNaN(item.unitPrice) || isNaN(item.vatRate)) {
      throw new Error(`unitPrice lub vatRate to NaN w pozycji [${index}]: ${JSON.stringify(item)}`);
    }
  });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, x: number, y: number, size = 10) => {
    page.drawText(stripDiacritics(text), { x, y, size, font, color: rgb(0, 0, 0) });
  };

  const lang = data.lang || 'pl';
  const currency = data.currency;
  const t = (key: string) => tUI(key, lang);
  const issueDate = new Date(data.paymentDate).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB');
  const place = data.placeOfIssue || 'Zdzieszowice';

  const totalNet = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Header
  draw('ALS sp. z o.o.', 50, 800);
  draw('Filarskiego 39, 47-330 Zdzieszowice', 50, 785);
  draw('Tel.: 500720242, NIP: 6252121456', 50, 770);
  draw('PKO BP SA,', 50, 755);
  draw('89102024980000880201365063', 50, 740);

  draw(`${t('placeOfIssue')}: ${place}`, 400, 800);
  draw(`${t('deliveryDate')}: ${issueDate}`, 400, 785);
  draw(`${t('issueDate')}: ${issueDate}`, 400, 770);

  // Buyer / Seller
  draw(`${t('seller')}:`, 50, 720);
  draw('ALS sp. z o.o.', 50, 705);
  draw('Filarskiego 39', 50, 690);
  draw('47-330 Zdzieszowice', 50, 675);
  draw('NIP: 6252121456', 50, 660);

  draw(`${t('buyer')}:`, 300, 720);
  draw(data.buyerName, 300, 705);
  draw(data.buyerAddress, 300, 690);
  if (data.buyerNIP) draw(`NIP: ${data.buyerNIP}`, 300, 675);
  draw(`${t('email')}: ${data.email}`, 300, 660);

  // Tytuł z numerem z Supabase
  draw(`${t('invoiceTitle')} ${data.invoiceNumber} ${t('original')}`, 50, 630, 12);

  // Table Header
  draw('Lp', 50, 610);
  draw(t('service'), 70, 610);
  draw(t('code'), 220, 610);
  draw(t('quantity'), 270, 610);
  draw(t('unit'), 310, 610);
  draw(t('price'), 350, 610);
  draw('VAT %', 410, 610);
  draw(t('net'), 460, 610);
  draw('VAT', 510, 610);
  draw(t('gross'), 550, 610);

  let y = 590;
  data.items.forEach((item, i) => {
    const net = item.unitPrice * item.quantity;
    const gross = net; // VAT zwolniony → netto = brutto

    draw(`${i + 1}`, 50, y);
    draw(item.name, 70, y);
    draw(item.code || '', 220, y);
    draw(item.quantity.toString(), 270, y);
    draw(item.unit, 310, y);
    draw(formatCurrency(item.unitPrice, currency, lang), 350, y);
    draw('zw', 410, y); // VAT %
    draw(formatCurrency(net, currency, lang), 460, y);
    draw('zw', 510, y); // VAT kwota
    draw(formatCurrency(gross, currency, lang), 550, y);
    y -= 18;
  });

  // Podsumowanie z "zw" (bez totalVat)
  draw(`${t('total')}:`, 400, y);
  draw(formatCurrency(totalNet, currency, lang), 460, y);
  draw('zw', 510, y);

  y -= 30;

  // Podstawa prawna zwolnienia
  draw(t('vatNoteExempt'), 50, y);
  y -= 20;

  draw(`${t('issuedBy')}: ${data.issuedBy || 'DCP system'}`, 50, y);
  draw(`${t('receivedBy')}: __________________________`, 300, y);

  return await pdfDoc.save();
}
