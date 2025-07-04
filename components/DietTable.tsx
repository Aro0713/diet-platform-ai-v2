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
  },
});

const sumDailyMacros = (meals: Meal[]) => {
  return meals.reduce(
    (acc, meal) => {
      acc.protein += meal.macros?.protein ?? 0;
      acc.fat += meal.macros?.fat ?? 0;
      acc.carbs += meal.macros?.carbs ?? 0;
      acc.fiber += meal.macros?.fiber ?? 0;
      acc.potassium += meal.macros?.potassium ?? 0;
      return acc;
    },
    { protein: 0, fat: 0, carbs: 0, fiber: 0, potassium: 0 }
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
                      {isEditable ? (
                        <>
                          <input
                            type="text"
                            className="w-full border rounded-md px-2 py-1 mb-1 font-semibold text-base bg-[#0d1117] text-white border-gray-600"
                            value={meal.name}
                            onChange={(e) => handleInputChange(day, mealIndex, 'name', e.target.value)}
                            placeholder="Nazwa"
                          />
                          <input
                            type="text"
                            className="w-full border rounded-md px-2 py-1 mb-1 text-xs bg-[#0d1117] text-white border-gray-600"
                            value={meal.time}
                            onChange={(e) => handleInputChange(day, mealIndex, 'time', e.target.value)}
                            placeholder="Godzina"
                          />
                          <textarea
                            className="w-full border rounded-md px-2 py-1 mb-1 text-sm bg-[#0d1117] text-white border-gray-600"
                            rows={2}
                            value={meal.description || ''}
                            onChange={(e) => handleInputChange(day, mealIndex, 'description', e.target.value)}
                            placeholder="Opis (AI)"
                          />
                          <textarea
                            className="w-full border rounded-md px-2 py-1 mb-1 text-sm bg-[#0d1117] text-white border-gray-600"
                            rows={2}
                            value={(meal.ingredients ?? []).map(i => `${i.product} (${i.weight}g)`).join(', ')}
                            onChange={(e) => handleInputChange(day, mealIndex, 'ingredients', e.target.value)}
                            placeholder="Składniki"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              className="w-full border rounded-md px-2 py-1 mb-1 text-xs bg-[#0d1117] text-white border-gray-600"
                              value={meal.calories}
                              onChange={(e) => handleInputChange(day, mealIndex, 'calories', e.target.value)}
                              placeholder="Kalorie"
                            />
                            <span className="text-xs text-gray-400">kcal</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              className="w-full border rounded-md px-2 py-1 mb-1 text-xs bg-[#0d1117] text-white border-gray-600"
                              value={meal.glycemicIndex}
                              onChange={(e) => handleInputChange(day, mealIndex, 'glycemicIndex', e.target.value)}
                              placeholder="IG"
                            />
                            <span className="text-xs text-gray-400">IG</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-base">{meal.name}</div>
                          {meal.time && <div className="text-xs text-gray-400">🕒 {meal.time}</div>}
                          {meal.description && (
                            <div className="text-sm italic mb-1 whitespace-pre-wrap border-l-2 border-gray-600 pl-2">
                              {meal.description}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
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
