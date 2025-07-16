// pages/api/send-diet-notification.ts

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { doctorEmail, patientName, lang = 'pl' } = req.body;

  if (!doctorEmail || !patientName) {
    return res.status(400).json({ error: 'Missing doctorEmail or patientName' });
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

  const plainTextMap: Record<string, string> = {
    pl: `Pacjent ${patientName} przesłał dietę do weryfikacji.\nhttps://dcp.care/panel`,
    en: `Patient ${patientName} submitted a diet for review.\nhttps://dcp.care/panel`,
    de: `Patient ${patientName} hat eine Diät zur Überprüfung eingereicht.\nhttps://dcp.care/panel`,
    fr: `Le patient ${patientName} a soumis un régime à vérifier.\nhttps://dcp.care/panel`,
    es: `El paciente ${patientName} ha enviado una dieta para revisión.\nhttps://dcp.care/panel`,
    ua: `Пацієнт ${patientName} надіслав дієту для перевірки.\nhttps://dcp.care/panel`,
    ru: `Пациент ${patientName} отправил диету на проверку.\nhttps://dcp.care/panel`,
    zh: `患者 ${patientName} 提交了饮食计划以供审核。\nhttps://dcp.care/panel`,
    ar: `المريض ${patientName} أرسل حمية للمراجعة.\nhttps://dcp.care/panel`,
    hi: `रोगी ${patientName} ने डाइट प्लान भेजा है।\nhttps://dcp.care/panel`,
    he: `המטופל ${patientName} שלח תפריט לבדיקה.\nhttps://dcp.care/panel`
  };

  const htmlMap: Record<string, string> = {
    pl: `
      <h2>🧾 Nowa dieta od pacjenta</h2>
      <p>Pacjent <strong>${patientName}</strong> przesłał dietę do weryfikacji.</p>
      <p>
        <a href="https://dcp.care/panel" style="padding:12px 24px;background:#4f46e5;color:white;
          border-radius:8px;text-decoration:none;display:inline-block;">
          🔍 Otwórz panel DCP
        </a>
      </p>`,
    en: `
      <h2>🧾 New diet from patient</h2>
      <p>Patient <strong>${patientName}</strong> submitted a diet for your review.</p>
      <p>
        <a href="https://dcp.care/panel" style="padding:12px 24px;background:#4f46e5;color:white;
          border-radius:8px;text-decoration:none;display:inline-block;">
          🔍 Open DCP Panel
        </a>
      </p>`
    // TODO: możesz dodać inne języki analogicznie
  };

  const subject = subjectMap[lang] || subjectMap['pl'];
  const text = plainTextMap[lang] || plainTextMap['pl'];
  const html = htmlMap[lang] || htmlMap['pl'];

  try {
    const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
        Authorization: process.env.RESEND_API_KEY || '', // re_xxx
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        from: 'DCP <no-reply@dcp.care>',
        to: doctorEmail,
        subject,
        text,
        html
    })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
