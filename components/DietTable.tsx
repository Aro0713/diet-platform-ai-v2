import React, { useState } from 'react';
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

  const maxMeals = Math.max(
    ...DAYS.map((day) => editableDiet[day]?.length || 0)
  );

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
    setEditableDiet({ ...editableDiet, [day]: updatedDayMeals });
  };

  const validateDiet = () => {
    for (const day of DAYS) {
      for (const meal of editableDiet[day] || []) {
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
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('❌ Uzupełnij wszystkie pola');
      setTimeout(() => setSaveMessage(''), 4000);
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
          {Array.from({ length: maxMeals }).map((_, mealIndex) => (
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
                              value={meal.ingredients?.map(i => `${i.product} (${i.weight}g)`).join(', ') ?? ''}
                              onChange={(e) => handleInputChange(day, mealIndex, 'ingredients', e.target.value)}
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

export default DietTable;
