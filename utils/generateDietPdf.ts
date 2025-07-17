import { PatientData, Meal } from '@/types';
import { LangKey } from '@/utils/i18n';
import { tUI } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';
import QRCode from 'qrcode';
import generateInterviewNarrative from '@/utils/interview/interviewNarrativeMap';
import { generateShoppingList } from '@/utils/generateShoppingList';
import { getTranslation } from '@/utils/translations/useTranslationAgent';
import { convertInterviewAnswers } from '@/utils/interviewHelpers';
import { supabase } from '@/lib/supabaseClient';
import { translatedTitles } from '@/utils/translatedTitles';

type Recipe = {
  dish: string;
  description: string;
  servings: number;
  ingredients: { product: string; weight: number; unit: string }[];
  steps: string[];
  time?: string;
};

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
  mode: 'download' | 'returnDoc' = 'download',
  narrativeText?: string,
  recipes?: Record<string, Record<string, Recipe>>
)

{
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  let dietitianSignature = tUI('missingData', lang);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('name, title, role')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const title = data.title && translatedTitles[data.title as 'dr' | 'drhab' | 'prof']?.[lang];
        const role = translationsUI[data.role as 'doctor' | 'dietitian']?.[lang];
        dietitianSignature = `${title ? `${title} ` : ''}${data.name}${role ? ` – ${role}` : ''}`;
      }

      if (error) console.warn('⚠️ Błąd pobierania danych dietetyka:', error.message);
    }
  } catch (err) {
    console.error('❌ Błąd Supabase podczas pobierania danych dietetyka:', err);
  }

  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = pdfFonts.vfs;
let finalNarrative = narrativeText;

if (!finalNarrative) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/interview-narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewData: interview,
        goal: '', // jeśli masz dostępne: zamień na `goal`
        recommendation: '', // jeśli masz dostępne: zamień na `recommendation`
        lang
      })
    });

    if (!response.ok) throw new Error(`AI API failed with status ${response.status}`);
    const json = await response.json();
    finalNarrative = json.narrativeText?.trim() || '';
  } catch (err) {
    console.error('❌ Błąd agent interviewNarrativeAgent (fetch):', err);
    finalNarrative = '⚠️ Błąd generowania opisu wywiadu przez AI';
  }
}

  const content: any[] = [];
  const allergyList: string[] = [];

  const startDate = diet[0]?.date || new Date().toISOString().slice(0, 10);
  const endDate = diet[diet.length - 1]?.date || new Date().toISOString().slice(0, 10);

  // ✅ Strona tytułowa
  content.push(
  { text: patient.name, style: 'header', alignment: 'center', fontSize: 26, margin: [0, 60, 0, 10] },
  { text: `${startDate} – ${endDate}`, alignment: 'center', fontSize: 14, margin: [0, 0, 0, 20] },
  { text: `${tUI('dietitianSignature', lang)}: ${dietitianSignature}`, alignment: 'center', fontSize: 12 },
  {
  text: tUI('tagline', lang),
  alignment: 'center',
  italics: true,
  fontSize: 22,
  color: '#1f2a3c', // Ciemnogranatowy jak na screenie
  margin: [0, 20, 0, 0]
},
  { text: '', pageBreak: 'after' }
);

if (patient.model === 'Dieta eliminacyjna') {
  content.push({
    text: tUI('eliminationDietPdfWarning', lang),
    style: 'warning',
    margin: [0, 10, 0, 10],
    color: 'red',
    bold: true
  });
}
  // ✅ Dane pacjenta
  content.push({ text: `📋 ${tUI('dietPlanTitle', lang)}`, style: 'header' });
  content.push({ text: `${tUI('date', lang)}: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 10] });
  content.push({
    text: `${tUI('patientData', lang)}:
${tUI('age', lang)}: ${patient.age ?? tUI('missingData', lang)} | ${tUI('sex', lang)}: ${tUI(patient.sex, lang)} | ${tUI('weight', lang)}: ${patient.weight ?? '?'} kg | ${tUI('height', lang)}: ${patient.height ?? '?'} cm | BMI: ${bmi ?? 'n/a'}`,
    margin: [0, 0, 0, 10]
  });

  content.push({
    text: `${tUI('conditions', lang)}: ${patient.conditions?.join(', ') || tUI('none', lang)}
${tUI('allergies', lang)}: ${patient.allergies || tUI('none', lang)}
${tUI('region', lang)}: ${patient.region ? await getTranslation(patient.region, lang) : tUI('missingData', lang)}`,
    margin: [0, 0, 0, 10]
  });

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
      allergyList.push(...structuredInterview.section5.q2.toLowerCase().split(/[\n;,]/).map(a => a.trim()));
    }

    content.push({ text: `🧠 ${tUI('interviewTitle', lang)}`, style: 'subheader', margin: [0, 10, 0, 4] });

    content.push({ text: finalNarrative || '⚠️ Brak opisu narracyjnego', margin: [0, 0, 0, 6] });
  }

  const groupedByDay: Record<string, Meal[]> = {};
  diet.forEach((meal) => {
    const day = (meal as any).day || 'Inne';
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(meal);
  });

  for (const [day, meals] of Object.entries(groupedByDay)) {
    content.push({ text: `🗓️ ${day}`, style: 'subheader', margin: [0, 10, 0, 4] });

    const dayTableBody = [
      [
        { text: tUI('mealName', lang), style: 'tableHeader' },
        { text: tUI('time', lang), style: 'tableHeader' },
        { text: `${tUI('calories', lang)} / IG`, style: 'tableHeader' },
        { text: tUI('ingredients', lang), style: 'tableHeader' }
      ]
    ];


    const rows = await Promise.all(meals.map(async (meal) => {
  const image = meal.imageUrl 
    ? meal.imageUrl 
    : await getMealImageBase64(meal.menu || meal.name);

  const tags = getMealTags(meal);
  const tagLabels = await Promise.all(tags.map(tag => getTranslation(`specialLabel${capitalize(tag)}`, lang)));

  const icons = [];
  if (tags.includes('vegan')) icons.push('🌱');
  if (tags.includes('glutenFree')) icons.push('🚫🌾');
  if (tags.includes('lowFodmap')) icons.push('🔽FODMAP');


      return [
        {
          stack: [
            { text: `${icons.join(' ')} ${meal.name}`, style: 'boldCell' },
            meal.description ? { text: meal.description, italics: true, fontSize: 10, margin: [0, 4, 0, 6] } : null,
            {
              columns: [
                {
                  width: '*',
                  text:
`🔥 ${meal.calories} kcal
💉 IG: ${meal.glycemicIndex}
🥩 ${tUI('protein', lang)}: ${meal.macros?.protein ?? 0} g
🧈 ${tUI('fat', lang)}: ${meal.macros?.fat ?? 0} g
🍞 ${tUI('carbs', lang)}: ${meal.macros?.carbs ?? 0} g
🌿 ${tUI('fiber', lang)}: ${meal.macros?.fiber ?? 0} g`,
                  fontSize: 9
                },
                image ? (
                  image.startsWith('data:image') ? {
                    width: 120,
                    image,
                    margin: [10, 0, 0, 6]
                  } : {
                    image: await toBase64Image(image), // pobrany URL → base64
                    width: 120,
                    margin: [10, 0, 0, 6]
                  }
                ) : {
                  text: tUI('noImageAvailable', lang),
                  alignment: 'center',
                  color: 'gray',
                  fontSize: 9
                }

              ]
            },
            tagLabels.length > 0 ? {
              text: tagLabels.join(' • '),
              color: '#3BAA57',
              fontSize: 9,
              margin: [0, 4, 0, 0]
            } : null
          ].filter(Boolean)
        },
        meal.time || '–',
        '',
        {
          text: meal.ingredients.map(i => {
            const isAllergen = allergyList.some((a: string) => i.product.toLowerCase().includes(a));
            return `• ${i.product} – ${i.weight} g${isAllergen ? ' ⚠️' : ''}`;
          }).join('\n'),
          alignment: 'justify'
        }
      ];
    }));

   content.push({
  table: {
    widths: ['auto', 'auto', 'auto', '*'],
    dontBreakRows: true,
    keepWithHeaderRows: 1,
    body: [
      [
        { text: tUI('mealName', lang), style: 'tableHeader' },
        { text: tUI('time', lang), style: 'tableHeader' },
        { text: `${tUI('calories', lang)} / IG`, style: 'tableHeader' },
        { text: tUI('ingredients', lang), style: 'tableHeader' }
      ],
      ...rows.map((row) => row as any[]) // 👈 upewniamy się, że TS nie zgłasza błędu typu
    ]
  },
  layout: 'lightHorizontalLines',
  margin: [0, 0, 0, 10]
});

// 📖 Sekcja: Przepisy kulinarne
if (recipes && Object.keys(recipes).length > 0) {
  content.push({
    text: tUI('recipesTitle', lang),
    style: 'header',
    margin: [0, 20, 0, 10]
  });

  for (const [day, meals] of Object.entries(recipes)) {
    content.push({ text: day, style: 'subheader', margin: [0, 10, 0, 6] });

    for (const [mealName, recipe] of Object.entries(meals)) {
      content.push(
      { text: `${tUI(mealName.toLowerCase(), lang)}: ${recipe.dish}`, style: 'boldCell' },
      { text: recipe.description, italics: true, fontSize: 10, margin: [0, 2, 0, 4] },
      { text: `${tUI('ingredients', lang)}:`, style: 'smallCell' },
      {
      ul: Array.isArray(recipe.ingredients)
        ? recipe.ingredients
            .filter(ing => ing?.product && ing?.weight && ing?.unit)
            .map(ing => `${ing.product} – ${ing.weight} ${ing.unit}`)
        : [],
      margin: [0, 2, 0, 4]
    },
      { text: `${tUI('steps', lang)}:`, style: 'smallCell' },
      {
      ol: Array.isArray(recipe.steps)
        ? recipe.steps.filter(step => typeof step === 'string')
        : [],
      margin: [0, 2, 0, 6]
    },
      ...(recipe.time
        ? [{
            text: `⏱️ ${tUI('time', lang)}: ${recipe.time}`,
            style: 'smallCell',
            margin: [0, 0, 0, 10]
          }]
        : [])
    );
    }
  }
}

  }
  // ➕ Lista zakupów z podziałem na kategorie
  const categorized: Record<string, [string, string, string][]> = {
    mięso: [],
    nabiał: [],
    warzywa: [],
    owoce: [],
    przyprawy: [],
    inne: []
  };

  const shoppingList = generateShoppingList(diet);
  const translatedItems = await Promise.all(
    shoppingList.map(async (item) => {
      const translatedProduct = await getTranslation(item.product, lang);
      const translatedUnit = await getTranslation(item.unit, lang);
      return [translatedProduct, `${item.totalWeight}`, translatedUnit];
    })
  );

  translatedItems.forEach(([product, qty, unit]) => {
    const name = product.toLowerCase();
    if (name.match(/(indyk|kurczak|szynka|wołowina|kiełbasa)/)) categorized.mięso.push([product, qty, unit]);
    else if (name.match(/(jogurt|ser|kefir|mleko|masło)/)) categorized.nabiał.push([product, qty, unit]);
    else if (name.match(/(pomidor|ogórek|sałata|kapusta|warzyw|brokuł|marchew|czosnek)/)) categorized.warzywa.push([product, qty, unit]);
    else if (name.match(/(jabłko|banan|owoc|malina|borówka|gruszka)/)) categorized.owoce.push([product, qty, unit]);
    else if (name.match(/(pieprz|sól|bazylia|zioła|papryka|przyprawa)/)) categorized.przyprawy.push([product, qty, unit]);
    else categorized.inne.push([product, qty, unit]);
  });

  content.push({ text: tUI('shoppingListTitle', lang), style: 'subheader', margin: [0, 10, 0, 6] });

  for (const [category, rows] of Object.entries(categorized)) {
    if (rows.length === 0) continue;
    content.push({ text: category.charAt(0).toUpperCase() + category.slice(1), style: 'boldCell', margin: [0, 6, 0, 2] });

    content.push({
      table: {
        widths: ['*', 'auto', 'auto'],
        body: [
          [tUI('product', lang), tUI('quantity', lang), tUI('unit', lang)],
          ...rows
        ]
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 10]
    });
  }

function summarizeNutritionByDay(diet: Meal[]) {
 const byDay: Record<string, {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}> = {};

  diet.forEach(meal => {
    const day = (meal as any).day || 'Inne';
    if (!byDay[day]) {
      byDay[day] = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, };
    }
    byDay[day].kcal += meal.calories || 0;
    byDay[day].protein += meal.macros?.protein || 0;
    byDay[day].fat += meal.macros?.fat || 0;
    byDay[day].carbs += meal.macros?.carbs || 0;
    byDay[day].fiber += meal.macros?.fiber || 0;
  });
  return byDay;
}
const dailySummary = summarizeNutritionByDay(diet);
content.push({ text: tUI('dailyNutritionSummaryTitle', lang), style: 'subheader', margin: [0, 10, 0, 6] });

content.push({
  table: {
    widths: ['*', 'auto', 'auto', 'auto', 'auto'],
    body: [
      [
        tUI('day', lang),
        'kcal',
        tUI('protein', lang),
        tUI('fat', lang),
        tUI('carbs', lang)
      ],
      ...Object.entries(dailySummary).map(([day, values]) => [
        day,
        Math.round(values.kcal),
        `${Math.round(values.protein)} g`,
        `${Math.round(values.fat)} g`,
        `${Math.round(values.carbs)} g`
      ])
    ]
  },
  layout: 'lightHorizontalLines',
  margin: [0, 0, 0, 10]
});

const weekly = Object.values(dailySummary).reduce(
  (a, b) => ({
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs,
    fiber: a.fiber + b.fiber,
  
  }),
  { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, }
);

content.push({ text: tUI('weeklyNutritionSummaryTitle', lang), style: 'subheader', margin: [0, 10, 0, 6] });

content.push({
table: {
  widths: ['*', 'auto', 'auto', 'auto', 'auto'],
  body: [
    [
      tUI('week', lang),
      'kcal',
      tUI('protein', lang),
      tUI('fat', lang),
      tUI('carbs', lang)
    ],
    [
      tUI('total', lang),
      Math.round(weekly.kcal),
      `${Math.round(weekly.protein)} g`,
      `${Math.round(weekly.fat)} g`,
      `${Math.round(weekly.carbs)} g`
    ]
  ]
},
  layout: 'lightHorizontalLines',
  margin: [0, 0, 0, 10]
});

  const qrBase64 = await QRCode.toDataURL('https://www.dcp.care');
  const formattedDate = new Date().toISOString().slice(0, 10);
  const safeName = patient.name?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'pacjent';

  content.push({
    columns: [
      { width: '*', text: '' },
      { width: 'auto', image: qrBase64, fit: [100, 100], alignment: 'center' },
      { width: '*', text: '' }
    ],
    margin: [0, 30, 0, 0]
  });

  content.push({ text: tUI('qrNotice', lang), style: 'footer', alignment: 'center', margin: [0, 10, 0, 30] });
  content.push({ text: tUI('allergenLegend', lang) + ' ⚠️', italics: true, fontSize: 10, margin: [0, 4, 0, 20] });

  // 🔄 Tryb wyjścia
  const pdfMakeInstance = pdfMake.createPdf({
    content,
    styles: {
      header: { fontSize: 18, bold: true, color: '#1d6f5e', margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, color: '#1d6f5e' },
      tableHeader: { bold: true, fillColor: '#d2f4e9', color: '#0b4b3c', alignment: 'center' },
      footer: { fontSize: 14, color: '#1d6f5e', alignment: 'center', margin: [0, 10, 0, 0] },
      boldCell: { bold: true },
      smallCell: { fontSize: 9 },
      warning: {
        fontSize: 10,
        italics: true,
        color: 'red'
      }
    },
    defaultStyle: {
      fontSize: 11,
      alignment: 'justify',
      lineHeight: 1.4
    },
    background: function () {
      return {
        canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 841.89, color: '#e7f2fc' }]
      };
    },

    footer: function (currentPage: number, pageCount: number) {
      return {
        text: `© Diet Care Platform — ${dietitianSignature} | Strona ${currentPage} z ${pageCount}`,
        style: 'footer'
      };
    }
  });

  if (mode === 'returnDoc') return pdfMakeInstance;
  pdfMakeInstance.download(`dieta_${safeName}_${formattedDate}.pdf`);
}
function getMealTags(meal: Meal): string[] {
  const tags: string[] = [];
  const text = `${meal.menu} ${meal.description || ''}`.toLowerCase();
  if (text.includes('wegań') || text.includes('vegan')) tags.push('vegan');
  if (text.includes('bezglut') || text.includes('gluten')) tags.push('glutenFree');
  if (text.includes('fodmap')) tags.push('lowFodmap');
  return tags;
}

async function getMealImageBase64(name: string): Promise<string | null> {
  try {
    const res = await fetch(`https://source.unsplash.com/600x400/?${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
  } catch {
    return null;
  }
}
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function toBase64Image(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
  } catch {
    return '';
  }
}
