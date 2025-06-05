import { PatientData, Meal } from '@/types';
import { stampBase64 } from '@/utils/stamp';
import { LangKey, tUI } from '@/utils/i18n';

export async function generateFullDietPdf(
  patient: PatientData,
  bmi: number | null,
  diet: Meal[],
  interviewData: any,
  calculator: {
    ppm: number;
    cpm: number;
    pal: number;
    kcalMaintain: number;
    kcalReduce: number;
    kcalGain: number;
    nmcBroca: number;
    nmcLorentz: number;
  },
  approved: boolean = false,
  notes: Record<string, string> = {},
  lang: LangKey = 'pl',
  logoBase64?: string
) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = pdfFonts.vfs;

  const content: any[] = [
    { text: `📋 ${tUI('dietPlanTitle', lang)}`, style: 'header' },
    { text: `${tUI('date', lang)}: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 10] },
    {
      text: `${tUI('patientData', lang)}:\n${tUI('age', lang)}: ${patient.age} | ${tUI('sex', lang)}: ${tUI(patient.sex, lang)} | ${tUI('weight', lang)}: ${patient.weight} kg | ${tUI('height', lang)}: ${patient.height} cm | BMI: ${bmi ?? 'n/a'}`,
      margin: [0, 0, 0, 10]
    },
    {
      text: `${tUI('conditions', lang)}: ${patient.conditions?.join(', ') || tUI('none', lang)}\n${tUI('allergies', lang)}: ${patient.allergies || tUI('none', lang)}\n${tUI('region', lang)}: ${patient.region || tUI('none', lang)}`,
      margin: [0, 0, 0, 10]
    },
    {
      text: `🧮 ${tUI('calculator', lang)}`,
      style: 'subheader',
      margin: [0, 10, 0, 4]
    },
    {
      text: `PPM: ${calculator.ppm} kcal\nCPM: ${calculator.cpm} kcal\nPAL: ${calculator.pal}\nKcal na utrzymanie: ${calculator.kcalMaintain}\nRedukcja: ${calculator.kcalReduce}\nPrzyrost: ${calculator.kcalGain}\nNMC Broca: ${calculator.nmcBroca} kg\nNMC Lorentz: ${calculator.nmcLorentz} kg`,
      fontSize: 10,
      margin: [0, 0, 0, 10]
    },
    {
      text: `🩺 ${tUI('medicalDataIncluded', lang)}`,
      style: 'subheader',
      margin: [0, 10, 0, 4]
    },
    ...(patient.medical ?? []).flatMap((entry) => [
      { text: `• ${entry.condition}`, bold: true, margin: [0, 4, 0, 0] },
      ...entry.tests.map((test) => ({
        text: `   → ${test.name}: ${test.value || '—'}`,
        margin: [0, 0, 0, 2], fontSize: 10
      }))
    ]),
    {
      text: `🧾 ${tUI('interviewData', lang)}`,
      style: 'subheader',
      margin: [0, 10, 0, 6]
    },
    ...Object.entries(interviewData).map(([key, value]) => ({
      text: `${key}: ${String(value)}`,
      fontSize: 10,
      margin: [0, 0, 0, 2]
    })),
    {
      text: `🍴 ${tUI('recommendedDiet', lang)}`,
      style: 'subheader',
      margin: [0, 10, 0, 6]
    }
  ];

  const groupedByDay: Record<string, Meal[]> = {};
  diet.forEach((meal) => {
    const day = (meal as any).day || tUI('other', lang);
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(meal);
  });

  Object.entries(groupedByDay).forEach(([day, meals]) => {
    content.push({
      text: `📅 ${day}`,
      style: 'subheader',
      margin: [0, 10, 0, 4]
    });

    content.push({
      table: {
        widths: ['*', 'auto', 'auto', '*'],
        body: [
          [
            { text: tUI('mealName', lang), style: 'tableHeader' },
            { text: tUI('time', lang), style: 'tableHeader' },
            { text: `${tUI('calories', lang)} / IG`, style: 'tableHeader' },
            { text: tUI('ingredients', lang), style: 'tableHeader' }
          ],
          ...meals.map((meal) => [
            { text: meal.name, bold: true },
            meal.time || '–',
            `🔥 ${meal.calories} kcal\n💉 IG: ${meal.glycemicIndex}`,
            meal.ingredients.map(i => `• ${i.product} – ${i.weight} g`).join('\n')
          ])
        ]
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 10]
    });

    if (notes[day]) {
      content.push({
        text: `📝 ${tUI('note', lang)}: ${notes[day]}`,
        italics: true,
        fontSize: 10,
        color: 'gray',
        margin: [0, 0, 0, 10]
      });
    }
  });

  if (approved) {
    content.push({
      image: stampBase64,
      width: 140,
      alignment: 'right',
      margin: [0, 30, 0, 0]
    });
  }

  content.push({
    text: '---\n© ALS sp. z o.o. | KRS 0000087600 | NIP 6252121456 | REGON 266795439\nEmail: kontakt@dcp.care | tel. +48 500 720 242',
    style: 'footer',
    margin: [0, 30, 0, 0],
    alignment: 'center'
  });

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true },
      tableHeader: { bold: true, fillColor: '#f2f2f2', alignment: 'center' },
      footer: { fontSize: 9, color: 'gray' }
    },
    defaultStyle: {
      fontSize: 11
    },
    background: logoBase64
      ? [{ image: logoBase64, width: 300, opacity: 0.06, absolutePosition: { x: 100, y: 200 } }]
      : undefined
  };

  pdfMake.createPdf(docDefinition).open();
}
