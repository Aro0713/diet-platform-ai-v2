import React, { useState } from 'react';
import { Meal } from '@/types';
import { LangKey } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';

const normKey = (s: any) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_');

function localizeMeta(val: any, lang: LangKey): string {
  const raw = String(val ?? '').trim();
  if (!raw) return '';
  const k = normKey(raw);

  // spróbuj bezpośrednio z translationsUI
  const candidates = [raw, k, `goal_${k}`, `model_${k}`, `cuisine_${k}`];
  for (const c of candidates) {
    const hit = (translationsUI as any)?.[c]?.[lang];
    if (hit) return hit;
  }

  // najczęstsze skróty z UI
  const shorts: Record<string, Partial<Record<LangKey, string>>> = {
    lose: { pl: 'Odchudzające (redukujące)', en: 'Weight loss' },
    gain: { pl: 'Na masę', en: 'Muscle gain' },
    maintain: { pl: 'Stabilizujące wagę', en: 'Weight maintenance' },
    italian: { pl: 'Włoska', en: 'Italian' },
    polish: { pl: 'Polska', en: 'Polish' },
  };
  if (shorts[k]?.[lang]) return shorts[k]![lang] as string;

  // fallback
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function isNumericKeyObject(o: any): boolean {
  return o && typeof o === "object" && !Array.isArray(o) &&
         Object.keys(o).some(k => /^\d+$/.test(k));
}

function extractMealsFromNumericObject(o: Record<string, any>): any[] {
  return Object.keys(o)
    .filter(k => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
    .map(k => o[k])
    .filter(v => v && typeof v === "object" && !Array.isArray(v));
}

function normalizeDietData(input: any): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {};
  if (!input || typeof input !== 'object') return result;

  for (const [day, rawDayData] of Object.entries(input)) {
    const meals: Meal[] = [];

    // 🔸 CASE A: dzień jako OBIEKT
    if (rawDayData && typeof rawDayData === 'object' && !Array.isArray(rawDayData)) {

      // NEW: jeśli mamy { meals: [...] } -> iteruj po tej tablicy
      if (Array.isArray((rawDayData as any).meals)) {
        for (const meal of (rawDayData as any).meals) {
          if (!meal || typeof meal !== 'object') continue;
          meals.push({
            name: meal.name || meal.mealName || 'Posiłek',
            menu: meal.menu || meal.mealName || meal.name || 'Posiłek',
            time: meal.time || '00:00',
            day,
            glycemicIndex: meal.glycemicIndex ?? 0,
            ingredients: (meal.ingredients || []).map((i: any) => ({
              product: i.product || i.name || '',
              weight:
                typeof i.weight === 'number' ? i.weight :
                typeof i.quantity === 'number' ? i.quantity :
                typeof (i.weight ?? i.quantity) === 'string' ? parseFloat(i.weight ?? i.quantity as string) :
                0,
              unit: i.unit || (typeof (i.weight ?? i.quantity) !== 'undefined' ? 'g' : undefined),
            })),
            macros: {
              kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0,
              potassium: 0, calcium: 0, magnesium: 0, iron: 0, zinc: 0,
              vitaminD: 0, vitaminB12: 0, vitaminC: 0,
              vitaminA: 0, vitaminE: 0, vitaminK: 0,
              ...(meal.macros || {})
            }
          });
        }
      } else {
        // ORYGINALNA ścieżka: mapy "HH:MM" -> meal (albo inne klucze)
        for (const [key, meal] of Object.entries(rawDayData)) {
          if (!meal || typeof meal !== 'object') continue;

          // NEW: pomijamy klucze nie-będące posiłkami
          if (key === 'meals' || key === 'ingredients') continue;
          if (Array.isArray(meal)) continue;

          meals.push({
            // name = typ posiłku (Śniadanie/Obiad...) lub klucz godzinowy
            name: (key as string) || 'Posiłek',
            menu: (meal as any).mealName || (meal as any).name || (meal as any).menu || 'Posiłek',
            time: (meal as any).time || key || '00:00',
            day,
            glycemicIndex: (meal as any).glycemicIndex ?? 0,
            ingredients: ((meal as any).ingredients || []).map((i: any) => ({
              product: i.product || i.name || '',
              weight:
                typeof i.weight === 'number' ? i.weight :
                typeof i.quantity === 'number' ? i.quantity :
                typeof (i.weight ?? i.quantity) === 'string' ? parseFloat(i.weight ?? i.quantity as string) :
                0,
              unit: i.unit || (typeof (i.weight ?? i.quantity) !== 'undefined' ? 'g' : undefined),
            })),
            macros: {
              kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0,
              potassium: 0, calcium: 0, magnesium: 0, iron: 0, zinc: 0,
              vitaminD: 0, vitaminB12: 0, vitaminC: 0,
              vitaminA: 0, vitaminE: 0, vitaminK: 0,
              ...((meal as any).macros || {})
            }
          });
        }
      }
    }

    // 🔸 CASE B: dzień jako TABLICA
    if (Array.isArray(rawDayData)) {

      // NEW: pakiet typu [ { "0": {...}, "1": {...}, ..., "ingredients": [] } ]
      if (rawDayData.length === 1 && isNumericKeyObject(rawDayData[0])) {
        const bundle = rawDayData[0] as Record<string, any>;
        const extracted = extractMealsFromNumericObject(bundle);
        for (const meal of extracted) {
          if (!meal || typeof meal !== 'object') continue;
          meals.push({
            name: meal.name || meal.mealName || 'Posiłek',
            menu: meal.menu || meal.mealName || meal.name || 'Posiłek',
            time: meal.time || '00:00',
            day,
            glycemicIndex: meal.glycemicIndex ?? 0,
            ingredients: (meal.ingredients || []).map((i: any) => ({
              product: i.product || i.name || '',
              weight:
                typeof i.weight === 'number' ? i.weight :
                typeof i.quantity === 'number' ? i.quantity :
                typeof (i.weight ?? i.quantity) === 'string' ? parseFloat(i.weight ?? i.quantity as string) :
                0,
              unit: i.unit || (typeof (i.weight ?? i.quantity) !== 'undefined' ? 'g' : undefined),
            })),
            macros: {
              kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0,
              potassium: 0, calcium: 0, magnesium: 0, iron: 0, zinc: 0,
              vitaminD: 0, vitaminB12: 0, vitaminC: 0,
              vitaminA: 0, vitaminE: 0, vitaminK: 0,
              ...(meal.macros || {})
            }
          });
        }
      } else {
        // ORYGINALNA ścieżka: poprawne Meal[]
        for (const meal of rawDayData) {
          if (!meal || typeof meal !== 'object') continue;

          meals.push({
            name: meal.name || meal.mealName || 'Posiłek',
            menu: meal.menu || meal.name || 'Posiłek',
            time: meal.time || '00:00',
            day,
            glycemicIndex: meal.glycemicIndex ?? 0,
            ingredients: (meal.ingredients || []).map((i: any) => ({
              product: i.product || i.name || '',
              weight:
                typeof i.weight === 'number' ? i.weight :
                typeof i.quantity === 'number' ? i.quantity :
                typeof (i.weight ?? i.quantity) === 'string' ? parseFloat(i.weight ?? i.quantity as string) :
                0,
              unit: i.unit || (typeof (i.weight ?? i.quantity) !== 'undefined' ? 'g' : undefined),
            })),
            macros: {
              kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0,
              potassium: 0, calcium: 0, magnesium: 0, iron: 0, zinc: 0,
              vitaminD: 0, vitaminB12: 0, vitaminC: 0,
              vitaminA: 0, vitaminE: 0, vitaminK: 0,
              ...(meal.macros || {})
            }
          });
        }
      }
    }

    result[day] = meals;
  }

  return result;
}

        function parseRawDietPlan(raw: any): Record<string, Meal[]> {
          const parsed: Record<string, Meal[]> = {};

          for (const [day, dayData] of Object.entries(raw || {})) {
            const mealsForDay: Meal[] = [];

            if (Array.isArray(dayData)) {
              for (const meal of dayData) {
                if (!meal || typeof meal !== "object") continue;

                const name = meal.name || meal.menu || meal.mealName || "Posiłek";
                const time = meal.time || "00:00";
              const ingredients = (meal.ingredients || []).map((i: any) => ({
          product: i.product || i.name || '',
          weight:
            typeof i.weight === 'number' ? i.weight :
            typeof i.quantity === 'number' ? i.quantity :
            Number(i.weight ?? i.quantity) || 0,
          unit: i.unit || (typeof (i.weight ?? i.quantity) !== 'undefined' ? 'g' : undefined),
        })).filter((i: any) =>

                i.product && typeof i.product === 'string' &&
                !['undefined', 'null', 'name'].includes(i.product.toLowerCase())
               );

        mealsForDay.push({
          name,
          time,
          menu: name,
          ingredients,
          macros: meal.macros || {
            kcal: 0, protein: 0, fat: 0, carbs: 0,
            fiber: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
            iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0, vitaminC: 0,
            vitaminA: 0, vitaminE: 0, vitaminK: 0
          },
          glycemicIndex: meal.glycemicIndex ?? 0,
          day
        });
      }
    }
    parsed[day] = mealsForDay;
  }

  return parsed;
}
type DietMeta = { goal?: string; model?: string; cuisine?: string; mealsPerDay?: number };

interface DietTableProps {
  editableDiet: Record<string, Meal[]>;
  setEditableDiet: (diet: Record<string, Meal[]>) => void;
  setConfirmedDiet: (diet: Record<string, Meal[]>) => void;
  isEditable: boolean;
  lang: LangKey;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  // (opcjonalnie) jeśli kiedyś będziesz chciał podać meta osobno:
  // context?: DietMeta;
}

const getFallbackMeal = (): Meal => ({
  name: '',
  menu: '',
  time: '',
  glycemicIndex: 0,
  day: '',
  ingredients: [],
  macros: {
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    sodium: 0,
    fiber: 0,
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
  },
});

type MacroKey =
  | 'protein' | 'fat' | 'carbs' | 'fiber' | 'sodium' | 'potassium'
  | 'calcium' | 'magnesium' | 'iron' | 'zinc'
  | 'vitaminD' | 'vitaminB12' | 'vitaminC'
  | 'vitaminA' | 'vitaminE' | 'vitaminK';

type MacroTotals = {
  [key in MacroKey]: number;
};

const sumDailyMacros = (meals: Meal[]): MacroTotals => {
  return meals.reduce(
    (acc, meal) => {
      const m = meal.macros || {};
      for (const key of Object.keys(acc) as MacroKey[]) {
        acc[key] += m[key] ?? 0;
      }
      return acc;
    },
    {
      protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0, potassium: 0,
      calcium: 0, magnesium: 0, iron: 0, zinc: 0,
      vitaminD: 0, vitaminB12: 0, vitaminC: 0,
      vitaminA: 0, vitaminE: 0, vitaminK: 0
    }
  );
};

const sumWeeklyMacros = (diet: Record<string, Meal[]>) => {
  const allMeals = Object.values(diet).flat();
  return sumDailyMacros(allMeals);
};
const round = (n: number, digits = 1) => Number(n.toFixed(digits));

const DietTable: React.FC<DietTableProps> = ({
  editableDiet,
  setEditableDiet,
  setConfirmedDiet,
  isEditable,
  lang,
  notes,
  setNotes,
}) => {
// lokalizowane etykiety makro/mikro i skróty jednostek
const t = (k: string, fb: string) => (translationsUI as any)?.[k]?.[lang] ?? fb;
const L = {
  calories:        t('calories', 'Calories'),
  gi:               t('gi', 'GI'),
  proteinShort:     t('proteinShort', 'P'),
  fatShort:         t('fatShort', 'F'),
  carbsShort:       t('carbsShort', 'C'),
  fiber:            t('fiber', 'Fiber'),
  sodium:           t('sodium', 'Sodium'),
  potassium:        t('potassium', 'Potassium'),
  calcium:          t('calcium', 'Calcium'),
  magnesium:        t('magnesium', 'Magnesium'),
  iron:             t('iron', 'Iron'),
  zinc:             t('zinc', 'Zinc'),
  vitaminD:         t('vitaminD_short', 'Vit. D'),
  vitaminB12:       t('vitaminB12_short', 'B12'),
  vitaminC:         t('vitaminC_short', 'Vit. C'),
  vitaminA:         t('vitaminA_short', 'Vit. A'),
  vitaminE:         t('vitaminE_short', 'Vit. E'),
  vitaminK:         t('vitaminK_short', 'Vit. K'),
  g:                t('g', 'g'),
  mg:               t('mg', 'mg'),
  mcg:              t('mcg', 'µg'),
};


// meta jedzie razem z dietą w kluczu __meta
const meta: DietMeta = (editableDiet as any)?.__meta || {};
// do renderu pomijamy klucze techniczne zaczynające się od "__"
const dietOnly = Object.fromEntries(
  Object.entries(editableDiet || {}).filter(([k]) => !k.startsWith('__'))
);

  const safeDiet = normalizeDietData(dietOnly);
  const dayKeys = Object.keys(safeDiet);
  const translatedDays = dayKeys.map((dayKey) =>
    translationsUI[dayKey.toLowerCase()]?.[lang] || dayKey || '???'
  );
  const maxMealCount = Math.max(0, ...Object.values(safeDiet).map((meals) => meals.length));
  // ⛑️ Gdy brak danych – pokaż placeholder zamiast pustej tabeli / błędów map()
if (dayKeys.length === 0 || maxMealCount === 0) {
  return (
    <div className="w-full rounded-md border border-gray-600 bg-[#0d1117] p-4 text-sm text-gray-300">
      {translationsUI.noDietData?.[lang] || 'Brak danych diety do wyświetlenia.'}
    </div>
  );
}
  const handleInputChange = (day: string, mealIndex: number, field: keyof Meal, value: string) => {
  const updatedDayMeals = [...(editableDiet[day] || [])];
  const meal = updatedDayMeals[mealIndex] ? { ...updatedDayMeals[mealIndex] } : getFallbackMeal();

  if (field === 'glycemicIndex') {
    meal.glycemicIndex = Number(value);
  } else if (field === 'ingredients') {
    meal.ingredients = value
      .split(',')
      .map((item) => {
        const match = item.trim().match(/(.+?)\s*\((\d+)g\)/);
        return match
          ? { product: match[1], weight: parseInt(match[2]) }
          : { product: item.trim(), weight: 0 };
      });
  } else {
    (meal as any)[field] = value;
  }

  // ✅ Normalizacja składników
  meal.ingredients = meal.ingredients.map((i: any) => ({
    product: i.product || i.name || '',
    weight: i.weight ?? i.quantity ?? 0,
  }));

  updatedDayMeals[mealIndex] = meal;

  // ⬇️ TO DODAJ:
  setEditableDiet({ ...editableDiet, [day]: updatedDayMeals });
};

  const validateDiet = () => {
    for (const day of dayKeys) {
      const meals = editableDiet[day] || [];
      for (const meal of meals) {
        if (!meal.name || meal.name.trim() === '') return false;
        for (const ing of meal.ingredients || []) {
          if (!ing.product?.trim()) return false;
          if (typeof ing.weight !== 'number' || ing.weight <= 0) return false;
        }
      }
    }
    return true;
  };

  const [saveMessage, setSaveMessage] = React.useState<string>('');

  const handleSave = React.useCallback(() => {
  if (validateDiet()) {
    setConfirmedDiet(editableDiet);
    setSaveMessage('✅ Zapisano zmiany');
    window.setTimeout(() => setSaveMessage(''), 3000);
  } else {
    setSaveMessage('❌ Uzupełnij wszystkie pola');
    window.setTimeout(() => setSaveMessage(''), 4000);
  }
}, [editableDiet, dayKeys, setConfirmedDiet]);

return (
  <div className="overflow-auto">
    <table className="min-w-full table-fixed break-words border border-gray-600 bg-[#1a1e2c]/90 text-white shadow-md rounded-md overflow-hidden">
      <thead>
  {(meta.goal || meta.model || meta.cuisine || typeof meta.mealsPerDay === 'number') && (
    <tr>
      <th
        colSpan={dayKeys.length || 7}
        className="border border-gray-600 bg-gray-900 text-[12px] md:text-sm text-white px-4 py-2"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
         {meta.goal   && <span>🎯 {localizeMeta(meta.goal,   lang)}</span>}
          {meta.model  && <span>🧬 {localizeMeta(meta.model,  lang)}</span>}
          {meta.cuisine&& <span>🍽️ {localizeMeta(meta.cuisine,lang)}</span>}
          {typeof meta.mealsPerDay === 'number' && (
            <span>🍱 {meta.mealsPerDay} {translationsUI.mealsPerDay?.[lang] || 'posiłki/dzień'}</span>
          )}
        </div>
      </th>
    </tr>
  )}
  <tr>
    {translatedDays.map((day, idx) => (
      <th
        key={day + idx}
        className="border border-gray-600 bg-gray-800 text-sm font-semibold text-white px-4 py-2 text-center"
      >
        {day}
      </th>
    ))}
  </tr>
</thead>

      <tbody>
        {Array.from({ length: maxMealCount }).map((_, mealIndex) => (
          <tr key={mealIndex}>
            {dayKeys.map((day) => {
              const meal = safeDiet[day]?.[mealIndex] ?? getFallbackMeal();
              return (
                <td key={day + mealIndex} className="border border-gray-600 bg-[#0d1117] px-3 py-2 align-top text-white">
                  <div className="space-y-2">
                    {/* typ posiłku (Śniadanie/Obiad...) */}
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">
                      {translationsUI[meal.name?.toLowerCase()]?.[lang] || meal.name || 'Posiłek'}
                    </div>

                    {/* tytuł dania */}
                    <div className="font-semibold text-base">
                      {meal.menu}
                    </div>
                    {meal.time && (
                      <div className="text-xs text-gray-400">🕒 {meal.time}</div>
                    )}
                    {meal.ingredients?.length > 0 && (
                     <ul className="text-sm list-inside space-y-1">
                    {meal.ingredients.map((i, idx) => {
                      const weight = i.weight ?? (i as any).quantity ?? null;
                      return (
                        <li key={idx} className="flex items-center gap-2">
                          <span>
                            {i.product}
                           {Number.isFinite(Number(weight)) && Number(weight) > 0
                          ? ` (${round(Number(weight))}${(i as any).unit || 'g'})`
                          : ""}
                          </span>
                        </li>
                      );
                    })}
                    </ul>
                    )}
                    <div className="text-xs text-gray-400">
                    {L.calories}: {meal.macros?.kcal && meal.macros.kcal > 0 ? `${round(meal.macros.kcal)} kcal` : '–'} | {L.gi}: {meal.glycemicIndex > 0 ? meal.glycemicIndex : '–'}
                    </div>
                    {meal.macros && (
                      <div className="text-xs text-gray-500 leading-tight whitespace-pre-wrap">
                      {L.proteinShort}: {round(meal.macros.protein ?? 0)}{L.g}, {L.fatShort}: {round(meal.macros.fat ?? 0)}{L.g}, {L.carbsShort}: {round(meal.macros.carbs ?? 0)}{L.g}
                      <br />
                      🌿 {L.fiber}: {round(meal.macros.fiber ?? 0)}{L.g} | 🧂 {L.sodium}: {round(meal.macros.sodium ?? 0)}{L.mg} | 🥔 {L.potassium}: {round(meal.macros.potassium ?? 0)}{L.mg}
                      <br />
                      🦴 {L.calcium}: {round(meal.macros.calcium ?? 0)}{L.mg} | 🧬 {L.magnesium}: {round(meal.macros.magnesium ?? 0)}{L.mg} | 🩸 {L.iron}: {round(meal.macros.iron ?? 0)}{L.mg} | 🧪 {L.zinc}: {round(meal.macros.zinc ?? 0)}{L.mg}
                      <br />
                      ☀️ {L.vitaminD}: {round(meal.macros.vitaminD ?? 0)}{L.mcg} | 🧠 {L.vitaminB12}: {round(meal.macros.vitaminB12 ?? 0)}{L.mcg} | 🍊 {L.vitaminC}: {round(meal.macros.vitaminC ?? 0)}{L.mg}
                      <br />
                      👁️ {L.vitaminA}: {round(meal.macros.vitaminA ?? 0)}{L.mcg} | 🧈 {L.vitaminE}: {round(meal.macros.vitaminE ?? 0)}{L.mg} | 💉 {L.vitaminK}: {round(meal.macros.vitaminK ?? 0)}{L.mcg}
                    </div>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
        <tr className="bg-[#222c3f] font-semibold text-[11px] text-white leading-tight">
          {dayKeys.map((day) => {
            const macros = sumDailyMacros(safeDiet[day] || []);
            return (
              <td key={day + '_sum'} className="border border-gray-600 px-2 py-1 text-left text-gray-300 whitespace-pre-wrap align-top">
              {L.proteinShort}: {round(macros.protein)}{L.g}, {L.fatShort}: {round(macros.fat)}{L.g}, {L.carbsShort}: {round(macros.carbs)}{L.g}<br />
              🌿 {L.fiber}: {round(macros.fiber)}{L.g} | 🧂 {L.sodium}: {round(macros.sodium)}{L.mg} | 🥔 {L.potassium}: {round(macros.potassium)}{L.mg}<br />
              🦴 {L.calcium}: {round(macros.calcium)}{L.mg} | 🧬 {L.magnesium}: {round(macros.magnesium)}{L.mg} | 🩸 {L.iron}: {round(macros.iron)}{L.mg} | 🧪 {L.zinc}: {round(macros.zinc)}{L.mg}<br />
              ☀️ {L.vitaminD}: {round(macros.vitaminD)}{L.mcg} | 🧠 {L.vitaminB12}: {round(macros.vitaminB12)}{L.mcg} | 🍊 {L.vitaminC}: {round(macros.vitaminC)}{L.mg}<br />
              👁️ {L.vitaminA}: {round(macros.vitaminA)}{L.mcg} | 🧈 {L.vitaminE}: {round(macros.vitaminE)}{L.mg} | 💉 {L.vitaminK}: {round(macros.vitaminK)}{L.mcg}
            </td>
            );
          })}
        </tr>
        <tr className="bg-[#1f2a3c] font-semibold text-xs text-white whitespace-pre-wrap">
          <td
            colSpan={dayKeys.length}
            className="border border-gray-600 px-2 py-2 text-left text-gray-300 align-top"
          >
            {(() => {
              const weekly = sumWeeklyMacros(safeDiet);
              return (
                <>
                  <div dangerouslySetInnerHTML={{ __html: translationsUI.weeklyTotal?.[lang] || '7 dni razem:' }} />
                  {L.proteinShort}: {round(weekly.protein)}{L.g}, {L.fatShort}: {round(weekly.fat)}{L.g}, {L.carbsShort}: {round(weekly.carbs)}{L.g}<br />
                  🌿 {L.fiber}: {round(weekly.fiber)}{L.g} | 🧂 {L.sodium}: {round(weekly.sodium)}{L.mg} | 🥔 {L.potassium}: {round(weekly.potassium)}{L.mg}<br />
                  🦴 {L.calcium}: {round(weekly.calcium)}{L.mg} | 🧬 {L.magnesium}: {round(weekly.magnesium)}{L.mg} | 🩸 {L.iron}: {round(weekly.iron)}{L.mg} | 🧪 {L.zinc}: {round(weekly.zinc)}{L.mg}<br />
                  ☀️ {L.vitaminD}: {round(weekly.vitaminD)}{L.mcg} | 🧠 {L.vitaminB12}: {round(weekly.vitaminB12)}{L.mcg} | 🍊 {L.vitaminC}: {round(weekly.vitaminC)}{L.mg}<br />
                  👁️ {L.vitaminA}: {round(weekly.vitaminA)}{L.mcg} | 🧈 {L.vitaminE}: {round(weekly.vitaminE)}{L.mg} | 💉 {L.vitaminK}: {round(weekly.vitaminK)}{L.mcg}
                </>
              );
            })()}
          </td>
        </tr>
        <tr>
          {dayKeys.map((day) => (
            <td key={day + '_note'} className="border border-gray-600 px-2 py-1 bg-[#0d1117] text-white align-top">
              {isEditable ? (
                <textarea
                  className="w-full border rounded-md px-2 py-1 text-sm bg-[#0d1117] text-white border-gray-600"
                  rows={2}
                  value={notes[day] || ''}
                  onChange={(e) => setNotes({ ...notes, [day]: e.target.value })}
                  placeholder="Uwagi dietetyczne / indywidualne"
                />
              ) : (
                <div className="text-sm italic text-gray-400 whitespace-pre-wrap">
                  {notes[day] || '–'}
                </div>
              )}
            </td>
          ))}
        </tr>
      </tbody>
    </table>

    {isEditable && (
      <div className="mt-4 text-center">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
        >
          Zatwierdź dietę
        </button>
        {saveMessage && (
          <p className="mt-2 text-sm text-green-500 dark:text-green-400 font-medium">
            {saveMessage}
          </p>
        )}
      </div>
    )}
  </div>
);
}
export default React.memo(DietTable);