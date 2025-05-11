import { Meal } from '../types';

export function parseMealPlanPreview(parsed: any): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {};

  // Obsługa struktury mealPlan[]
  if (parsed.mealPlan && Array.isArray(parsed.mealPlan)) {
    for (const entry of parsed.mealPlan) {
      const { day, meals } = entry;
      if (!Array.isArray(meals)) continue;

      result[day] = meals.map((m: any) => ({
        name: m.meal || '',
        description: m.description || '',
        ingredients: [{ product: m.description || '', weight: 0 }],
        calories: 0,
        glycemicIndex: 0
      }));
    }
  }

  return result;
}
