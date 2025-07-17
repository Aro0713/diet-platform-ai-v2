import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { patientEmail, patientName, lang = 'pl' } = req.body;

  if (!patientEmail || !patientName) {
    console.warn('[send-diet-approved] ❌ Missing fields', { patientEmail, patientName });
    return res.status(400).json({ error: 'Missing patientEmail or patientName' });
  }

  const subjectMap: Record<string, string> = {
    pl: '✅ Twoja dieta została zatwierdzona!',
    en: '✅ Your diet has been approved!',
    de: '✅ Dein Diätplan wurde genehmigt!',
    fr: '✅ Votre régime a été approuvé !',
    es: '✅ Tu dieta ha sido aprobada!',
    ua: '✅ Вашу дієту підтверджено!',
    ru: '✅ Ваша диета утверждена!',
    zh: '✅ 您的饮食计划已获批准！',
    ar: '✅ تمت الموافقة على نظامك الغذائي!',
    hi: '✅ आपकी डाइट स्वीकृत हो गई है!',
    he: '✅ הדיאטה שלך אושרה!'
  };

  const htmlTemplate = (header: string, action: string, signature: string) => `
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5">
      <p><strong>${header}</strong></p>
      <p>${patientName}, ${action}</p>
      <p>
        <a href="https://dcp.care/panel" style="padding:12px 24px;background:#4f46e5;color:white;
          border-radius:8px;text-decoration:none;display:inline-block;">
          🔍 Zobacz dietę w DCP
        </a>
      </p>
      <p>${signature}</p>
    </div>
  `;

  const htmlMap: Record<string, string> = {
    pl: htmlTemplate(
      'Dieta została zatwierdzona przez lekarza lub dietetyka.',
      'możesz ją teraz przejrzeć w panelu DCP.',
      'Pozdrawiamy,<br />Zespół DCP'
    ),
    en: htmlTemplate(
      'Your diet has been approved by your doctor or dietitian.',
      'you can now view it in the DCP panel.',
      'Best regards,<br />DCP Team'
    ),
    de: htmlTemplate(
      'Dein Diätplan wurde von deinem Arzt oder Ernährungsberater genehmigt.',
      'Du kannst ihn jetzt im DCP-Panel einsehen.',
      'Mit freundlichen Grüßen,<br />Dein DCP-Team'
    ),
    fr: htmlTemplate(
      'Votre régime a été approuvé par votre médecin ou diététicien.',
      'Vous pouvez maintenant le consulter dans le panneau DCP.',
      'Cordialement,<br />L’équipe DCP'
    ),
    es: htmlTemplate(
      'Tu dieta ha sido aprobada por tu médico o dietista.',
      'Ya puedes verla en el panel de DCP.',
      'Atentamente,<br />Equipo DCP'
    ),
    ua: htmlTemplate(
      'Вашу дієту затвердив лікар або дієтолог.',
      'Ви можете переглянути її у панелі DCP.',
      'З повагою,<br />Команда DCP'
    ),
    ru: htmlTemplate(
      'Вашу диету утвердил врач или диетолог.',
      'Теперь вы можете просмотреть её в панели DCP.',
      'С уважением,<br />Команда DCP'
    ),
    zh: htmlTemplate(
      '您的饮食计划已获得医生或营养师的批准。',
      '您现在可以在 DCP 面板中查看它。',
      '此致敬礼，<br />DCP 团队'
    ),
    ar: htmlTemplate(
      'تمت الموافقة على نظامك الغذائي من قبل الطبيب أو اختصاصي التغذية.',
      'يمكنك الآن عرضه في لوحة DCP.',
      'مع تحيات,<br />فريق DCP'
    ),
    hi: htmlTemplate(
      'आपकी डाइट को डॉक्टर या डाइटिशियन ने मंजूरी दे दी है।',
      'अब आप इसे DCP पैनल में देख सकते हैं।',
      'सादर,<br />DCP टीम'
    ),
    he: htmlTemplate(
      'התפריט שלך אושר על ידי הרופא או הדיאטנית.',
      'תוכל לצפות בו עכשיו בלוח הבקרה של DCP.',
      'בברכה,<br />צוות DCP'
    )
  };

  const subject = subjectMap[lang] || subjectMap['pl'];
  const html = htmlMap[lang] || htmlMap['pl'];
  const text = `${patientName}, Twoja dieta została zatwierdzona. Zaloguj się: https://dcp.care/panel`;

  const resendKey = process.env.RESEND_API_KEY || 're_D98FQu3q_JdmvKPSHLVGtMv86pU2LrFDz'; // 🔒 fallback klucz
  const from = 'DCP <no-reply@dcp.care>';

  console.log('[send-diet-approved] Sending mail to:', patientEmail);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: patientEmail,
        subject,
        text,
        html
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[send-diet-approved] ❌ Resend API error:', error);
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    console.log('[send-diet-approved] ✅ Email sent:', data);
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('[send-diet-approved] ❌ Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
