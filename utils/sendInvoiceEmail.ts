import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_LANGS = ["pl","en","de","fr","es","ua","ru","zh","ar","hi","he"] as const;
type Lang = typeof ALLOWED_LANGS[number];

function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (ALLOWED_LANGS as readonly string[]).includes(v);
}

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeText(s: unknown, max = 200): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function isSafeUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:"; // tylko https
  } catch {
    return false;
  }
}

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  url,
  service,
  gross,
  lang = "pl",
}: {
  to: string;
  invoiceNumber: string;
  url: string;
  service: string;
  gross: string;
  lang?: Lang | string;
}) {
  if (!process.env.RESEND_API_KEY || !resend) {
    throw new Error("RESEND_API_KEY is missing");
  }

  if (!isEmail(to)) {
    throw new Error("Invalid recipient email");
  }

  const safeLang: Lang = isLang(lang) ? lang : "pl";

  // 🔒 sanity / anti-injection (bo to leci w HTML)
  const inv = escapeHtml(safeText(invoiceNumber, 60));
  const srv = escapeHtml(safeText(service, 120));
  const grs = escapeHtml(safeText(gross, 40));

  // 🔒 link tylko https (najlepiej z Twojej domeny / storage)
  if (!isSafeUrl(url)) {
    throw new Error("Invalid invoice URL");
  }
  const safeUrl = url;

  const subjectMap: Record<Lang, string> = {
    pl: `📄 Twoja faktura VAT ${inv}`,
    en: `📄 Your VAT invoice ${inv}`,
    de: `📄 Ihre Mehrwertsteuerrechnung ${inv}`,
    fr: `📄 Votre facture ${inv}`,
    es: `📄 Su factura ${inv}`,
    ua: `📄 Ваш рахунок-фактура ${inv}`,
    ru: `📄 Ваш счёт-фактура ${inv}`,
    zh: `📄 您的发票 ${inv}`,
    ar: `📄 فاتورة ضريبية ${inv}`,
    hi: `📄 आपकी कर चालान ${inv}`,
    he: `📄 החשבונית שלך ${inv}`,
  };

  const buttonMap: Record<Lang, string> = {
    pl: "📄 Pobierz fakturę PDF",
    en: "📄 Download invoice PDF",
    de: "📄 Rechnung herunterladen",
    fr: "📄 Télécharger la facture",
    es: "📄 Descargar factura",
    ua: "📄 Завантажити рахунок",
    ru: "📄 Скачать счет",
    zh: "📄 下载发票 PDF",
    ar: "📄 تحميل الفاتورة",
    hi: "📄 चालान डाउनलोड करें",
    he: "📄 הורד את החשבונית",
  };

  const footerMap: Record<Lang, string> = {
    pl: "Faktura została wystawiona automatycznie. Nie odpowiadaj na tę wiadomość.",
    en: "This invoice was generated automatically. Do not reply to this message.",
    de: "Diese Rechnung wurde automatisch erstellt. Bitte nicht antworten.",
    fr: "Cette facture a été générée automatiquement. Ne répondez pas à ce message.",
    es: "Esta factura fue generada automáticamente. No responda a este mensaje.",
    ua: "Рахунок створено автоматично. Не відповідайте на це повідомлення.",
    ru: "Счет создан автоматически. Не отвечайте на это сообщение.",
    zh: "此发票为系统自动生成，请勿回复此邮件。",
    ar: "تم إنشاء هذه الفاتورة تلقائيًا. لا ترد على هذه الرسالة.",
    hi: "यह चालान स्वचालित रूप से उत्पन्न किया गया है। कृपया उत्तर न दें।",
    he: "חשבונית זו נוצרה אוטומטית. אין להשיב להודעה זו.",
  };

  const introMap: Record<Lang, string> = {
    pl: "Dziękujemy za zakup planu diety w Diet Care Platform.",
    en: "Thank you for your purchase in Diet Care Platform.",
    de: "Vielen Dank für Ihren Einkauf bei der Diet Care Platform.",
    fr: "Merci pour votre achat sur la plateforme Diet Care.",
    es: "Gracias por su compra en Diet Care Platform.",
    ua: "Дякуємо за покупку на платформі Diet Care.",
    ru: "Спасибо за покупку на платформе Diet Care.",
    zh: "感谢您在 Diet Care 平台的购买。",
    ar: "شكرًا لشرائك من منصة Diet Care.",
    hi: "Diet Care प्लेटफ़ॉर्म से खरीदारी के लिए धन्यवाद।",
    he: "תודה על הרכישה שלך ב-Diet Care.",
  };

  // HTML: wstawki już escapowane
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5">
      <p>${introMap[safeLang]}</p>
      <p>
        <strong>${safeLang === "pl" ? "Numer faktury:" : safeLang === "en" ? "Invoice number:" : safeLang === "de" ? "Rechnungsnummer:" : safeLang === "fr" ? "Numéro de facture :" : safeLang === "es" ? "Número de factura:" : safeLang === "ua" ? "Номер рахунку:" : safeLang === "ru" ? "Номер счета:" : safeLang === "zh" ? "发票编号：" : safeLang === "ar" ? "رقم الفاتورة:" : safeLang === "hi" ? "चालान संख्या:" : "מספר חשבונית:"}</strong> ${inv}<br/>
        <strong>${safeLang === "pl" ? "Kwota brutto:" : safeLang === "en" ? "Total amount:" : safeLang === "de" ? "Gesamtbetrag:" : safeLang === "fr" ? "Montant TTC :" : safeLang === "es" ? "Importe total:" : safeLang === "ua" ? "Загальна сума:" : safeLang === "ru" ? "Общая сумма:" : safeLang === "zh" ? "总金额：" : safeLang === "ar" ? "المبلغ الإجمالي:" : safeLang === "hi" ? "कुल राशि:" : "סכום כולל:"}</strong> ${grs}<br/>
        <strong>${safeLang === "pl" ? "Usługa:" : safeLang === "en" ? "Service:" : safeLang === "de" ? "Leistung:" : safeLang === "fr" ? "Service :" : safeLang === "es" ? "Servicio:" : safeLang === "ua" ? "Послуга:" : safeLang === "ru" ? "Услуга:" : safeLang === "zh" ? "服务：" : safeLang === "ar" ? "الخدمة:" : safeLang === "hi" ? "सेवा:" : "שירות:"}</strong> ${srv}
      </p>
      <p>
        <a href="${safeUrl}" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
          ${buttonMap[safeLang]}
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:gray;">
        ${footerMap[safeLang]}
      </p>
    </div>
  `;

  // fajnie mieć też text jako fallback dla klientów poczty
  const text = `${introMap[safeLang]}
Invoice: ${invoiceNumber}
Total: ${gross}
Service: ${service}
PDF: ${url}
`;

  const from = "DCP Faktury <no-reply@dcp.care>";
  const subject = subjectMap[safeLang];

  await resend.emails.send({ to, from, subject, html, text });
}
