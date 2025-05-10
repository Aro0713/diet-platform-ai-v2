import React, { useState, useEffect } from 'react';

interface MealPlanConfigProps {
  onConfigured: (data: {
    mealsPerDay: number;
    meals: { name: string; time: string }[];
  }) => void;
}

export const MealPlanConfig: React.FC<MealPlanConfigProps> = ({ onConfigured }) => {
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [meals, setMeals] = useState<{ name: string; time: string }[]>([]);

  useEffect(() => {
    const defaultNames = ['Śniadanie', 'Obiad', 'Kolacja'];
    const updated = Array.from({ length: mealsPerDay }, (_, i) => ({
      name: defaultNames[i] || '',
      time: '',
    }));
    setMeals(updated);
  }, [mealsPerDay]);

  const updateMeal = (index: number, field: 'name' | 'time', value: string) => {
    const updated = [...meals];
    updated[index][field] = value;
    setMeals(updated);
  };

  const isValid = meals.every((m) => m.name.trim() && m.time.trim());

  useEffect(() => {
    if (isValid) {
      onConfigured({ mealsPerDay, meals });
    }
  }, [mealsPerDay, meals, isValid]);

  return (
    <div className="w-full p-4 border rounded-md shadow-sm bg-white mb-6">
      <h2 className="text-lg font-semibold mb-3">Ustawienia liczby posiłków</h2>

      <label className="block mb-2 text-sm font-medium text-gray-700">
        Liczba posiłków dziennie (wymagane):
      </label>
      <select
        className="mb-4 p-2 border border-gray-300 rounded-md"
        value={mealsPerDay}
        onChange={(e) => setMealsPerDay(Number(e.target.value))}
      >
        <option value={3}>3 posiłki</option>
        <option value={4}>4 posiłki</option>
        <option value={5}>5 posiłków</option>
      </select>

      <div className="grid grid-cols-3 gap-4">
        {meals.map((meal, index) => (
          <div key={index} className="flex flex-col">
            <label className="text-sm font-medium mb-1">Posiłek {index + 1}</label>
            <input
              type="text"
              placeholder={`Nazwa (np. ${meal.name || 'Drugie śniadanie'})`}
              value={meal.name}
              onChange={(e) => updateMeal(index, 'name', e.target.value)}
              className="mb-2 p-2 border border-gray-300 rounded-md"
              required
            />
            <input
              type="time"
              value={meal.time}
              onChange={(e) => updateMeal(index, 'time', e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        ))}
      </div>
    </div>
  );
};
