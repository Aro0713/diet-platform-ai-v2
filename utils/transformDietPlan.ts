// utils/transformDietPlan.ts

import { Meal } from '@/types';

/**
 * Przekształca strukturę dietPlan z API (obiekt z posiłkami jako właściwościami)
 * na format akceptowany przez DietTable – tablicę posiłków na każdy dzień.
 */
export function transformDietPlanToEditableFormat(dietPlan: Record<string, any>): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {};

  for (const day in dietPlan) {
    const mealsForDay = dietPlan[day];
    const mealArray: Meal[] = [];

    for (const mealName in mealsForDay) {
      const mealData = mealsForDay[mealName];

      mealArray.push({
        name: mealName,
        time: mealData.time ?? '',
        description: mealData.menu ?? '',
        ingredients: mealData.ingredients ?? [],
        calories: mealData.kcal ?? 0,
        glycemicIndex: mealData.glycemicIndex ?? 0,
      });
    }

    result[day] = mealArray;
  }

  return result;
}
