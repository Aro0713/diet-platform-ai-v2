import { Meal } from '../types';

export function parseMealPlanPreview(parsed: any): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {};

  const sourcePlan = parsed.mealPlan || parsed.week_plan;

  // Obsługa klasycznej tablicy dni
  if (sourcePlan && Array.isArray(sourcePlan)) {
    for (const entry of sourcePlan) {
      const { day, meals } = entry;
      if (!Array.isArray(meals)) continue;

      result[day] = meals.map((m: any) => ({
        name: m.meal || '',
        time: m.time || '',
        description: m.description || '',
        ingredients: Array.isArray(m.ingredients)
          ? m.ingredients
          : [{ product: m.description || 'brak', weight: 0 }],
        calories: m.calories || 0,
        glycemicIndex: m.glycemicIndex ?? 0,
        macros: m.macros || { protein: 0, carbs: 0, fat: 0, sodium: 0 } // jeśli kiedyś będzie
      }));
    }

    return result;
  }

  // Obsługa obiektu dietPlan (np. z API)
  if (parsed.dietPlan && typeof parsed.dietPlan === 'object') {
    for (const [day, mealsObj] of Object.entries(parsed.dietPlan)) {
      const meals: Meal[] = Object.entries(mealsObj as any).map(
        ([name, meal]: [string, any]) => ({
          name,
          time: meal.time || '',
          description: meal.menu || '',
          ingredients: Array.isArray(meal.ingredients)
            ? meal.ingredients
            : [{ product: meal.menu || 'brak', weight: 0 }],
          calories: meal.kcal || 0,
          glycemicIndex: meal.glycemicIndex ?? 0,
          macros: meal.macros || { protein: 0, carbs: 0, fat: 0, sodium: 0 }
        })
      );

      result[day] = meals;
    }

    return result;
  }

  return result;
}
