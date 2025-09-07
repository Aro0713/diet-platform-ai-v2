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

// ---------- Normalizatory i metryki PDF ----------
type PdfMetrics = {
  bmi: number | null;
  ppm?: number | null;
  cpm?: number | null;
  pal?: number | null;
  kcalMaintain?: number | null;
  kcalReduce?: number | null;
  kcalGain?: number | null;
  nmcBroca?: number | null;
  nmcLorentz?: number | null;
};

/** Bezpieczny kształt posiłków – uzupełnia brakujące pola i pilnuje tablic. */
function ensureMealsArray(diet: Meal[] | undefined | null): Meal[] {
  const safe: Meal[] = Array.isArray(diet) ? diet : [];
  return safe.map((m, i) => ({
    ...m,
    name: m.name || m.menu || `Posiłek ${i + 1}`,
    time: m.time || '–',
    ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
    macros: {
      kcal: m.macros?.kcal ?? 0,
      protein: m.macros?.protein ?? 0,
      fat: m.macros?.fat ?? 0,
      carbs: m.macros?.carbs ?? 0,
      fiber: m.macros?.fiber ?? 0,
      sodium: m.macros?.sodium ?? 0,
      potassium: m.macros?.potassium ?? 0,
      calcium: m.macros?.calcium ?? 0,
      magnesium: m.macros?.magnesium ?? 0,
      iron: m.macros?.iron ?? 0,
      zinc: m.macros?.zinc ?? 0,
      vitaminD: m.macros?.vitaminD ?? 0,
      vitaminB12: m.macros?.vitaminB12 ?? 0,
      vitaminC: m.macros?.vitaminC ?? 0,
      vitaminA: m.macros?.vitaminA ?? 0,
      vitaminE: m.macros?.vitaminE ?? 0,
      vitaminK: m.macros?.vitaminK ?? 0,
    },
  }));
}

/** Liczy proste metryki dla PDF (fallback gdy calc brak lub niepełne). */
function computePdfMetrics(
  base: { bmi: number | null },
  provided?: {
    bmi?: number; ppm?: number; cpm?: number; pal?: number;
    kcalMaintain?: number; kcalReduce?: number; kcalGain?: number;
    nmcBroca?: number; nmcLorentz?: number;
  },
  diet?: Meal[]
): PdfMetrics {
  // Jeśli dostaliśmy komplet – po prostu zwróć
  if (provided && (provided.ppm || provided.cpm || provided.kcalMaintain)) {
    return {
      bmi: provided.bmi ?? base.bmi ?? null,
      ppm: provided.ppm ?? null,
      cpm: provided.cpm ?? null,
      pal: provided.pal ?? null,
      kcalMaintain: provided.kcalMaintain ?? null,
      kcalReduce: provided.kcalReduce ?? null,
      kcalGain: provided.kcalGain ?? null,
      nmcBroca: provided.nmcBroca ?? null,
      nmcLorentz: provided.nmcLorentz ?? null,
    };
  }

  // Prosty fallback: średnia dobowych kcal z diety → maintain;
  // reduce/gain ±15% (zachowujemy prostotę w PDF).
  const safe = ensureMealsArray(diet);
  const byDate: Record<string, number> = {};
  for (const m of safe) {
    const d = (m as any).date || (m as any).day || 'D';
    byDate[d] = (byDate[d] || 0) + (m.macros?.kcal ?? 0);
  }
  const days = Object.keys(byDate).length || 1;
  const kcalMaintain = days ? Object.values(byDate).reduce((a, b) => a + b, 0) / days : 0;
  const kcalReduce = Math.round(kcalMaintain * 0.85);
  const kcalGain = Math.round(kcalMaintain * 1.15);

  return {
    bmi: base.bmi ?? null,
    ppm: null,
    cpm: null,
    pal: null,
    kcalMaintain: Math.round(kcalMaintain),
    kcalReduce,
    kcalGain,
    nmcBroca: null,
    nmcLorentz: null,
  };
}

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
    // ✅ Normalizacja i metryki na starcie
  const safeDiet: Meal[] = ensureMealsArray(diet);
  const metrics: PdfMetrics = computePdfMetrics({ bmi }, calc, safeDiet);
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
  const sorted = [...safeDiet].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const startDate = sorted[0]?.date || new Date().toISOString().slice(0, 10);
  const endDate = sorted[sorted.length - 1]?.date || new Date().toISOString().slice(0, 10);

  // ✅ Strona tytułowa
  content.push(
  { text: `${tUI('fullName', lang)}: ${patient.name}`, style: 'header', alignment: 'center', fontSize: 22, margin: [0, 30, 0, 4] },
  { text: `${tUI('assignedDoctor', lang)}: ${dietitianSignature || tUI('missingData', lang)}`, alignment: 'center', fontSize: 12, margin: [0, 0, 0, 6] },
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

    if (metrics) {
    content.push({ text: `📊 ${tUI('calculationBlockTitle', lang)}`, style: 'subheader', margin: [0, 10, 0, 4] });
    content.push({
      ul: [
        `BMI: ${metrics.bmi ?? 'n/a'}`,
        `PPM: ${metrics.ppm ?? '–'} ${metrics.ppm ? 'kcal' : ''}`.trim(),
        `CPM: ${metrics.cpm ?? '–'} ${metrics.cpm ? 'kcal' : ''}`.trim(),
        `PAL: ${metrics.pal ?? '–'}`,
        `${tUI('kcalMaintain', lang)}: ${metrics.kcalMaintain ?? '–'} ${metrics.kcalMaintain ? 'kcal' : ''}`.trim(),
        `${tUI('kcalReduce', lang)}: ${metrics.kcalReduce ?? '–'} ${metrics.kcalReduce ? 'kcal' : ''}`.trim(),
        `${tUI('kcalGain', lang)}: ${metrics.kcalGain ?? '–'} ${metrics.kcalGain ? 'kcal' : ''}`.trim(),
        `NMC Broca: ${metrics.nmcBroca ?? '–'} ${metrics.nmcBroca ? 'kg' : ''}`.trim(),
        `NMC Lorentz: ${metrics.nmcLorentz ?? '–'} ${metrics.nmcLorentz ? 'kg' : ''}`.trim(),
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
// Grupowanie po dniu (fallback na „Dzień N”)
const groupedByDay: Record<string, Meal[]> = {};
ensureMealsArray(safeDiet).forEach((meal, idx) => {
  const day: string = (meal as any).day || (meal as any).date || `${tUI('day', lang)} ${idx + 1}`;
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
  const image = await getMealImageBase64(meal.menu || meal.name || "posiłek");
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
              text: [
                `🔥 ${meal.macros?.kcal ?? 0} kcal`,
                meal.glycemicIndex ? `💉 IG: ${meal.glycemicIndex}` : '',
                meal.macros?.protein ? `🥩 ${tUI('protein', lang)}: ${meal.macros.protein} g` : '',
                meal.macros?.fat ? `🧈 ${tUI('fat', lang)}: ${meal.macros.fat} g` : '',
                meal.macros?.carbs ? `🍞 ${tUI('carbs', lang)}: ${meal.macros.carbs} g` : '',
                meal.macros?.fiber ? `🌿 ${tUI('fiber', lang)}: ${meal.macros.fiber} g` : ''
              ].filter(Boolean).join('\n'),
              fontSize: 9
            },
            image ? (
              image.startsWith('data:image') ? {
                width: 120,
                image,
                margin: [10, 0, 0, 6]
              } : {
                image: await toBase64Image(image),
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
        // Legenda skrótów pod tabelą dnia (i18n)
        const legendAbbrev = [
          `kcal = ${tUI('calories', lang)}`,
          `B = ${tUI('protein', lang)}`,
          `T = ${tUI('fat', lang)}`,
          `W = ${tUI('carbs', lang)}`,
          `🌿 = ${tUI('fiber', lang)}`
        ].join('   •   ');

        content.push({
          text: `${tUI('legend', lang)}: ${legendAbbrev}`,
          style: 'smallCell',
          margin: [0, 4, 0, 10],
          color: '#475569'
        });

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
    const shoppingList = generateShoppingList(safeDiet);
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
  const byDay: Record<string, Record<string, number>> = {};

  const nutrientKeys = [
    'kcal', 'protein', 'fat', 'carbs', 'fiber',
    'sodium', 'potassium', 'calcium', 'magnesium',
    'iron', 'zinc', 'vitaminD', 'vitaminB12',
    'vitaminC', 'vitaminA', 'vitaminE', 'vitaminK'
  ] as const;

  diet.forEach(meal => {
    const day = (meal as any).day || 'Inne';
    if (!byDay[day]) {
      byDay[day] = Object.fromEntries(
        nutrientKeys.map(k => [k, 0])
      ) as Record<string, number>;
    }

    for (const key of nutrientKeys) {
      byDay[day][key] += meal.macros?.[key] || 0;
    }
  });

  return byDay;
}

const format = (value: number, unit: string) => value > 0 ? `${Math.round(value)}${unit}` : '';
const dailySummary = summarizeNutritionByDay(safeDiet);
content.push({
  text: tUI('dailyNutritionSummaryTitle', lang),
  style: 'subheader',
  margin: [0, 10, 0, 6]
});

content.push({
  table: buildNutritionTable(dailySummary, tUI('day', lang), lang),
  layout: 'lightHorizontalLines',
  margin: [0, 0, 0, 10]
});
content.push({ text: tUI('nutritionLegend', lang), style: 'smallCell', margin: [0, 4, 0, 10] });

// 📖 Sekcja: Przepisy kulinarne
if (recipes && Object.keys(recipes).length > 0) {
  content.push({
    text: tUI('recipesTitle', lang),
    style: 'header',
    margin: [0, 20, 0, 10]
  });

  for (const [day, meals] of Object.entries(recipes)) {
    if (!meals || Object.keys(meals).length === 0) continue;

    content.push({
      text: day,
      style: 'subheader',
      margin: [0, 10, 0, 6]
    });

    for (const [mealName, recipe] of Object.entries(meals)) {
      if (!recipe || !recipe.dish) continue;

      content.push(
        { text: `${tUI(mealName.toLowerCase(), lang)}: ${recipe.dish}`, style: 'boldCell' },

        ...(recipe.description ? [
          { text: recipe.description, italics: true, fontSize: 10, margin: [0, 2, 0, 4] }
        ] : []),

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

        ...(recipe.time ? [{
          text: `⏱️ ${tUI('time', lang)}: ${recipe.time}`,
          style: 'smallCell',
          margin: [0, 0, 0, 10]
        }] : [])
      );
    }
  }
}

const weekly = Object.values(dailySummary).reduce((acc, day) => {
  for (const key of Object.keys(day)) {
    acc[key] = (acc[key] || 0) + day[key];
  }
  return acc;
}, {
  kcal: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  sodium: 0,
  potassium: 0,
  calcium: 0,
  magnesium: 0,
  iron: 0,
  zinc: 0,
  vitaminD: 0,
  vitaminB12: 0,
  vitaminC: 0,
  vitaminA: 0,
  vitaminE: 0,
  vitaminK: 0
});

function buildNutritionTable(
  rows: Record<string, Record<string, number>>,
  label: string,
  lang: LangKey
) {
  const keys = Object.keys(Object.values(rows)[0] || {});
  const totals: Record<string, number> = {};

  for (const row of Object.values(rows)) {
    for (const key of keys) {
      totals[key] = (totals[key] || 0) + (row[key] || 0);
    }
  }

  const shownKeys = keys.filter((key) => totals[key] > 0);

  const labels: Record<string, string> = {
    kcal: 'kcal',
    protein: 'B',
    fat: 'T',
    carbs: 'W',
    fiber: '🌿',
    sodium: '🧂',
    potassium: '🥔',
    calcium: '🦴',
    magnesium: '🧬',
    iron: '🩸',
    zinc: '🧪',
    vitaminD: '☀️ D',
    vitaminB12: '🧠 B12',
    vitaminC: '🍊 C',
    vitaminA: '👁️ A',
    vitaminE: '🧈 E',
    vitaminK: '💉 K'
  };

  const units: Record<string, string> = {
    kcal: '',
    protein: 'g', fat: 'g', carbs: 'g', fiber: 'g',
    sodium: 'mg', potassium: 'mg', calcium: 'mg', magnesium: 'mg',
    iron: 'mg', zinc: 'mg',
    vitaminD: 'µg', vitaminB12: 'µg', vitaminC: 'mg',
    vitaminA: 'µg', vitaminE: 'mg', vitaminK: 'µg'
  };

  const header = [
    label,
    ...shownKeys.map((k) => labels[k] || k)
  ];

  const body = Object.entries(rows).map(([day, values]) => ([
    day,
    ...shownKeys.map((k) =>
      values[k] > 0 ? `${Math.round(values[k])}${units[k] || ''}` : ''
    )
  ]));

  const totalRow = [
    tUI('total', lang),
    ...shownKeys.map((k) =>
      totals[k] > 0 ? `${Math.round(totals[k])}${units[k] || ''}` : ''
    )
  ];

  return {
    widths: ['*', ...Array(shownKeys.length).fill('auto')],
    body: [header, ...body, totalRow]
  };
}

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
        text: `© Diet Care Platform — ${dietitianSignature || tUI('missingData', lang)} | Strona ${currentPage} z ${pageCount}`,
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
