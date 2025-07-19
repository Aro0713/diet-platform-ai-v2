import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { generateInvoiceNumber } from '@/utils/generateInvoiceNumber';

interface InvoiceData {
  buyerName: string;
  buyerAddress: string;
  buyerNIP?: string;
  email: string;
  paymentDate: string; // ISO string
  paymentMethod: 'Karta' | 'Przelew';
  service: string; // e.g. "Plan diety 7 dni"
  netAmount: number;
  vatRate: number; // e.g. 0.23
  lang?: 'pl' | 'en';
}

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',') + ' zł';
}

function numberToWordsPL(amount: number): string {
  // uproszczone: tylko setki i grosze
  const zl = Math.floor(amount);
  const gr = Math.round((amount - zl) * 100);
  return `${zl} zł ${gr.toString().padStart(2, '0')}/100`;
}

function numberToWordsEN(amount: number): string {
  const zl = Math.floor(amount);
  const gr = Math.round((amount - zl) * 100);
  return `${zl} PLN and ${gr.toString().padStart(2, '0')}/100`;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const invoiceNumber = await generateInvoiceNumber();
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const drawText = (text: string, x: number, y: number, size = 12) => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
  };

  const vatAmount = data.netAmount * data.vatRate;
  const grossAmount = data.netAmount + vatAmount;

  const date = new Date(data.paymentDate);
  const day = date.toLocaleDateString('pl-PL');
  const lang = data.lang || 'pl';

  const t = {
    issueDate: lang === 'pl' ? 'Data wystawienia' : 'Issue date',
    saleDate: lang === 'pl' ? 'Data sprzedaży' : 'Sale date',
    paymentMethod: lang === 'pl' ? 'Sposób zapłaty' : 'Payment method',
    seller: lang === 'pl' ? 'Sprzedawca' : 'Seller',
    buyer: lang === 'pl' ? 'Nabywca' : 'Buyer',
    email: 'Email',
    item: lang === 'pl' ? 'Nazwa usługi' : 'Service',
    qty: lang === 'pl' ? 'Ilość' : 'Quantity',
    net: lang === 'pl' ? 'Cena netto' : 'Net price',
    vat: 'VAT',
    gross: lang === 'pl' ? 'Brutto' : 'Gross',
    total: lang === 'pl' ? 'Do zapłaty' : 'Total due',
    note: lang === 'pl'
      ? 'Zakup przez platformę DCP.care'
      : 'Purchase via DCP.care platform',
    words: lang === 'pl' ? 'Słownie' : 'In words',
  };

  const amountWords = lang === 'pl'
    ? numberToWordsPL(grossAmount)
    : numberToWordsEN(grossAmount);

  drawText(`Faktura VAT / VAT Invoice ${invoiceNumber}`, 50, height - 50, 16);
  drawText(`${t.issueDate}: ${day}`, 50, height - 70);
  drawText(`${t.saleDate}: ${day}`, 50, height - 90);
  drawText(`${t.paymentMethod}: ${data.paymentMethod}`, 50, height - 110);

  drawText(`${t.seller}: ALS sp. z o.o.`, 50, height - 150);
  drawText(`Filarskiego 39, 47-330 Zdzieszowice`, 50, height - 165);
  drawText(`NIP: 6252121456`, 50, height - 180);
  drawText(`PKO BP SA: 89 1020 2498 0000 8802 0136 5063`, 50, height - 195);

  drawText(`${t.buyer}: ${data.buyerName}`, 300, height - 150);
  drawText(data.buyerAddress, 300, height - 165);
  if (data.buyerNIP) drawText(`NIP: ${data.buyerNIP}`, 300, height - 180);
  drawText(`${t.email}: ${data.email}`, 300, height - 195);

  drawText('Lp', 50, height - 240);
  drawText(t.item, 80, height - 240);
  drawText(t.qty, 300, height - 240);
  drawText(t.net, 350, height - 240);
  drawText(t.vat, 430, height - 240);
  drawText(t.gross, 500, height - 240);

  drawText('1', 50, height - 260);
  drawText(data.service, 80, height - 260);
  drawText('1 szt.', 300, height - 260);
  drawText(formatCurrency(data.netAmount), 350, height - 260);
  drawText(`${(data.vatRate * 100).toFixed(0)}%`, 430, height - 260);
  drawText(formatCurrency(grossAmount), 500, height - 260);

  drawText(`${t.total}: ${formatCurrency(grossAmount)}`, 50, height - 320, 14);
  drawText(`${t.words}: ${amountWords}`, 50, height - 340);
  drawText(`Uwagi / Notes: ${t.note}`, 50, height - 370);

  return await pdfDoc.save();
}
