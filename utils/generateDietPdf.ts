import { PatientData, Meal } from '@/types';
import { LangKey } from '@/utils/i18n';
import { tUI } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';
import QRCode from 'qrcode';
import { generateInterviewNarrative } from '@/utils/interview/interviewNarrativeMap';
import { generateShoppingList } from "@/utils/generateShoppingList";
import { getTranslation } from "@/utils/translations/useTranslationAgent";
import { convertInterviewAnswers } from "@/utils/interviewHelpers";

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
  const allergyList: string[] = [];

if (patient.allergies) {
  allergyList.push(...patient.allergies.toLowerCase().split(/[,\n;]/).map((a: string) => a.trim()));
}

if (interview?.section5?.q2) {
  allergyList.push(...interview.section5.q2.toLowerCase().split(/[,\n;]/).map((a: string) => a.trim()));
}

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
      { text: `• ${entry.condition}`, style: 'boldCell', margin: [0, 4, 0, 0] },
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
      const { structuredInterview, narrativeInput } = convertInterviewAnswers(interview);

      if (structuredInterview?.section5?.q2) {
        allergyList.push(...structuredInterview.section5.q2.toLowerCase().split(/[,\n;]/).map((a: string) => a.trim()));
      }

      content.push({ text: `🧠 ${tUI('interviewTitle', lang)}`, style: 'subheader', margin: [0, 10, 0, 4] });

      try {
        const narrative = generateInterviewNarrative(narrativeInput, lang, patient.sex || 'female');
        content.push({ text: narrative, margin: [0, 0, 0, 6] });
      } catch (err) {
        console.error('Błąd generowania narracji wywiadu:', err);
        content.push({ text: '⚠️ Błąd generowania opisu wywiadu', color: 'red' });
      }
    }


  content.push({
    text: `🍽️ ${tUI('recommendedDiet', lang)}`,
    style: 'subheader',
    margin: [0, 10, 0, 6]
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const polishDays: Record<string, string> = {
    Monday: 'Poniedziałek',
    Tuesday: 'Wtorek',
    Wednesday: 'Środa',
    Thursday: 'Czwartek',
    Friday: 'Piątek',
    Saturday: 'Sobota',
    Sunday: 'Niedziela'
  };
  const mealNames = ['Śniadanie', 'II śniadanie', 'Obiad', 'Kolacja'];

  function buildWeekGridTable(diet: Meal[]) {
    const table = [
      [{ text: tUI('day', lang), style: 'tableHeader' }, ...mealNames.map(name => ({ text: name, style: 'tableHeader' }))]
    ];

    weekDays.forEach(dayKey => {
      const dayMeals = diet.filter(m => (m as any).day === polishDays[dayKey]);
      const row = [
        { text: polishDays[dayKey], style: 'boldCell' }
      ];

      mealNames.forEach(mealType => {
        const meal = dayMeals.find(m => m.name === mealType);
        row.push({ text: meal?.menu || '—', style: 'smallCell' });
      });

      table.push(row);
    });

    return [
      {
        text: `📆 ${tUI('weeklyOverviewTitle', lang) || 'Podsumowanie tygodnia'}`,
        style: 'subheader',
        margin: [0, 10, 0, 6]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', '*', '*', '*'],
          body: table
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10]
      }
    ];
  }

  content.push(...buildWeekGridTable(diet));

  const groupedByDay: Record<string, Meal[]> = {};
  diet.forEach((meal) => {
    const day = (meal as any).day || tUI('other', lang);
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(meal);
  });
  async function getMealImageBase64(name: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(name);
    const res = await fetch(`https://source.unsplash.com/600x400/?${query}`);
    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    console.warn(`⚠️ Nie udało się pobrać zdjęcia dla: ${name}`, err);
    return null;
  }
}
  function getMealTags(meal: Meal): string[] {
  const tags: string[] = [];
  const text = `${meal.menu} ${meal.description || ""}`.toLowerCase();
  if (text.includes("wegań") || text.includes("vegan")) tags.push("vegan");
  if (text.includes("bezglut") || text.includes("gluten")) tags.push("glutenFree");
  if (text.includes("fodmap")) tags.push("lowFodmap");
  return tags;
}
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function summarizeNutritionWeekly(diet: Meal[]) {
  return diet.reduce(
    (acc, meal) => {
      acc.kcal += meal.calories || 0;
      acc.protein += meal.macros?.protein || 0;
      acc.fat += meal.macros?.fat || 0;
      acc.carbs += meal.macros?.carbs || 0;
      return acc;
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  );
}

  for (const [day, meals] of Object.entries(groupedByDay)) {
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
      ...await Promise.all(meals.map(async (meal) => {
        const image = await getMealImageBase64(meal.menu || meal.name);

        const tags = getMealTags(meal);
        const tagLabels = await Promise.all(
          tags.map(tag => getTranslation(`specialLabel${capitalize(tag)}`, lang))
        );

        return [
          {
            stack: [
              { text: meal.name, style: 'boldCell' },
              meal.description ? { text: meal.description, italics: true, margin: [0, 2, 0, 0] } : null,
              image ? {
                image,
                width: 120,
                margin: [0, 6, 0, 0]
              } : null,
              tagLabels.length > 0 ? {
                text: tagLabels.join(" • "),
                color: "#3BAA57",
                fontSize: 9,
                margin: [0, 4, 0, 0]
              } : null
            ].filter(Boolean)
          },
          meal.time || '–',
          {
            text: `🔥 ${meal.calories} kcal\n💉 IG: ${meal.glycemicIndex}`,
            alignment: 'center'
          },
          {
            text: meal.ingredients.map(i => {
              const isAllergen = allergyList.some((a: string) => i.product.toLowerCase().includes(a));
              const warn = isAllergen ? " ⚠️" : "";
              return `• ${i.product} – ${i.weight} g${warn}`;
            }).join('\n'),
            alignment: 'justify'
          }
        ];
      }))
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
  };
    const shoppingList = generateShoppingList(diet);

const translatedItems = await Promise.all(
  shoppingList.map(async item => {
    const translatedProduct = await getTranslation(item.product, lang);
    const translatedUnit = await getTranslation(item.unit, lang);
    return [translatedProduct, `${item.totalWeight}`, translatedUnit];
  })
);

content.push({
  text: tUI("shoppingListTitle", lang),
  style: "subheader",
  margin: [0, 10, 0, 6]
});

const listTable = {
  table: {
    widths: ['*', 'auto', 'auto'],
    body: [
      [
        { text: tUI("product", lang), style: "tableHeader" },
        { text: tUI("quantity", lang), style: "tableHeader" },
        { text: tUI("unit", lang), style: "tableHeader" }
      ],
      ...translatedItems
    ]
  },
  layout: "lightHorizontalLines",
  margin: [0, 0, 0, 10]
};

content.push(listTable);
function summarizeNutritionByDay(diet: Meal[]) {
  const byDay: Record<string, {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  }> = {};

  diet.forEach(meal => {
    const day = (meal as any).day || 'Inne';
    if (!byDay[day]) {
      byDay[day] = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    }
    byDay[day].kcal += meal.calories || 0;
    byDay[day].protein += meal.macros?.protein || 0;
    byDay[day].fat += meal.macros?.fat || 0;
    byDay[day].carbs += meal.macros?.carbs || 0;
  });

  return byDay;
}

const nutritionSummary = summarizeNutritionByDay(diet);

content.push({
  text: tUI("nutritionSummaryTitle", lang),
  style: "subheader",
  margin: [0, 10, 0, 6]
});

const summaryTable = {
  table: {
    widths: ['*', 'auto', 'auto', 'auto', 'auto'],
    body: [
      [
        { text: tUI("day", lang), style: "tableHeader" },
        { text: tUI("kcal", lang), style: "tableHeader" },
        { text: tUI("protein", lang), style: "tableHeader" },
        { text: tUI("fat", lang), style: "tableHeader" },
        { text: tUI("carbs", lang), style: "tableHeader" }

      ],
      ...Object.entries(nutritionSummary).map(([day, data]) => [
        day,
        Math.round(data.kcal),
        `${Math.round(data.protein)} g`,
        `${Math.round(data.fat)} g`,
        `${Math.round(data.carbs)} g`
      ])
    ]
  },
  layout: "lightHorizontalLines",
  margin: [0, 0, 0, 10]
};

content.push(summaryTable);
const weeklyTotal = summarizeNutritionWeekly(diet);

content.push({
  text: tUI("weeklyNutritionSummaryTitle", lang),
  style: "subheader",
  margin: [0, 10, 0, 6]
});

const weeklyTable = {
  table: {
    widths: ['*', 'auto', 'auto', 'auto', 'auto'],
    body: [
      [
        { text: tUI("week", lang), style: "tableHeader" },
        { text: "kcal", style: "tableHeader" },
        { text: tUI("protein", lang), style: "tableHeader" },
        { text: tUI("fat", lang), style: "tableHeader" },
        { text: tUI("carbs", lang), style: "tableHeader" }
      ],
      [
        tUI("total", lang),
        Math.round(weeklyTotal.kcal),
        `${Math.round(weeklyTotal.protein)} g`,
        `${Math.round(weeklyTotal.fat)} g`,
        `${Math.round(weeklyTotal.carbs)} g`
      ]
    ]
  },
  layout: "lightHorizontalLines",
  margin: [0, 0, 0, 10]
};

content.push(weeklyTable);

const docDefinition = {
  content,
  styles: {
    header: {
      fontSize: 18,
      bold: true,
      color: '#1d6f5e',
      margin: [0, 0, 0, 10]
    },
    subheader: {
      fontSize: 14,
      bold: true,
      color: '#1d6f5e'
    },
    tableHeader: {
      bold: true,
      fillColor: '#d2f4e9',
      color: '#0b4b3c',
      alignment: 'center'
    },
    footer: {
      fontSize: 14,
      color: '#1d6f5e',
      alignment: 'center',
      margin: [0, 10, 0, 0]
    },
    boldCell: { bold: true },
    smallCell: { fontSize: 9 }
  },
  defaultStyle: {
    fontSize: 11,
    alignment: 'justify',
    lineHeight: 1.4
  },
  background: function () {
    return {
      canvas: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: 595.28, // A4 width pt
          h: 841.89, // A4 height pt
          color: '#e8f8f3' // jasny seledyn
        }
      ]
    };
  },
  footer: function (currentPage: number, pageCount: number) {
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
    { width: '*', text: '' },
    {
      width: 'auto',
      image: qrBase64,
      fit: [100, 100],
      alignment: 'center'
    },
    { width: '*', text: '' }
  ],
  margin: [0, 30, 0, 0]
});

content.push({
  text: tUI('qrNotice', lang),
  style: 'footer',
  alignment: 'center',
  margin: [0, 10, 0, 30]
});
content.push({
  text: tUI("allergenLegend", lang) + " ⚠️",
  italics: true,
  fontSize: 10,
  margin: [0, 4, 0, 20]
});

pdfMake.createPdf(docDefinition).download(`dieta_${safeName}_${formattedDate}.pdf`);
}
