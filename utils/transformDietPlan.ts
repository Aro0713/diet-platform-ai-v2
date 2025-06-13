import { Meal } from '@/types';

type RawMeal = {
  time?: string;
  menu?: string;
  kcal?: number;
  glycemicIndex?: number;
  ingredients?: { product: string; weight: number }[];
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
  };
};

const standardOrder = ['Śniadanie', 'Drugie śniadanie', 'Obiad', 'Podwieczorek', 'Kolacja'];

const dayMap: Record<string, string> = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela'
};

const mealMap: Record<string, string> = {
  breakfast: 'Śniadanie',
  'second breakfast': 'Drugie śniadanie',
  lunch: 'Obiad',
  snack: 'Podwieczorek',
  dinner: 'Kolacja'
};

export function transformDietPlanToEditableFormat(
  dietPlan: Record<string, Record<string, RawMeal>>
): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {};

  for (const day in dietPlan) {
    const mappedDay = dayMap[day.toLowerCase()] || day;
    const mealsForDay = dietPlan[day];
    const normalizedDay: Meal[] = [];

    for (const rawKey in mealsForDay) {
      const rawMealName = rawKey.trim().toLowerCase();
      const mappedMealName = mealMap[rawMealName] || rawKey;

      const mealData = mealsForDay[rawKey];
      if (!mealData || typeof mealData !== 'object') continue;

      normalizedDay.push({
        name: mappedMealName,
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

    normalizedDay.sort((a, b) =>
      standardOrder.indexOf(a.name) - standardOrder.indexOf(b.name)
    );

    result[mappedDay] = normalizedDay;
  }

  return result;
}
