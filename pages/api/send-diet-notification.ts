// pages/api/send-diet-notification.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type Lang =
  | "pl" | "en" | "de" | "fr" | "es" | "ua" | "ru" | "zh" | "ar" | "hi" | "he";

const ALLOWED_LANGS: Set<Lang> = new Set([
  "pl","en","de","fr","es","ua","ru","zh","ar","hi","he"
]);

function isEmail(s: unknown): s is string {
  if (typeof s !== "string") return false;
  // prosty, wystarczający walidator
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function safeStr(s: unknown, max = 120): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

// --- Best-effort rate limit (in-memory) ---
const RL_WINDOW_MS = 60_000;
const RL_MAX = 5;
// key -> {count, resetAt}
const rlStore = new Map<string, { count: number; resetAt: number }>();

function rateLimitHit(key: string): boolean {
  const now = Date.now();
  const entry = rlStore.get(key);
  if (!entry || now > entry.resetAt) {
    rlStore.set(key, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RL_MAX;
}

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff[0]) return xff[0];
  return (req.socket.remoteAddress || "unknown").toString();
}

function subjectFor(lang: Lang): string {
  const subjectMap: Record<Lang, string> = {
    pl: "🧾 Nowa dieta od pacjenta",
    en: "🧾 New diet from patient",
    de: "🧾 Neue Diät vom Patienten",
    fr: "🧾 Nouveau régime du patient",
    es: "🧾 Nueva dieta del paciente",
    ua: "🧾 Нова дієта від пацієнта",
    ru: "🧾 Новая диета от пациента",
    zh: "🧾 患者的新饮食计划",
    ar: "🧾 حمية جديدة من المريض",
    hi: "🧾 रोगी से नया डाइट प्लान",
    he: "🧾 תפריט חדש מהמטופל",
  };
  return subjectMap[lang] || subjectMap.pl;
}

function htmlFor(params: {
  lang: Lang;
  patientName: string;
  patientEmail: string;
}): string {
  const { lang, patientName, patientEmail } = params;

  const htmlTemplate = (greeting: string, loginInstruction: string, signature: string, buttonLabel: string) => `
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5">
      <p>${greeting}</p>
      <p><strong>${escapeHtml(patientName)}</strong> (<a href="mailto:${escapeAttr(patientEmail)}">${escapeHtml(patientEmail)}</a>) ${loginInstruction}</p>
      <p>
        <a href="https://dcp.care" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
          ${buttonLabel}
        </a>
      </p>
      <p>${signature}</p>
    </div>`;

  const map: Record<Lang, string> = {
    pl: htmlTemplate(
      "Pacjent przesłał dietę do weryfikacji i akceptacji.",
      "przesłał dietę do weryfikacji. Aby się zalogować, przejdź na stronę DCP i użyj swojego loginu (adres e-mail), aby pobrać dane pacjenta.",
      "Pozdrawiamy,<br />Zespół DCP",
      "🔐 Zaloguj się do DCP"
    ),
    en: htmlTemplate(
      "The patient has submitted a diet for review and approval.",
      "has submitted a diet for your review. Please log in to DCP using your email address to access the patient data.",
      "Best regards,<br />DCP Team",
      "🔐 Log in to DCP"
    ),
    de: htmlTemplate(
      "Der Patient hat einen Diätplan zur Überprüfung und Genehmigung eingereicht.",
      "hat einen Diätplan eingereicht. Bitte melden Sie sich mit Ihrer E-Mail-Adresse bei DCP an, um auf die Patientendaten zuzugreifen.",
      "Mit freundlichen Grüßen,<br />Ihr DCP-Team",
      "🔐 Bei DCP anmelden"
    ),
    fr: htmlTemplate(
      "Le patient a soumis un régime pour examen et approbation.",
      "a soumis un régime. Connectez-vous à DCP avec votre adresse e-mail pour accéder aux données du patient.",
      "Cordialement,<br />L’équipe DCP",
      "🔐 Se connecter à DCP"
    ),
    es: htmlTemplate(
      "El paciente ha enviado una dieta para revisión y aprobación.",
      "ha enviado una dieta. Inicia sesión en DCP con tu correo electrónico para acceder a los datos del paciente.",
      "Atentamente,<br />Equipo DCP",
      "🔐 Iniciar sesión en DCP"
    ),
    ua: htmlTemplate(
      "Пацієнт надіслав дієту для перевірки та затвердження.",
      "надіслав дієту. Увійдіть до DCP, використовуючи свою електронну адресу, щоб отримати дані пацієнта.",
      "З повагою,<br />Команда DCP",
      "🔐 Увійти до DCP"
    ),
    ru: htmlTemplate(
      "Пациент отправил диету на проверку и утверждение.",
      "отправил диету. Войдите в DCP, используя свой email, чтобы получить данные пациента.",
      "С уважением,<br />Команда DCP",
      "🔐 Войти в DCP"
    ),
    zh: htmlTemplate(
      "患者提交了饮食计划以供审核和批准。",
      "提交了饮食计划。请使用您的电子邮件登录 DCP 以获取患者数据。",
      "此致,<br />DCP 团队",
      "🔐 登录 DCP"
    ),
    ar: htmlTemplate(
      "قام المريض بإرسال خطة غذائية للمراجعة والموافقة.",
      "أرسل خطة غذائية. الرجاء تسجيل الدخول إلى DCP باستخدام بريدك الإلكتروني للوصول إلى بيانات المريض.",
      "مع تحيات,<br />فريق DCP",
      "🔐 تسجيل الدخول إلى DCP"
    ),
    hi: htmlTemplate(
      "रोगी ने समीक्षा और अनुमोदन के लिए एक डाइट योजना भेजी है।",
      "ने डाइट भेजी है। कृपया अपनी ईमेल आईडी से DCP में लॉगिन करें और मरीज की जानकारी प्राप्त करें।",
      "सादर,<br />DCP टीम",
      "🔐 DCP में लॉगिन करें"
    ),
    he: htmlTemplate(
      "המטופל שלח תפריט לבדיקה ואישור.",
      "שלח תפריט. התחבר ל-DCP עם כתובת האימייל שלך כדי לצפות בפרטי המטופל.",
      "בברכה,<br />צוות DCP",
      "🔐 התחבר ל-DCP"
    ),
  };

  return map[lang] || map.pl;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/\s+/g, "");
}


async function getSupabaseUser(req: NextApiRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }

  // token z Authorization: Bearer <token> albo z cookies (sb-access-token / supabase auth cookie)
  const authHeader = req.headers.authorization || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: tokenFromHeader ? { Authorization: `Bearer ${tokenFromHeader}` } : {},
    },
    auth: {
      // jeśli używasz cookies Supabase, to i tak warto przekazać header – ale tu zostawiamy prosto
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(tokenFromHeader || undefined);
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  // --- auth ---
  let userId = "unknown";
  try {
    const user = await getSupabaseUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    userId = user.id;
  } catch (e: any) {
    console.error("[send-diet-notification] auth error:", e?.message || e);
    return res.status(500).json({ error: "Auth configuration error" });
  }

  // --- rate limit ---
  const ip = getClientIp(req);
  const rlKey = `send-diet-notification:${userId}:${ip}`;
  if (rateLimitHit(rlKey)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const doctorEmail = safeStr(req.body?.doctorEmail, 320);
  const patientName = safeStr(req.body?.patientName, 120);
  const patientEmail = safeStr(req.body?.patientEmail, 320);
  const langRaw = safeStr(req.body?.lang, 8).toLowerCase() as Lang;
  const lang: Lang = (ALLOWED_LANGS.has(langRaw) ? langRaw : "pl") as Lang;

  if (!isEmail(doctorEmail) || !isEmail(patientEmail) || !patientName) {
    // nie loguj pełnych danych
    return res.status(400).json({ error: "Invalid payload" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[send-diet-notification] Missing RESEND_API_KEY");
    return res.status(500).json({ error: "Mail service not configured" });
  }

  const from = process.env.RESEND_FROM || "DCP <no-reply@dcp.care>";
  const subject = subjectFor(lang);
  const html = htmlFor({ lang, patientName, patientEmail });
  const text =
    lang === "pl"
      ? `Pacjent ${patientName} (${patientEmail}) przesłał dietę do weryfikacji.\nZaloguj się do DCP: https://dcp.care`
      : `Patient ${patientName} (${patientEmail}) submitted a diet for review.\nLog in to DCP: https://dcp.care`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: doctorEmail,
        subject,
        text,
        html,
      }),
    });

    // Resend zwraca JSON
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      // loguj tylko kod i message (bez sekretów i bez całych obiektów)
      console.error("[send-diet-notification] Resend error:", {
        status: response.status,
        message: (payload as any)?.message || "unknown",
      });
      return res.status(response.status).json({ error: "Resend error" });
    }

    // nie zwracaj za dużo informacji
    return res.status(200).json({ success: true, id: (payload as any)?.id });
  } catch (err: any) {
    console.error("[send-diet-notification] Unexpected error:", err?.message || err);
    return res.status(500).json({ error: "Unexpected error" });
  }
}
