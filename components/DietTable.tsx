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
    potassium: 0
  }
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

  const getFoodIcon = (product: string): string | null => {
    const p = product.toLowerCase();
    if (p.includes('brokuł') || p.includes('marchew') || p.includes('sałata') || p.includes('pomidor')) return '🥦';
    if (p.includes('kurczak') || p.includes('indyk')) return '🐓';
    if (p.includes('wołowina') || p.includes('wieprzowina') || p.includes('jagnięcina')) return '🐄';
    if (p.includes('ryba') || p.includes('łosoś') || p.includes('tuńczyk')) return '🐟';
    if (p.includes('ser') || p.includes('mozarella') || p.includes('feta')) return '🧀';
    if (p.includes('szynka') || p.includes('kiełbasa') || p.includes('boczek')) return '🥩';
    if (p.includes('napój') || p.includes('herbata') || p.includes('sok') || p.includes('kawa')) return '☕';
    if (p.includes('ciasto') || p.includes('deser') || p.includes('lody') || p.includes('czekolada')) return '🍰';
    return null;
  };

  const dayKeys = Object.keys(editableDiet);
  const translatedDays = dayKeys.map((dayKey) =>
    translationsUI[dayKey.toLowerCase()]?.[lang] || dayKey || '???'
  );

  const uniqueMealNames = Array.from(
    new Set(
      Object.values(editableDiet)
        .flat()
        .map((meal) => meal.name || '')
        .filter(Boolean)
    )
  );

  const translatedMeals = uniqueMealNames.map((mealName) => ({
    label: translationsUI[mealName.toLowerCase()]?.[lang] || mealName || '???',
    key: mealName,
  }));

  const handleInputChange = (day: string, mealName: string, field: keyof Meal, value: string) => {
    const updatedDayMeals = [...(editableDiet[day] || [])];
    const index = updatedDayMeals.findIndex((m) => m.name === mealName);
    if (index === -1) return;
    const meal = { ...updatedDayMeals[index] };

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

    updatedDayMeals[index] = meal;
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
            <th className="border border-gray-600 bg-gray-800 text-sm font-semibold text-white px-4 py-2 text-center">#</th>
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
          {translatedMeals.map(({ label, key }, mealIndex) => (
            <tr key={mealIndex}>
              <td className="border border-gray-600 bg-[#0d1117] px-3 py-2 align-top font-medium">
                {label}
              </td>
              {dayKeys.map((day) => {
              const meal: Meal = (editableDiet[day] || []).find((m) => m.name === key) ?? getFallbackMeal();


                return (
                  <td key={day + key} className="border border-gray-600 bg-[#0d1117] px-3 py-2 align-top text-white">
                    <div className="space-y-2">
                      {isEditable ? (
                        <>
                          <input
                            type="text"
                            className="w-full border rounded-md px-2 py-1 mb-1 font-semibold text-base bg-[#0d1117] text-white border-gray-600"
                            value={meal.name}
                            onChange={(e) => handleInputChange(day, key, 'name', e.target.value)}
                            placeholder="Nazwa"
                          />
                          <input
                            type="text"
                            className="w-full border rounded-md px-2 py-1 mb-1 text-xs bg-[#0d1117] text-white border-gray-600"
                            value={meal.time}
                            onChange={(e) => handleInputChange(day, key, 'time', e.target.value)}
                            placeholder="Godzina"
                          />
                          <textarea
                            className="w-full border rounded-md px-2 py-1 mb-1 text-sm bg-[#0d1117] text-white border-gray-600"
                            rows={2}
                            value={meal.description || ''}
                            onChange={(e) => handleInputChange(day, key, 'description', e.target.value)}
                            placeholder="Opis (AI)"
                          />
                          <textarea
                            className="w-full border rounded-md px-2 py-1 mb-1 text-sm bg-[#0d1117] text-white border-gray-600"
                            rows={2}
                            value={(meal.ingredients ?? []).map(i => `${i.product} (${i.weight}g)`).join(', ')}
                            onChange={(e) => handleInputChange(day, key, 'ingredients', e.target.value)}
                            placeholder="Składniki"
                          />
                         <div className="flex items-center gap-1">
                          <input
                            type="number"
                            className="w-full border rounded-md px-2 py-1 mb-1 text-xs bg-[#0d1117] text-white border-gray-600"
                            value={meal.calories}
                            onChange={(e) => handleInputChange(day, key, 'calories', e.target.value)}
                            placeholder="Kalorie"
                          />
                          <span className="text-xs text-gray-400">kcal</span>
                        </div>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              className="w-full border rounded-md px-2 py-1 mb-1 text-xs bg-[#0d1117] text-white border-gray-600"
                              value={meal.glycemicIndex}
                              onChange={(e) => handleInputChange(day, key, 'glycemicIndex', e.target.value)}
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
                          <ul className="text-sm list-inside space-y-1">
                            {(meal.ingredients || []).length > 0 ? (
                              meal.ingredients.map((i, idx) => {
                                const icon = getFoodIcon(i.product);
                                return (
                                  <li key={idx} className="flex items-center gap-2">
                                    {icon && <span className="text-lg">{icon}</span>}
                                    <span>{i.product} ({i.weight}g)</span>
                                  </li>
                                );
                              })
                            ) : (
                              <li className="text-gray-500 italic">Brak składników</li>
                            )}
                          </ul>
                           <div className="text-xs mt-1 text-gray-400">
                          Kalorie: {meal.calories > 0 ? `${meal.calories} kcal` : '–'} | IG: {meal.glycemicIndex > 0 ? meal.glycemicIndex : '–'}
                        </div>

                        {meal.macros && (
                          <div className="text-xs mt-1 text-gray-500">
                            B: {meal.macros.protein ?? '–'}g, T: {meal.macros.fat ?? '–'}g, W: {meal.macros.carbs ?? '–'}g
                            {meal.macros?.fiber && meal.macros.fiber > 0 && `, błonnik: ${meal.macros.fiber}g`}
                            {meal.macros?.potassium && meal.macros.potassium > 0 && `, K: ${meal.macros.potassium}mg`}
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
          <tr className="bg-[#222c3f] font-semibold text-sm text-white">
            <td className="border border-gray-600 px-2 py-1 text-right">Suma</td>
            {dayKeys.map((day) => {
              const macros = sumDailyMacros(editableDiet[day] || []);
              return (
                <td key={day + '_sum'} className="border border-gray-600 px-2 py-1 text-xs text-gray-300">
                B: {macros.protein}g<br />
                T: {macros.fat}g<br />
                W: {macros.carbs}g<br />
                {macros.fiber > 0 && <>błonnik: {macros.fiber}g<br /></>}
                {macros.potassium > 0 && <>K: {macros.potassium}mg</>}
              </td>
              );
            })}
          </tr>
          <tr className="bg-[#1f2a3c] font-semibold text-sm text-white">
          <td className="border border-gray-600 px-2 py-1 text-right">Suma tygodnia</td>
          {(() => {
            const weekly = sumWeeklyMacros(editableDiet);
            return dayKeys.map((_, idx) => (
              <td
                key={`week_sum_${idx}`}
                className="border border-gray-600 px-2 py-1 text-xs text-gray-300"
              >
                {idx === 0 ? (
                  <>
                  B: {weekly.protein}g<br />
                  T: {weekly.fat}g<br />
                  W: {weekly.carbs}g<br />
                  {weekly.fiber > 0 && <>błonnik: {weekly.fiber}g<br /></>}
                  {weekly.potassium > 0 && <>K: {weekly.potassium}mg</>}
                </>
                ) : null}
              </td>
            ));
          })()}
          </tr>
          <tr>
            <td className="font-semibold bg-gray-800 border border-gray-600 px-2 py-1">Uwagi</td>
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

