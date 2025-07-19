import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  url,
  service,
  gross,
  lang = 'pl',
}: {
  to: string;
  invoiceNumber: string;
  url: string;
  service: string;
  gross: string;
  lang?: string;
}) {
  const subjectMap: Record<string, string> = {
    pl: `📄 Twoja faktura VAT ${invoiceNumber}`,
    en: `📄 Your VAT invoice ${invoiceNumber}`,
    de: `📄 Ihre Mehrwertsteuerrechnung ${invoiceNumber}`,
    fr: `📄 Votre facture ${invoiceNumber}`,
    es: `📄 Su factura ${invoiceNumber}`,
    ua: `📄 Ваша рахунок-фактура ${invoiceNumber}`,
    ru: `📄 Ваш счёт-фактура ${invoiceNumber}`,
    zh: `📄 您的发票 ${invoiceNumber}`,
    ar: `📄 فاتورة ضريبية ${invoiceNumber}`,
    hi: `📄 आपकी कर चालान ${invoiceNumber}`,
    he: `📄 החשבונית שלך ${invoiceNumber}`
  };

  const htmlMap: Record<string, string> = {
    pl: `
      <p>Dziękujemy za zakup planu diety w Diet Care Platform.</p>
      <p><strong>Numer faktury:</strong> ${invoiceNumber}<br/>
      <strong>Kwota brutto:</strong> ${gross}<br/>
      <strong>Usługa:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 Pobierz fakturę PDF
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">Faktura została wystawiona automatycznie. Nie odpowiadaj na tę wiadomość.</p>
    `,
    en: `
      <p>Thank you for your purchase in Diet Care Platform.</p>
      <p><strong>Invoice number:</strong> ${invoiceNumber}<br/>
      <strong>Total amount:</strong> ${gross}<br/>
      <strong>Service:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 Download invoice PDF
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">This invoice was generated automatically. Do not reply to this message.</p>
    `,
    de: `
      <p>Vielen Dank für Ihren Einkauf bei der Diet Care Platform.</p>
      <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}<br/>
      <strong>Gesamtbetrag:</strong> ${gross}<br/>
      <strong>Leistung:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 Rechnung herunterladen
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">Diese Rechnung wurde automatisch erstellt. Bitte nicht antworten.</p>
    `,
    fr: `
      <p>Merci pour votre achat sur la plateforme Diet Care.</p>
      <p><strong>Numéro de facture :</strong> ${invoiceNumber}<br/>
      <strong>Montant TTC :</strong> ${gross}<br/>
      <strong>Service :</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 Télécharger la facture
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">Cette facture a été générée automatiquement. Ne répondez pas à ce message.</p>
    `,
    es: `
      <p>Gracias por su compra en Diet Care Platform.</p>
      <p><strong>Número de factura:</strong> ${invoiceNumber}<br/>
      <strong>Importe total:</strong> ${gross}<br/>
      <strong>Servicio:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 Descargar factura
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">Esta factura fue generada automáticamente. No responda a este mensaje.</p>
    `,
    ua: `
      <p>Дякуємо за покупку на платформі Diet Care.</p>
      <p><strong>Номер рахунку:</strong> ${invoiceNumber}<br/>
      <strong>Загальна сума:</strong> ${gross}<br/>
      <strong>Послуга:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 Завантажити рахунок
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">Рахунок створено автоматично. Не відповідайте на це повідомлення.</p>
    `,
    ru: `
      <p>Спасибо за покупку на платформе Diet Care.</p>
      <p><strong>Номер счета:</strong> ${invoiceNumber}<br/>
      <strong>Общая сумма:</strong> ${gross}<br/>
      <strong>Услуга:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 Скачать счет
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">Счет создан автоматически. Не отвечайте на это сообщение.</p>
    `,
    zh: `
      <p>感谢您在 Diet Care 平台的购买。</p>
      <p><strong>发票编号：</strong> ${invoiceNumber}<br/>
      <strong>总金额：</strong> ${gross}<br/>
      <strong>服务：</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 下载发票 PDF
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">此发票为系统自动生成，请勿回复此邮件。</p>
    `,
    ar: `
      <p>شكرًا لشرائك من منصة Diet Care.</p>
      <p><strong>رقم الفاتورة:</strong> ${invoiceNumber}<br/>
      <strong>المبلغ الإجمالي:</strong> ${gross}<br/>
      <strong>الخدمة:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 تحميل الفاتورة
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">تم إنشاء هذه الفاتورة تلقائيًا. لا ترد على هذه الرسالة.</p>
    `,
    hi: `
      <p>Diet Care प्लेटफ़ॉर्म से खरीदारी के लिए धन्यवाद।</p>
      <p><strong>चालान संख्या:</strong> ${invoiceNumber}<br/>
      <strong>कुल राशि:</strong> ${gross}<br/>
      <strong>सेवा:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 चालान डाउनलोड करें
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">यह चालान स्वचालित रूप से उत्पन्न किया गया है। कृपया उत्तर न दें।</p>
    `,
    he: `
      <p>תודה על הרכישה שלך ב-Diet Care.</p>
      <p><strong>מספר חשבונית:</strong> ${invoiceNumber}<br/>
      <strong>סכום כולל:</strong> ${gross}<br/>
      <strong>שירות:</strong> ${service}</p>
      <p><a href="${url}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
        📄 הורד את החשבונית
      </a></p>
      <p style="margin-top:24px;font-size:12px;color:gray;">חשבונית זו נוצרה אוטומטית. אין להשיב להודעה זו.</p>
    `,
  };

  const subject = subjectMap[lang] || subjectMap['pl'];
  const html = htmlMap[lang] || htmlMap['pl'];
  const from = 'DCP Faktury <faktury@dcp.care>';

  await resend.emails.send({ to, from, subject, html });
}
