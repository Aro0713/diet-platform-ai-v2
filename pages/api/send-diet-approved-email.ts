// pages/api/send-diet-approved-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_LANGS = ["pl","en","de","fr","es","ua","ru","zh","ar","hi","he"] as const;
type Lang = typeof ALLOWED_LANGS[number];

function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (ALLOWED_LANGS as readonly string[]).includes(v);
}
function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function safeStr(v: unknown, max = 120): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function getClientIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff[0]) return xff[0];
  return (req.socket.remoteAddress || "unknown").toString();
}

// --- best-effort rate limit ---
const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ = 10;

function rateLimitHit(key: string): boolean {
  const now = Date.now();
  const e = store.get(key);
  if (!e || now > e.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > MAX_REQ;
}

async function getSupabaseUser(req: NextApiRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) throw new Error("Missing Supabase env");

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[send-diet-approved] Missing RESEND_API_KEY");
    return res.status(500).json({ error: "Mail service not configured" });
  }

  // 🔐 auth
  let userId = "unknown";
  try {
    const user = await getSupabaseUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    userId = user.id;
  } catch (e: any) {
    console.error("[send-diet-approved] auth error:", e?.message || e);
    return res.status(500).json({ error: "Auth configuration error" });
  }

  // 🛑 rate limit
  const ip = getClientIp(req);
  const rlKey = `diet-approved:${userId}:${ip}`;
  if (rateLimitHit(rlKey)) return res.status(429).json({ error: "Too many requests" });

  const patientEmail = safeStr(req.body?.patientEmail, 320);
  const patientNameRaw = safeStr(req.body?.patientName, 120);
  const langRaw = req.body?.lang;

  if (!isEmail(patientEmail) || !patientNameRaw) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const lang: Lang = isLang(langRaw) ? langRaw : "pl";
  const patientName = escapeHtml(patientNameRaw);

  const subjectMap: Record<Lang, string> = {
    pl: "✅ Twoja dieta została zatwierdzona!",
    en: "✅ Your diet has been approved!",
    de: "✅ Dein Diätplan wurde genehmigt!",
    fr: "✅ Votre régime a été approuvé !",
    es: "✅ ¡Tu dieta ha sido aprobada!",
    ua: "✅ Вашу дієту підтверджено!",
    ru: "✅ Ваша диета утверждена!",
    zh: "✅ 您的饮食计划已获批准！",
    ar: "✅ تمت الموافقة على نظامك الغذائي!",
    hi: "✅ आपकी डाइट स्वीकृत हो गई है!",
    he: "✅ הדיאטה שלך אושרה!",
  };

  const buttonLabelMap: Record<Lang, string> = {
    pl: "🔍 Zobacz dietę w DCP",
    en: "🔍 View your diet in DCP",
    de: "🔍 Diätplan in DCP ansehen",
    fr: "🔍 Voir le régime dans DCP",
    es: "🔍 Ver dieta en DCP",
    ua: "🔍 Переглянути дієту в DCP",
    ru: "🔍 Посмотреть диету в DCP",
    zh: "🔍 在 DCP 查看饮食计划",
    ar: "🔍 عرض النظام في DCP",
    hi: "🔍 DCP में डाइट देखें",
    he: "🔍 הצג תפריט ב-DCP",
  };

  const headerMap: Record<Lang, string> = {
    pl: "Dieta została zatwierdzona przez lekarza lub dietetyka.",
    en: "Your diet has been approved by your doctor or dietitian.",
    de: "Dein Diätplan wurde von deinem Arzt oder Ernährungsberater genehmigt.",
    fr: "Votre régime a été approuvé par votre médecin ou diététicien.",
    es: "Tu dieta ha sido aprobada por tu médico o dietista.",
    ua: "Вашу дієту затвердив лікар або дієтолог.",
    ru: "Вашу диету утвердил врач или диетолог.",
    zh: "您的饮食计划已获得医生或营养师的批准。",
    ar: "تمت الموافقة على نظامك الغذائي من قبل الطبيب أو اختصاصي التغذية.",
    hi: "आपकी डाइट को डॉक्टर या डाइटिशियन ने मंजूरी दे दी है।",
    he: "התפריט שלך אושר על ידי הרופא או הדיאטנית.",
  };

  const actionMap: Record<Lang, string> = {
    pl: "Możesz ją teraz przejrzeć w panelu DCP.",
    en: "You can now view it in the DCP panel.",
    de: "Du kannst ihn jetzt im DCP-Panel einsehen.",
    fr: "Vous pouvez maintenant le consulter dans le panneau DCP.",
    es: "Ya puedes verla en el panel de DCP.",
    ua: "Ви можете переглянути її у панелі DCP.",
    ru: "Теперь вы можете просмотреть её в панели DCP.",
    zh: "您现在可以在 DCP 面板中查看它。",
    ar: "يمكنك الآن عرضه في لوحة DCP.",
    hi: "अब आप इसे DCP पैनल में देख सकते हैं।",
    he: "תוכל לצפות בו עכשיו בלוח הבקרה של DCP.",
  };

  const signatureMap: Record<Lang, string> = {
    pl: "Pozdrawiamy,<br />Zespół DCP",
    en: "Best regards,<br />DCP Team",
    de: "Mit freundlichen Grüßen,<br />Dein DCP-Team",
    fr: "Cordialement,<br />L’équipe DCP",
    es: "Atentamente,<br />Equipo DCP",
    ua: "З повагою,<br />Команда DCP",
    ru: "С уважением,<br />Команда DCP",
    zh: "此致敬礼，<br />DCP 团队",
    ar: "مع تحيات,<br />فريق DCP",
    hi: "सादर,<br />DCP टीम",
    he: "בברכה,<br />צוות DCP",
  };

  const subject = subjectMap[lang];
  const text = `${patientNameRaw}, ${headerMap.pl} ${actionMap.pl} https://dcp.care/panel-patient`;

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5">
      <p><strong>${escapeHtml(headerMap[lang])}</strong></p>
      <p>${patientName}, ${escapeHtml(actionMap[lang])}</p>
      <p>
        <a href="https://dcp.care/panel-patient" style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;display:inline-block;">
          ${escapeHtml(buttonLabelMap[lang])}
        </a>
      </p>
      <p>${signatureMap[lang]}</p>
    </div>
  `;

  const from = process.env.RESEND_FROM || "DCP <no-reply@dcp.care>";

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: patientEmail,
        subject,
        text,
        html,
      }),
    });

    const payload = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error("[send-diet-approved] Resend error:", {
        status: resp.status,
        message: (payload as any)?.message || "unknown",
      });
      return res.status(resp.status).json({ error: "Resend error" });
    }

    return res.status(200).json({ success: true, id: (payload as any)?.id });
  } catch (e: any) {
    console.error("[send-diet-approved] Unexpected error:", e?.message || e);
    return res.status(500).json({ error: "Unexpected error" });
  }
}
