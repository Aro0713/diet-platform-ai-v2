import { stampBase64 } from '@/utils/stamp';
import { tUI, LangKey } from '@/utils/i18n';

interface InterviewPdfParams {
  lang: LangKey;
  sex: 'female' | 'male';
  interview: Record<string, string>;
  narrativeText: string;
  approved?: boolean;
  logoBase64?: string;
}

export async function generateInterviewPdf({
  lang,
  sex,
  interview,
  narrativeText,
  approved = false,
  logoBase64
}: InterviewPdfParams) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = pdfFonts.vfs;

  // 🧠 Przetłumaczona płeć
  const sexLabel = sex === 'female' ? tUI('female', lang) : tUI('male', lang);

  const content: any[] = [
    { text: tUI('interviewPdfTitle', lang), style: 'header' },

    {
      text: `${tUI('interviewDate', lang)}: ${new Date().toLocaleDateString()} | ${tUI('sex', lang)}: ${sexLabel}`,
      margin: [0, 0, 0, 10]
    },

    { text: tUI('narrativeSummary', lang), style: 'subheader' },
    {
      text: narrativeText?.trim() || '⚠️ Brak opisu narracyjnego',
      italics: true,
      margin: [0, 0, 0, 20]
    },

    // ❗Opcjonalnie – jeśli chcesz też zachować surowe odpowiedzi:
    /*
    { text: tUI('rawAnswers', lang), style: 'subheader', margin: [0, 10, 0, 5] },
    ...Object.entries(interview).map(([key, value]) => ({
      text: `${key}: ${value}`,
      fontSize: 9,
      margin: [0, 1, 0, 0],
    })),
    */
  ];

  if (approved) {
    content.push({
      image: stampBase64,
      width: 140,
      alignment: 'right',
      margin: [0, 30, 0, 0],
    });
  }

  content.push({
    text: '© Diet Care Platform — contact@dcp.care',
    style: 'footer',
    margin: [0, 40, 0, 0],
    alignment: 'center',
  });

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      footer: { fontSize: 9, color: 'gray' },
    },
    defaultStyle: {
      fontSize: 11,
    },
    background: logoBase64
      ? [{
          image: logoBase64,
          width: 300,
          opacity: 0.06,
          absolutePosition: { x: 100, y: 200 },
        }]
      : undefined,
  };

  // ✅ pobranie, zamiast open()
  pdfMake.createPdf(docDefinition).download("wywiad_dietetyczny.pdf");
}
