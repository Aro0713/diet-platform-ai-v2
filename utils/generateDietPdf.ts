import { PatientData, Meal } from '@/types';
import { LangKey } from '@/utils/i18n';
import { tUI } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';
import QRCode from 'qrcode';

export async function generateDietPdf(
  patient: PatientData,
  bmi: number | null,
  diet: Meal[],
  approved: boolean = false,
  notes: Record<string, string> = {},
  lang: LangKey = 'pl',
  interview?: any,
  calc?: {
    bmi: number;
    ppm: number;
    cpm: number;
    pal: number;
    kcalMaintain: number;
    kcalReduce: number;
    kcalGain: number;
    nmcBroca: number;
    nmcLorentz: number;
  },
  mode: 'download' | 'returnDoc' = 'download'
) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = pdfFonts.vfs;

  const content: any[] = [];

  content.push({
    text: `📋 ${tUI('dietPlanTitle', lang)}`,
    style: 'header'
  });

  content.push({
    text: `${tUI('date', lang)}: ${new Date().toLocaleString()}`,
    margin: [0, 0, 0, 10]
  });

  content.push({
    text: `${tUI('patientData', lang)}:
${tUI('age', lang)}: ${patient.age} | ${tUI('sex', lang)}: ${tUI(patient.sex, lang)} | ${tUI('weight', lang)}: ${patient.weight} kg | ${tUI('height', lang)}: ${patient.height} cm | BMI: ${bmi ?? 'n/a'}`,
    margin: [0, 0, 0, 10]
  });

  content.push({
    text: `${tUI('conditions', lang)}: ${patient.conditions?.join(', ') || tUI('none', lang)}
${tUI('allergies', lang)}: ${patient.allergies || tUI('none', lang)}
${tUI('region', lang)}: ${patient.region || tUI('none', lang)}`,
    margin: [0, 0, 0, 10]
  });

  content.push({
    text: `🩺 ${tUI('medicalDataIncluded', lang)}`,
    style: 'subheader',
    margin: [0, 10, 0, 4]
  });

  content.push(
    ...(patient.medical ?? []).flatMap((entry) => [
      { text: `• ${entry.condition}`, bold: true, margin: [0, 4, 0, 0] },
      ...entry.tests.map((test) => ({
        text: `   → ${test.name}: ${test.value || '—'}`,
        margin: [0, 0, 0, 2]
      }))
    ])
  );

  if (interview?.recommendation) {
    content.push({
      text: `📋 ${tUI('doctorRecommendation', lang)}:
${interview.recommendation}`,
      italics: true,
      margin: [0, 10, 0, 4]
    });
  }

  if (calc) {
    content.push({ text: `📊 ${tUI('calculationBlockTitle', lang)}`, style: 'subheader', margin: [0, 10, 0, 4] });
    content.push({
      ul: [
        `BMI: ${calc.bmi}`,
        `PPM: ${calc.ppm} kcal`,
        `CPM: ${calc.cpm} kcal`,
        `PAL: ${calc.pal}`,
        `Kcal (utrzymanie): ${calc.kcalMaintain} kcal`,
        `Kcal (redukcja): ${calc.kcalReduce} kcal`,
        `Kcal (przyrost): ${calc.kcalGain} kcal`,
        `NMC Broca: ${calc.nmcBroca} kg`,
        `NMC Lorentz: ${calc.nmcLorentz} kg`
      ]
    });
  }

  if (interview) {
    content.push({ text: `🧠 ${tUI('interviewTitle', lang)}`, style: 'subheader', margin: [0, 10, 0, 4] });

    const keysToShow = ['stressLevel', 'sleepQuality', 'physicalActivity', 'activityDetails', 'otherInfo'];
    keysToShow.forEach((key) => {
      if (interview[key]) {
        content.push({ text: `• ${tUI(key, lang)}: ${interview[key]}`, margin: [0, 0, 0, 2] });
      }
    });

    Object.entries(interview ?? {}).forEach(([section, sectionValue]) => {
      if (
        section !== "recommendation" &&
        typeof sectionValue === "object" &&
        sectionValue !== null &&
        !Array.isArray(sectionValue)
      ) {
        content.push({ text: `► ${tUI(section, lang) || section}`, bold: true, margin: [0, 6, 0, 2] });

        Object.entries(sectionValue ?? {}).forEach(([qKey, qValue]) => {
          if (typeof qValue === "string" || typeof qValue === "number") {
            content.push({ text: `• ${tUI(qKey, lang) || qKey}: ${qValue}`, margin: [0, 0, 0, 2] });
          }
        });
      }
    });
  }

  content.push({
    text: `🍽️ ${tUI('recommendedDiet', lang)}`,
    style: 'subheader',
    margin: [0, 10, 0, 6]
  });

  const groupedByDay: Record<string, Meal[]> = {};
  diet.forEach((meal) => {
    const day = (meal as any).day || tUI('other', lang);
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(meal);
  });

  Object.entries(groupedByDay).forEach(([day, meals]) => {
    content.push({ text: `🗓️ ${day}`, style: 'subheader', margin: [0, 10, 0, 4] });

const mealTable = {
  table: {
    widths: ['auto', 'auto', 'auto', '*'],
    body: [
      [
        { text: tUI('mealName', lang), style: 'tableHeader' },
        { text: tUI('time', lang), style: 'tableHeader' },
        { text: `${tUI('calories', lang)} / IG`, style: 'tableHeader' },
        { text: tUI('ingredients', lang), style: 'tableHeader' }
      ],
      ...meals.map((meal) => [
        {
          stack: [
            { text: meal.name, bold: true },
           meal.description ? { text: meal.description, italics: true, margin: [0, 2, 0, 0] } : null
          ].filter(Boolean)
        },
        meal.time || '–',
        {
          text: `🔥 ${meal.calories} kcal\n💉 IG: ${meal.glycemicIndex}`,
          alignment: 'center'
        },
        {
          text: meal.ingredients.map(i => `• ${i.product} – ${i.weight} g`).join('\n'),
          alignment: 'justify'
        }
      ])
    ]
  },
  layout: 'lightHorizontalLines',
  margin: [0, 0, 0, 10]
};


    content.push(mealTable);

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

const docDefinition = {
  content,
  styles: {
    header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
    subheader: { fontSize: 14, bold: true },
    tableHeader: { bold: true, fillColor: '#f2f2f2', alignment: 'center' },
    footer: { fontSize: 14, color: '#3BAA57', alignment: 'center', margin: [0, 10, 0, 0] }
  },
  defaultStyle: {
    fontSize: 11
  },
  background: undefined,

  footer: function(currentPage: number, pageCount: number) {
    return {
      text: `© Diet Care Platform — contact@dcp.care | Strona ${currentPage} z ${pageCount}`,
      style: 'footer'
    };
  }
};

  const formattedDate = new Date().toISOString().slice(0, 10);
  const safeName = patient.name?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "pacjent";
  const qrBase64 = await QRCode.toDataURL('https://www.dcp.care');

content.push({
  columns: [
    {
      width: '*',
      text: ''
    },
    {
      width: 'auto',
      image: qrBase64,
      fit: [100, 100],  
      alignment: 'center'
    },
    {
      width: '*',
      text: ''
    }
  ],
  margin: [0, 30, 0, 0]
});


content.push({
  text: 'Zeskanuj kod QR, aby odwiedzić platformę DCP: www.dcp.care',
  style: 'footer',
  alignment: 'center',
  margin: [0, 10, 0, 30]
});

  pdfMake.createPdf(docDefinition).download(`dieta_${safeName}_${formattedDate}.pdf`);
}
