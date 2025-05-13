import React, { useState, useEffect } from 'react';
import { LangKey } from '../utils/i18n';

interface MealPlanConfigProps {
  onConfigured: (data: {
    mealsPerDay: number;
    meals: { name: string; time: string }[];
  }) => void;
  lang: LangKey;
}

const mealNameTranslations: Record<string, Record<LangKey, string>> = {
  breakfast: {
    pl: 'Śniadanie', en: 'Breakfast', ua: 'Сніданок', ru: 'Завтрак',
    es: 'Desayuno', fr: 'Petit-déjeuner', de: 'Frühstück',
    zh: '早餐', hi: 'नाश्ता', ar: 'فطور', he: 'ארוחת בוקר'
  },
  second: {
    pl: 'Drugie śniadanie', en: 'Second breakfast', ua: 'Другий сніданок', ru: 'Второй завтрак',
    es: 'Segundo desayuno', fr: 'Deuxième petit-déjeuner', de: 'Zweites Frühstück',
    zh: '第二早餐', hi: 'दूसरा नाश्ता', ar: 'الفطور الثاني', he: 'בוקר שני'
  },
  lunch: {
    pl: 'Obiad', en: 'Lunch', ua: 'Обід', ru: 'Обед',
    es: 'Almuerzo', fr: 'Déjeuner', de: 'Mittagessen',
    zh: '午餐', hi: 'दोपहर का भोजन', ar: 'غداء', he: 'ארוחת צהריים'
  },
  snack: {
    pl: 'Podwieczorek', en: 'Snack', ua: 'Полуденок', ru: 'Полдник',
    es: 'Merienda', fr: 'Goûter', de: 'Zwischenmahlzeit',
    zh: '小吃', hi: 'नाश्ता', ar: 'وجبة خفيفة', he: 'ארוחת ביניים'
  },
  dinner: {
    pl: 'Kolacja', en: 'Dinner', ua: 'Вечеря', ru: 'Ужин',
    es: 'Cena', fr: 'Dîner', de: 'Abendessen',
    zh: '晚餐', hi: 'रात का खाना', ar: 'عشاء', he: 'ארוחת ערב'
  },
  night: {
    pl: 'Posiłek nocny', en: 'Night meal', ua: 'Нічна їжа', ru: 'Ночной приём пищи',
    es: 'Comida nocturna', fr: 'Repas nocturne', de: 'Nachtmahl',
    zh: '夜宵', hi: 'रात का नाश्ता', ar: 'وجبة ليلية', he: 'ארוחת לילה'
  }
};

export const MealPlanConfig: React.FC<MealPlanConfigProps> = ({ onConfigured, lang }) => {
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [meals, setMeals] = useState<{ name: string; time: string }[]>([]);

  useEffect(() => {
    const mealKeys = ['breakfast', 'second', 'lunch', 'snack', 'dinner', 'night'];
    const defaultNames = mealKeys.map((key) => mealNameTranslations[key][lang] || mealNameTranslations[key].pl);
    const updated = Array.from({ length: mealsPerDay }, (_, i) => ({
      name: defaultNames[i] || `Posiłek ${i + 1}`,
      time: '',
    }));
    setMeals(updated);
  }, [mealsPerDay, lang]);

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
  }, [mealsPerDay, meals, isValid, onConfigured]);

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
        {[2, 3, 4, 5, 6].map((num) => (
          <option key={num} value={num}>
            {num} posiłki{num === 2 || num === 6 ? ' (rzadko)' : ''}
          </option>
        ))}
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
