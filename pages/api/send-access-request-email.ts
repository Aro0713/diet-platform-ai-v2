// pages/api/send-access-request-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

// --- Lang typing ---
const ALLOWED_LANGS = ["pl","en","de","fr","es","ua","ru","zh","ar","hi","he"] as const;
type Lang = typeof ALLOWED_LANGS[number];

function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (ALLOWED_LANGS as readonly string[]).includes(v);
}

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// --- best-effort rate limit (in-memory) ---
const store = new Map<string, { count: number; reset: number }>();
const LIMIT = 5;
const WINDOW = 60_000;

function hit(key: string) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > LIMIT;
}

// --- auth helper (Authorization: Bearer <token>) ---
async function getUser(req: NextApiRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: req.headers.authorization || "",
      },
    },
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.RESEND_API_KEY) {
    // bezpiecznie: nie wysyłamy, ale build działa
    console.error("[send-access-request-email] Missing RESEND_API_KEY");
    return res.status(500).json({ error: "Mail service not configured" });
  }

  // 🔐 auth
  let user;
  try {
    user = await getUser(req);
  } catch (e: any) {
    console.error("[send-access-request-email] auth error:", e?.message || e);
    return res.status(500).json({ error: "Auth configuration error" });
  }
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const doctorEmail = req.body?.doctorEmail;
  const langRaw = req.body?.lang;

  if (!isEmail(doctorEmail)) {
    return res.status(400).json({ error: "Invalid doctorEmail" });
  }

  const lang: Lang = isLang(langRaw) ? langRaw : "pl";

  // 🛑 rate limit
  const rlKey = `access-request:${user.id}`;
  if (hit(rlKey)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  const subjectMap: Record<Lang, string> = {
    pl: "🔐 Prośba o dostęp do danych pacjenta",
    en: "🔐 Request for access to patient data",
    de: "🔐 Anfrage auf Zugriff auf Patientendaten",
    fr: "🔐 Demande d’accès aux données du patient",
    es: "🔐 Solicitud de acceso a los datos del paciente",
    ua: "🔐 Запит на доступ до даних пацієнта",
    ru: "🔐 Запрос на доступ к данным пациента",
    zh: "🔐 请求访问患者数据",
    ar: "🔐 طلب الوصول إلى بيانات المريض",
    hi: "🔐 रोगी डेटा तक पहुँच का अनुरोध",
    he: "🔐 בקשה לגישה לנתוני מטופל",
  };

  const textMap: Record<Lang, string> = {
    pl: `Pacjent ${user.email} prosi o dostęp do swoich danych w Diet Care Platform.\nZaloguj się: https://dcp.care`,
    en: `Patient ${user.email} requests access to their data in Diet Care Platform.\nLog in: https://dcp.care`,
    de: `Der Patient ${user.email} bittet um Zugriff auf seine Daten in der Diet Care Platform.\nLogin: https://dcp.care`,
    fr: `Le patient ${user.email} demande l'accès à ses données dans Diet Care Platform.\nConnexion: https://dcp.care`,
    es: `El paciente ${user.email} solicita acceso a sus datos en Diet Care Platform.\nIniciar sesión: https://dcp.care`,
    ua: `Пацієнт ${user.email} просить доступ до своїх даних у Diet Care Platform.\nУвійти: https://dcp.care`,
    ru: `Пациент ${user.email} запрашивает доступ к своим данным в Diet Care Platform.\nВойти: https://dcp.care`,
    zh: `患者 ${user.email} 请求访问其在 Diet Care Platform 中的数据。\n登录: https://dcp.care`,
    ar: `المريض ${user.email} يطلب الوصول إلى بياناته في Diet Care Platform.\nتسجيل الدخول: https://dcp.care`,
    hi: `रोगी ${user.email} Diet Care Platform में अपने डेटा तक पहुँच का अनुरोध करता है।\nलॉगिन: https://dcp.care`,
    he: `המטופל ${user.email} מבקש גישה לנתוניו ב-Diet Care Platform.\nהתחברות: https://dcp.care`,
  };

  try {
    await resend.emails.send({
      from: "DCP <no-reply@dcp.care>",
      to: doctorEmail,
      subject: subjectMap[lang],
      text: textMap[lang],
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("[send-access-request-email] error:", err?.message || err);
    return res.status(500).json({ error: "Email sending failed" });
  }
}
