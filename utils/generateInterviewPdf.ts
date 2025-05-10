import { Meal, PatientData } from '@/types';
import { stampBase64 } from '@/utils/stamp';

export async function generateInterviewPdf(
  form: PatientData,
  bmi: number | null,
  interviewData: any,
  approved: boolean = false,
  logoBase64?: string
) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
pdfMake.vfs = pdfFonts.vfs; // ✅ Poprawnie

  const content: any[] = [
    { text: '📝 Wywiad dietetyczny', style: 'header' },
    { text: `Data: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 10] },
    {
      text: `Dane pacjenta:\nWiek: ${form.age} lat | Płeć: ${form.sex} | Waga: ${form.weight} kg | Wzrost: ${form.height} cm | BMI: ${bmi ?? 'n/a'}`,
      margin: [0, 0, 0, 10],
    },
    {
      text: `Schorzenia: ${form.conditions?.join(', ') || 'brak'}\nAlergie: ${form.allergies || 'brak'}\nRegion: ${form.region || 'brak'}`,
      margin: [0, 0, 0, 10],
    },
    {
      text: '🩺 Uwzględnione dane medyczne:',
      style: 'subheader',
      margin: [0, 10, 0, 4],
    },
    ...(form.medical ?? []).flatMap((entry: any) => [
      { text: `• ${entry.condition}`, bold: true, margin: [0, 4, 0, 0] },
      ...(entry.tests || []).map((test: any) => ({
        text: `   → ${test.name}: ${test.value || '—'}`,
        margin: [10, 0, 0, 0],
        fontSize: 10,
      })),
    ]),
    {
      text: '🧾 Informacje z wywiadu:',
      style: 'subheader',
      margin: [0, 10, 0, 6],
    },
    `Główne cele: ${interviewData.goal || 'brak'}`,
    `Dodatkowe cele: ${interviewData.goals?.join(', ') || 'brak'}`,
    `Model diety: ${interviewData.model || 'brak'}`,
    `Kuchnia: ${interviewData.cuisine || 'brak'}`,
    `Aktywność fizyczna: ${interviewData.activity || 'brak'}`,
    `Sen: ${interviewData.sleep || 'brak'}`,
    `Stres: ${interviewData.stress || 'brak'}`,
    `Gotowanie: ${interviewData.cookingHabits || 'brak'}`,
    `Budżet: ${interviewData.budgetLimits || 'brak'}`,
    `Preferencje żywieniowe: ${interviewData.foodPreferences || 'brak'}`,
    `Nietolerancje: ${interviewData.intolerances || 'brak'}`,
    `Suplementy: ${interviewData.supplements || 'brak'}`,
    `Leki: ${interviewData.medications || 'brak'}`,
    `Oczekiwania: ${interviewData.expectations || 'brak'}`,
    `Dotychczasowe diety: ${interviewData.previousDiets || 'brak'}`,
    `Obecna dieta: ${interviewData.currentDiet || 'brak'}`,
    `Uwagi: ${interviewData.otherNotes || 'brak'}`,
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
    text: '---\n© ALS sp. z o.o. | KRS 0000087600 | NIP 6252121456 | REGON 266795439\nEmail: a4p.email@gmail.com | tel. +48 500 720 242',
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
      ? [
          {
            image: logoBase64,
            width: 300,
            opacity: 0.06,
            absolutePosition: { x: 100, y: 200 },
          },
        ]
      : undefined,
  };

  pdfMake.createPdf(docDefinition).download(`wywiad_${new Date().toISOString().slice(0, 10)}.pdf`);
}
