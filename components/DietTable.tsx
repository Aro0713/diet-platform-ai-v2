import React, { useState, useEffect } from 'react';
import { Meal } from '@/types';

interface DietTableProps {
  editableDiet: Record<string, Meal[]>;
  setEditableDiet: (diet: Record<string, Meal[]>) => void;
  setConfirmedDiet: (diet: Record<string, Meal[]>) => void;
  isEditable: boolean;
}

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

const DietTable: React.FC<DietTableProps> = ({ editableDiet, setEditableDiet, setConfirmedDiet, isEditable }) => {
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (saveMessage) {
      const timeout = setTimeout(() => setSaveMessage(''), 3000);
      return () => clearTimeout(timeout);
    }
  }, [editableDiet]);

  const allMealCounts = DAYS.map((day) => editableDiet[day]?.length || 0);
  const uniformMealCount = allMealCounts.every((count) => count === allMealCounts[0]) ? allMealCounts[0] : Math.max(...allMealCounts);

  const handleInputChange = (day: string, mealIndex: number, field: keyof Meal, value: string) => {
    const updatedDayMeals = [...(editableDiet[day] || [])];
    const meal = { ...updatedDayMeals[mealIndex] };

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
    console.log('🛠️ updatedDayMeals:', updatedDayMeals);
    setEditableDiet({ ...editableDiet, [day]: updatedDayMeals });
  };

  const validateDiet = () => {
    for (const day of DAYS) {
      const meals = editableDiet[day] || [];
      if (meals.length !== uniformMealCount) return false;
      for (const meal of meals) {
        if (!meal.name || meal.name.trim() === '') return false;
        for (const ing of meal.ingredients) {
          if (!ing.product || ing.product.trim() === '') return false;
          if (!ing.weight || ing.weight <= 0) return false;
        }
      }
    }
    return true;
  };

  const handleSave = () => {
    if (validateDiet()) {
      setConfirmedDiet(editableDiet);
      setSaveMessage('✅ Zapisano zmiany');
    } else {
      setSaveMessage('❌ Uzupełnij wszystkie pola');
    }
  };

  return (
    <div className="overflow-auto">
      <table className="min-w-full border border-gray-500 bg-white text-black shadow-md">
        <thead>
          <tr>
            <th className="border border-gray-500 bg-gray-200 text-sm font-semibold text-black px-2 py-1 text-left">#</th>
            {DAYS.map((day) => (
              <th key={day} className="border border-gray-500 bg-gray-200 text-sm font-semibold text-black px-2 py-1 text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: uniformMealCount }).map((_, mealIndex) => (
            <tr key={mealIndex}>
              <td className="border border-gray-400 bg-white px-2 py-1 font-semibold">Posiłek {mealIndex + 1}</td>
              {DAYS.map((day) => {
                const meal = editableDiet[day]?.[mealIndex];
                return (
                  <td key={day + mealIndex} className="border border-gray-400 bg-white px-2 py-1 align-top text-black">
                    {meal ? (
                      <div className="space-y-1">
                        {isEditable ? (
                          <>
                            <input
                              type="text"
                              className="w-full border rounded px-1 py-0.5 mb-1"
                              value={meal.name ?? ''}
                              onChange={(e) => handleInputChange(day, mealIndex, 'name', e.target.value)}
                              placeholder="Nazwa"
                            />
                            <textarea
                              className="w-full border rounded px-1 py-0.5 mb-1 text-sm"
                              rows={2}
                              value={meal.description ?? ''}
                              onChange={(e) => handleInputChange(day, mealIndex, 'description', e.target.value)}
                              placeholder="Opis (AI)"
                            />
                            <textarea
                              className="w-full border rounded px-1 py-0.5 mb-1 text-sm"
                              rows={2}
                              value={meal.ingredients?.map(i => `${i.product} (${i.weight}g)`).join(', ') ?? ''}
                              onChange={(e) => handleInputChange(day, mealIndex, 'ingredients', e.target.value)}
                              placeholder="Składniki"
                            />
                            <input
                              type="number"
                              className="w-full border rounded px-1 py-0.5 mb-1 text-xs"
                              value={meal.calories ?? 0}
                              onChange={(e) => handleInputChange(day, mealIndex, 'calories', e.target.value)}
                              placeholder="Kalorie"
                            />
                            <input
                              type="number"
                              className="w-full border rounded px-1 py-0.5 mb-1 text-xs"
                              value={meal.glycemicIndex ?? 0}
                              onChange={(e) => handleInputChange(day, mealIndex, 'glycemicIndex', e.target.value)}
                              placeholder="IG"
                            />
                          </>
                        ) : (
                          <>
                            <div className="font-semibold">{meal.name}</div>
                            {meal.description && (
                              <div className="text-sm italic mb-1 animate-typewriter relative whitespace-pre-wrap overflow-hidden border-r-2 border-gray-500">
                                {meal.description}
                                <span className="ml-1 inline-block w-1 h-5 bg-gray-700 animate-cursor"></span>
                              </div>
                            )}
                            <ul className="text-sm list-disc list-inside">
                              {meal.ingredients.map((i, idx) => (
                                <li key={idx}>{i.product} ({i.weight}g)</li>
                              ))}
                            </ul>
                            <div className="text-xs">Kalorie: {meal.calories} | IG: {meal.glycemicIndex}</div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
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
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Zatwierdź dietę
          </button>
          {saveMessage && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              {saveMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(DietTable);

