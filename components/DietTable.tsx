import React, { useState } from 'react';
import { Meal } from '@/types';
import { LangKey } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';


function normalizeDietData(input: any): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {};
  if (!input || typeof input !== 'object') return result;

  for (const [day, rawDayData] of Object.entries(input)) {
    const meals: Meal[] = [];

    // Obsługa GPT (Record<string, Meal>)
    if (rawDayData && typeof rawDayData === 'object' && !Array.isArray(rawDayData)) {
      for (const [key, meal] of Object.entries(rawDayData)) {
        if (!meal || typeof meal !== 'object') continue;

        meals.push({
          name: meal.name || meal.mealName || key || 'Posiłek',
          menu: meal.menu || meal.name || 'Posiłek',
          time: meal.time || key || '00:00',
          day,
          glycemicIndex: meal.glycemicIndex ?? 0,
          ingredients: (meal.ingredients || []).map((i: any) => ({
          product: i.product || i.name || '',
          weight:
            typeof i.quantity === 'number'
              ? i.quantity
              : typeof i.quantity === 'string'
              ? parseFloat(i.quantity)
              : 0
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

    // Obsługa poprawnego Meal[]
    if (Array.isArray(rawDayData)) {
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
            typeof i.quantity === 'number'
              ? i.quantity
              : typeof i.quantity === 'string'
              ? parseFloat(i.quantity)
              : 0
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
        weight: typeof i.weight === 'number' ? i.weight : Number(i.weight) || 0,
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
interface DietTableProps {
  editableDiet: Record<string, Meal[]>;
  setEditableDiet: (diet: Record<string, Meal[]>) => void;
  setConfirmedDiet: (diet: Record<string, Meal[]>) => void;
  isEditable: boolean;
  lang: LangKey;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
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
  const [saveMessage, setSaveMessage] = useState('');
  const safeDiet = normalizeDietData(editableDiet);
  const dayKeys = Object.keys(safeDiet);
  const translatedDays = dayKeys.map((dayKey) =>
    translationsUI[dayKey.toLowerCase()]?.[lang] || dayKey || '???'
  );

  const maxMealCount = Math.max(...Object.values(safeDiet).map((meals) => meals.length));

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

  const handleSave = () => {
    if (validateDiet()) {
      setConfirmedDiet(editableDiet);
      setSaveMessage('✅ Zapisano zmiany');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('❌ Uzupełnij wszystkie pola');
      setTimeout(() => setSaveMessage(''), 4000);
    }
  };
return (
  <div className="overflow-auto">
    <table className="min-w-full border border-gray-600 bg-[#1a1e2c]/90 text-white shadow-md rounded-md overflow-hidden">
      <thead>
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
                    <div className="font-semibold text-base">
                      {translationsUI[meal.name?.toLowerCase()]?.[lang] || meal.name}
                    </div>
                    {meal.time && (
                      <div className="text-xs text-gray-400">🕒 {meal.time}</div>
                    )}
                    {meal.ingredients?.length > 0 && (
                     <ul className="text-sm list-inside space-y-1">
                      {meal.ingredients.map((i, idx) => {
                        const weight = i.weight ?? (i as any).quantity ?? 0;
                        return (
                          <li key={idx} className="flex items-center gap-2">
                            <span>{i.product} ({weight}g)</span>
                          </li>
                        );
                      })}
                    </ul>
                    )}
                    <div className="text-xs text-gray-400">
                      Kalorie: {meal.macros?.kcal && meal.macros.kcal > 0 ? `${round(meal.macros.kcal)} kcal` : '–'} | IG: {meal.glycemicIndex > 0 ? meal.glycemicIndex : '–'}
                    </div>
                    {meal.macros && (
                      <div className="text-xs text-gray-500 leading-tight whitespace-pre-wrap">
                        B: {round(meal.macros.protein ?? 0)}g, T: {round(meal.macros.fat ?? 0)}g, W: {round(meal.macros.carbs ?? 0)}g
                        <br />
                        🌿 Błonnik: {round(meal.macros.fiber ?? 0)}g | 🧂 Sód: {round(meal.macros.sodium ?? 0)}mg | 🥔 Potas: {round(meal.macros.potassium ?? 0)}mg
                        <br />
                        🦴 Wapń: {round(meal.macros.calcium ?? 0)}mg | 🧬 Magnez: {round(meal.macros.magnesium ?? 0)}mg | 🩸 Żelazo: {round(meal.macros.iron ?? 0)}mg | 🧪 Cynk: {round(meal.macros.zinc ?? 0)}mg
                        <br />
                        ☀️ Wit. D: {round(meal.macros.vitaminD ?? 0)}µg | 🧠 B12: {round(meal.macros.vitaminB12 ?? 0)}µg | 🍊 C: {round(meal.macros.vitaminC ?? 0)}mg
                        <br />
                        👁️ A: {round(meal.macros.vitaminA ?? 0)}µg | 🧈 E: {round(meal.macros.vitaminE ?? 0)}mg | 💉 K: {round(meal.macros.vitaminK ?? 0)}µg
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
                B: {round(macros.protein)}g, T: {round(macros.fat)}g, W: {round(macros.carbs)}g<br />
                🌿 Błonnik: {round(macros.fiber)}g | 🧂 Sód: {round(macros.sodium)}mg | 🥔 Potas: {round(macros.potassium)}mg<br />
                🦴 Wapń: {round(macros.calcium)}mg | 🧬 Magnez: {round(macros.magnesium)}mg | 🩸 Żelazo: {round(macros.iron)}mg | 🧪 Cynk: {round(macros.zinc)}mg<br />
                ☀️ Wit. D: {round(macros.vitaminD)}µg | 🧠 B12: {round(macros.vitaminB12)}µg | 🍊 C: {round(macros.vitaminC)}mg<br />
                👁️ A: {round(macros.vitaminA)}µg | 🧈 E: {round(macros.vitaminE)}mg | 💉 K: {round(macros.vitaminK)}µg
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
                  B: {round(weekly.protein)}g, T: {round(weekly.fat)}g, W: {round(weekly.carbs)}g<br />
                  🌿 Błonnik: {round(weekly.fiber)}g | 🧂 Sód: {round(weekly.sodium)}mg | 🥔 Potas: {round(weekly.potassium)}mg<br />
                  🦴 Wapń: {round(weekly.calcium)}mg | 🧬 Magnez: {round(weekly.magnesium)}mg | 🩸 Żelazo: {round(weekly.iron)}mg | 🧪 Cynk: {round(weekly.zinc)}mg<br />
                  ☀️ Wit. D: {round(weekly.vitaminD)}µg | 🧠 B12: {round(weekly.vitaminB12)}µg | 🍊 C: {round(weekly.vitaminC)}mg<br />
                  👁️ A: {round(weekly.vitaminA)}µg | 🧈 E: {round(weekly.vitaminE)}mg | 💉 K: {round(weekly.vitaminK)}µg
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