import React, { useState } from 'react';
import { Meal } from '@/types';
import { LangKey } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';

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
  calories: 0,
  glycemicIndex: 0,
  day: '',
  ingredients: [],
  macros: {
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

  const dayKeys = Object.keys(editableDiet);
  const translatedDays = dayKeys.map((dayKey) =>
    translationsUI[dayKey.toLowerCase()]?.[lang] || dayKey || '???'
  );

  const maxMealCount = Math.max(...Object.values(editableDiet).map((meals) => meals.length));

  const handleInputChange = (day: string, mealIndex: number, field: keyof Meal, value: string) => {
    const updatedDayMeals = [...(editableDiet[day] || [])];
    const meal = updatedDayMeals[mealIndex] ? { ...updatedDayMeals[mealIndex] } : getFallbackMeal();

    if (field === 'calories' || field === 'glycemicIndex') {
      (meal as any)[field] = Number(value);
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

    updatedDayMeals[mealIndex] = meal;
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
                const meal = editableDiet[day]?.[mealIndex] ?? getFallbackMeal();
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
                          {meal.ingredients.map((i, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span>{i.product} ({i.weight}g)</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="text-xs text-gray-400">
                        Kalorie: {meal.calories > 0 ? `${meal.calories} kcal` : '–'} | IG: {meal.glycemicIndex > 0 ? meal.glycemicIndex : '–'}
                      </div>
                       {meal.macros && (
                        <div className="text-xs text-gray-500 leading-tight whitespace-pre-wrap">
                          B: {meal.macros.protein ?? 0}g, T: {meal.macros.fat ?? 0}g, W: {meal.macros.carbs ?? 0}g
                          <br />
                          🌿 Błonnik: {meal.macros.fiber ?? 0}g | 🧂 Sód: {meal.macros.sodium ?? 0}mg | 🥔 Potas: {meal.macros.potassium ?? 0}mg
                          <br />
                          🦴 Wapń: {meal.macros.calcium ?? 0}mg | 🧬 Magnez: {meal.macros.magnesium ?? 0}mg | 🩸 Żelazo: {meal.macros.iron ?? 0}mg | 🧪 Cynk: {meal.macros.zinc ?? 0}mg
                          <br />
                          ☀️ Wit. D: {meal.macros.vitaminD ?? 0}µg | 🧠 B12: {meal.macros.vitaminB12 ?? 0}µg | 🍊 C: {meal.macros.vitaminC ?? 0}mg
                          <br />
                          👁️ A: {meal.macros.vitaminA ?? 0}µg | 🧈 E: {meal.macros.vitaminE ?? 0}mg | 💉 K: {meal.macros.vitaminK ?? 0}µg
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
              const macros = sumDailyMacros(editableDiet[day] || []);
              return (
                <td key={day + '_sum'} className="border border-gray-600 px-2 py-1 text-left text-gray-300 whitespace-pre-wrap align-top">
                  B: {macros.protein}g, T: {macros.fat}g, W: {macros.carbs}g<br />
                  🌿 Błonnik: {macros.fiber}g | 🧂 Sód: {macros.sodium}mg | 🥔 Potas: {macros.potassium}mg<br />
                  🦴 Wapń: {macros.calcium}mg | 🧬 Magnez: {macros.magnesium}mg | 🩸 Żelazo: {macros.iron}mg | 🧪 Cynk: {macros.zinc}mg<br />
                  ☀️ Wit. D: {macros.vitaminD}µg | 🧠 B12: {macros.vitaminB12}µg | 🍊 C: {macros.vitaminC}mg<br />
                  👁️ A: {macros.vitaminA}µg | 🧈 E: {macros.vitaminE}mg | 💉 K: {macros.vitaminK}µg
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
              const weekly = sumWeeklyMacros(editableDiet);
              return (
                <>
                  <div dangerouslySetInnerHTML={{ __html: translationsUI.weeklyTotal?.[lang] || '7 dni razem:' }} />
                  B: {weekly.protein}g, T: {weekly.fat}g, W: {weekly.carbs}g<br />
                  🌿 Błonnik: {weekly.fiber}g | 🧂 Sód: {weekly.sodium}mg | 🥔 Potas: {weekly.potassium}mg<br />
                  🦴 Wapń: {weekly.calcium}mg | 🧬 Magnez: {weekly.magnesium}mg | 🩸 Żelazo: {weekly.iron}mg | 🧪 Cynk: {weekly.zinc}mg<br />
                  ☀️ Wit. D: {weekly.vitaminD}µg | 🧠 B12: {weekly.vitaminB12}µg | 🍊 C: {weekly.vitaminC}mg<br />
                  👁️ A: {weekly.vitaminA}µg | 🧈 E: {weekly.vitaminE}mg | 💉 K: {weekly.vitaminK}µg
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
};

export default React.memo(DietTable);
