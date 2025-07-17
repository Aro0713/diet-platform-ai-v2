import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { doctorEmail, patientName, patientEmail, lang = 'pl' } = req.body;

  if (!doctorEmail || !patientName || !patientEmail) {
    console.warn('[send-diet-notification] ❌ Missing fields', { doctorEmail, patientName, patientEmail });
    return res.status(400).json({ error: 'Missing doctorEmail, patientName or patientEmail' });
  }

  const subjectMap: Record<string, string> = {
    pl: '🧾 Nowa dieta od pacjenta',
    en: '🧾 New diet from patient',
    de: '🧾 Neue Diät vom Patienten',
    fr: '🧾 Nouveau régime du patient',
    es: '🧾 Nueva dieta del paciente',
    ua: '🧾 Нова дієта від пацієнта',
    ru: '🧾 Новая диета от пациента',
    zh: '🧾 患者的新饮食计划',
    ar: '🧾 حمية جديدة من المريض',
    hi: '🧾 रोगी से नया डाइट प्लान',
    he: '🧾 תפריט חדש מהמטופל'
  };

  const htmlTemplate = (greeting: string, loginInstruction: string, signature: string) => `
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5">
      <p>${greeting}</p>
      <p><strong>${patientName}</strong> (<a href="mailto:${patientEmail}">${patientEmail}</a>) ${loginInstruction}</p>
      <p>
        <a href="https://dcp.care" style="padding:12px 24px;background:#4f46e5;color:white;
          border-radius:8px;text-decoration:none;display:inline-block;">
          🔐 Zaloguj się do DCP
        </a>
      </p>
      <p>${signature}</p>
    </div>`;

  const htmlMap: Record<string, string> = {
    pl: htmlTemplate(
      'Pacjent przesłał dietę do weryfikacji i akceptacji.',
      'przesłał dietę do weryfikacji. Aby się zalogować, przejdź na stronę DCP i użyj swojego loginu (adres e-mail), aby pobrać dane pacjenta.',
      'Pozdrawiamy, <br />Zespół DCP'
    ),
    en: htmlTemplate(
      'The patient has submitted a diet for review and approval.',
      'has submitted a diet for your review. Please log in to DCP using your email address to access the patient data.',
      'Best regards,<br />DCP Team'
    ),
    de: htmlTemplate(
      'Der Patient hat einen Diätplan zur Überprüfung und Genehmigung eingereicht.',
      'hat einen Diätplan eingereicht. Bitte melden Sie sich mit Ihrer E-Mail-Adresse bei DCP an, um auf die Patientendaten zuzugreifen.',
      'Mit freundlichen Grüßen,<br />Ihr DCP-Team'
    ),
    fr: htmlTemplate(
      'Le patient a soumis un régime pour examen et approbation.',
      'a soumis un régime. Connectez-vous à DCP avec votre adresse e-mail pour accéder aux données du patient.',
      'Cordialement,<br />L’équipe DCP'
    ),
    es: htmlTemplate(
      'El paciente ha enviado una dieta para revisión y aprobación.',
      'ha enviado una dieta. Inicia sesión en DCP con tu correo electrónico para acceder a los datos del paciente.',
      'Atentamente,<br />Equipo DCP'
    ),
    ua: htmlTemplate(
      'Пацієнт надіслав дієту для перевірки та затвердження.',
      'надіслав дієту. Увійдіть до DCP, використовуючи свою електронну адресу, щоб отримати дані пацієнта.',
      'З повагою,<br />Команда DCP'
    ),
    ru: htmlTemplate(
      'Пациент отправил диету на проверку и утверждение.',
      'отправил диету. Войдите в DCP, используя свой email, чтобы получить данные пациента.',
      'С уважением,<br />Команда DCP'
    ),
    zh: htmlTemplate(
      '患者提交了饮食计划以供审核和批准。',
      '提交了饮食计划。请使用您的电子邮件登录 DCP 以获取患者数据。',
      '此致,<br />DCP 团队'
    ),
    ar: htmlTemplate(
      'قام المريض بإرسال خطة غذائية للمراجعة والموافقة.',
      'أرسل خطة غذائية. الرجاء تسجيل الدخول إلى DCP باستخدام بريدك الإلكتروني للوصول إلى بيانات المريض.',
      'مع تحيات,<br />فريق DCP'
    ),
    hi: htmlTemplate(
      'रोगी ने समीक्षा और अनुमोदन के लिए एक डाइट योजना भेजी है।',
      'ने डाइट भेजी है। कृपया अपनी ईमेल आईडी से DCP में लॉगिन करें और मरीज की जानकारी प्राप्त करें।',
      'सादर,<br />DCP टीम'
    ),
    he: htmlTemplate(
      'המטופל שלח תפריט לבדיקה ואישור.',
      'שלח תפריט. התחבר ל-DCP עם כתובת האימייל שלך כדי לצפות בפרטי המטופל.',
      'בברכה,<br />צוות DCP'
    )
  };

  const subject = subjectMap[lang] || subjectMap['pl'];
  const html = htmlMap[lang] || htmlMap['pl'];
  const text = `Pacjent ${patientName} (${patientEmail}) przesłał dietę do weryfikacji.\nZaloguj się do DCP: https://dcp.care`;
  const from = 'DCP <no-reply@dcp.care>';

  // ✅ Log debugowy
  console.log('[send-diet-notification] Sending email with:', {
    from,
    to: doctorEmail,
    subject,
    text,
    htmlSnippet: html?.slice(0, 100) + '...'
  });
  
  console.log('[DEBUG] RESEND_API_KEY (first 8) =', process.env.RESEND_API_KEY?.slice(0, 8));

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: doctorEmail,
        subject,
        text,
        html
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[send-diet-notification] ❌ Resend API error:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    console.log('[send-diet-notification] ✅ Email sent:', data);
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('[send-diet-notification] ❌ Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}