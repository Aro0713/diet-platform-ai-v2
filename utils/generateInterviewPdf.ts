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

  const content: any[] = [
    { text: tUI('interviewPdfTitle', lang), style: 'header' },
    {
      text: `Data: ${new Date().toLocaleDateString()} | Płeć: ${sex}`,
      margin: [0, 0, 0, 10]
    },

    { text: tUI('narrativeSummary', lang), style: 'subheader' },
    {
      text: narrativeText?.trim() || '⚠️ Brak opisu narracyjnego',
      italics: true,
      margin: [0, 0, 0, 10]
    },

    { text: tUI('rawAnswers', lang), style: 'subheader' },
    ...Object.entries(interview).map(([key, value]) => ({
      text: `${key}: ${value}`,
      fontSize: 10,
      margin: [0, 2, 0, 0],
    }))
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
    text: '---\n© Diet Care Platform\nEmail: contact@dcp.care',
    style: 'footer',
    margin: [0, 30, 0, 0],
    alignment: 'center',
  });

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true },
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

  pdfMake.createPdf(docDefinition).open();
}
