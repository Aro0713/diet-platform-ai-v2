import { Meal } from "@/types";

// 🔢 Analiza makroskładników – dla DietTable (array)
export function calculateMacroPercentagesFromPlan(dietPlan: Record<string, Meal[]>) {
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  for (const meals of Object.values(dietPlan)) {
    for (const meal of meals) {
      const macros = meal.macros || {};
      totalProtein += macros.protein || 0;
      totalFat += macros.fat || 0;
      totalCarbs += macros.carbs || 0;
    }
  }

  const totalKcal = totalProtein * 4 + totalFat * 9 + totalCarbs * 4;
  if (totalKcal === 0) return { protein: 0, fat: 0, carbs: 0 };

  return {
    protein: Math.round((totalProtein * 4 / totalKcal) * 1000) / 10,
    fat: Math.round((totalFat * 9 / totalKcal) * 1000) / 10,
    carbs: Math.round((totalCarbs * 4 / totalKcal) * 1000) / 10
  };
}

// 💊 Mikroskładniki – dla DietTable (array)
export function calculateMicroSumsFromPlan(dietPlan: Record<string, Meal[]>) {
  const sums: Record<string, number> = {};

  for (const meals of Object.values(dietPlan)) {
    for (const meal of meals) {
      const micros = meal.micros || {};
      for (const [key, value] of Object.entries(micros)) {
        const parsed = typeof value === "number" ? value : parseFloat(value as string);
        if (!isNaN(parsed)) {
          sums[key] = (sums[key] || 0) + parsed;
        }
      }
    }
  }

  return Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, Math.round(v * 100) / 100])
  );
}

// 💊 Mikroskładniki – dla dqAgent (structured)
export function calculateMicroSumsFromStructuredPlan(dietPlan: Record<string, Record<string, Meal>>) {
  const sums: Record<string, number> = {};

  for (const day of Object.values(dietPlan)) {
    for (const meal of Object.values(day)) {
      const micros = meal.micros || {};
      for (const [key, value] of Object.entries(micros)) {
        const parsed = typeof value === "number" ? value : parseFloat(value as string);
        if (!isNaN(parsed)) {
          sums[key] = (sums[key] || 0) + parsed;
        }
      }
    }
  }

  return Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, Math.round(v * 100) / 100])
  );
}
