// File: supabase/functions/send-diet-email/index.ts

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!;
const FROM_EMAIL = 'contact@dcp.care';

const _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


const subjectTranslations: Record<string, string> = {
  pl: 'Twoja indywidualna dieta jest gotowa ✅',
  en: 'Your personalized diet is ready ✅',
  es: 'Tu dieta personalizada está lista ✅',
  fr: 'Votre régime personnalisé est prêt ✅',
  de: 'Dein individueller Diätplan ist fertig ✅',
  ua: 'Ваш індивідуальний раціон готовий ✅',
  ru: 'Ваша индивидуальная диета готова ✅',
  zh: '您的个性化饮食已准备好 ✅',
  hi: 'आपका व्यक्तिगत आहार तैयार है ✅',
  ar: 'نظامك الغذائي الشخصي جاهز ✅',
  he: 'התזונה האישית שלך מוכנה ✅'
};

const messageTranslations: Record<string, string> = {
  pl: 'W załączniku znajdziesz PDF z indywidualnie przygotowaną dietą. Jeśli masz pytania, odpowiedz na tego maila.',
  en: 'Your personalized diet is attached as a PDF. If you have any questions, feel free to reply to this email.',
  es: 'Tu dieta personalizada está en el archivo adjunto PDF. Si tienes preguntas, responde a este correo.',
  fr: 'Votre régime est en pièce jointe au format PDF. Pour toute question, répondez simplement à ce mail.',
  de: 'Dein Diätplan ist als PDF beigefügt. Bei Fragen antworte einfach auf diese E-Mail.',
  ua: 'Ваш план харчування додається у вигляді PDF. Якщо виникли питання, просто відповідайте.',
  ru: 'Ваш план питания прикреплён в PDF. При возникновении вопросов — просто ответьте на это письмо.',
  zh: '您的饮食计划作为 PDF 附件发送。如有任何问题，请直接回复本邮件。',
  hi: 'आपका आहार योजना पीडीएफ के रूप में संलग्न है। किसी भी प्रश्न के लिए, कृपया उत्तर दें।',
  ar: 'تم إرفاق خطة النظام الغذائي الخاصة بك بصيغة PDF. لأي استفسار، يرجى الرد على هذا البريد.',
  he: 'תוכנית התזונה שלך מצורפת כקובץ PDF. יש שאלות? אתה מוזמן להשיב.'
};

serve(async (req: Request) => {

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { to, lang, pdfBase64 } = await req.json();

    if (!to || !lang || !pdfBase64) {
      return new Response('Missing parameters', { status: 400 });
    }

    const subject = subjectTranslations[lang] || subjectTranslations['en'];
    const message = messageTranslations[lang] || messageTranslations['en'];

    const emailPayload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject
        }
      ],
      from: { email: FROM_EMAIL, name: 'Diet Care Platform' },
      content: [
        {
          type: 'text/plain',
          value: message
        }
      ],
      attachments: [
        {
          content: pdfBase64,
          filename: `dieta_${new Date().toISOString().slice(0, 10)}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    };

    const send = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!send.ok) {
      const error = await send.text();
      console.error('SendGrid error:', error);
      return new Response('Failed to send email', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Server error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
