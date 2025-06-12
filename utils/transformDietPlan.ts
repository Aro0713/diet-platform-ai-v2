// utils/transformDietPlan.ts
import { Meal } from '@/types';

const standardOrder = ['Śniadanie', 'Drugie śniadanie', 'Obiad', 'Podwieczorek', 'Kolacja'];

export function transformDietPlanToEditableFormat(dietPlan: Record<string, any>): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {};

  for (const day in dietPlan) {
    const mealsForDay = dietPlan[day];
    const normalizedDay: Meal[] = [];

    for (const mealName of standardOrder) {
      const mealData = mealsForDay?.[mealName];

      if (mealData) {
normalizedDay.push({
  name: mealName,
  time: mealData.time ?? '',
  description: mealData.menu ?? '',
  ingredients: Array.isArray(mealData.ingredients) ? mealData.ingredients : [],
  calories: mealData.kcal ?? 0,
  glycemicIndex: mealData.glycemicIndex ?? 0,
  macros: {
    protein: mealData.macros?.protein ?? 0,
    carbs: mealData.macros?.carbs ?? 0,
    fat: mealData.macros?.fat ?? 0,
    sodium: mealData.macros?.sodium ?? 0
  }
});
      }
    }

    result[day] = normalizedDay;
  }

  return result;
}
