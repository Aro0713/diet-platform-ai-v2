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
        description: m.description || '',
        ingredients: [{ product: m.description || '', weight: 0 }],
        calories: 0,
        glycemicIndex: 0
      }));
    }

    return result;
  }

  // Obsługa dietPlan – obiekt z dniami jako klucze i posiłkami jako nazwy
  if (parsed.dietPlan && typeof parsed.dietPlan === 'object') {
    for (const [day, mealsObj] of Object.entries(parsed.dietPlan)) {
      const meals: Meal[] = Object.entries(mealsObj as any).map(
        ([name, meal]: [string, any]) => ({
          name,
          description: meal.menu || '',
          ingredients: [{ product: meal.menu || '', weight: 0 }],
          calories: 0,
          glycemicIndex: 0
        })
      );

      result[day] = meals;
    }

    return result;
  }

  return result;
}
