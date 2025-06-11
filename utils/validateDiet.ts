import { Meal } from '../types';
import { dietModelMeta } from '../utils/dietModelMeta';

export function validateDiet(diet: Meal[]): Record<number, string[]> {
  const errors: Record<number, string[]> = {};

  diet.forEach((meal, index) => {
    const currentErrors: string[] = [];

    if (!meal.name || meal.name.trim().length < 3) {
      currentErrors.push('Brak lub zbyt krótka nazwa posiłku');
    }

    if (!meal.ingredients || meal.ingredients.length === 0) {
      currentErrors.push('Brak składników');
    } else {
      meal.ingredients.forEach((ing, i) => {
        if (!ing.product || ing.product.trim().length < 2) {
          currentErrors.push(`Składnik #${i + 1}: brak nazwy`);
        }
        if (!ing.weight || ing.weight <= 0) {
          currentErrors.push(`Składnik #${i + 1}: nieprawidłowa gramatura`);
        }
      });
    }

    if (!meal.calories || meal.calories < 100) {
      currentErrors.push('Zbyt niska kaloryczność (<100 kcal)');
    }

    if (meal.glycemicIndex === undefined || meal.glycemicIndex < 0 || meal.glycemicIndex > 100) {
      currentErrors.push('Indeks glikemiczny poza zakresem 0–100');
    }

    if (currentErrors.length > 0) {
      errors[index] = currentErrors;
    }
  });

  return errors;
}

export function validateDietWithModel(diet: Meal[], modelName: string): string[] {
  const issues: string[] = [];
  const meta = dietModelMeta[modelName];

  if (!meta) {
    issues.push(`Brak definicji modelu dla: ${modelName}`);
    return issues;
  }

  if (meta.minMeals && diet.length < meta.minMeals) {
    issues.push(`Zbyt mało posiłków (min. ${meta.minMeals})`);
  }
  if (meta.maxMeals && diet.length > meta.maxMeals) {
    issues.push(`Zbyt dużo posiłków (max. ${meta.maxMeals})`);
  }

  if (meta.forbiddenIngredients) {
    diet.forEach((meal, dayIndex) => {
      meal.ingredients.forEach(ing => {
        if (meta.forbiddenIngredients!.some(f => ing.product.toLowerCase().includes(f.toLowerCase()))) {
          issues.push(`Zakazany składnik "${ing.product}" w posiłku dnia ${dayIndex + 1}: ${meal.name}`);
        }
      });
    });
  }

  const ingredientFrequency: Record<string, number> = {};
  diet.forEach(meal => {
    meal.ingredients.forEach(ing => {
      const key = ing.product.toLowerCase();
      ingredientFrequency[key] = (ingredientFrequency[key] || 0) + 1;
    });
  });
  Object.entries(ingredientFrequency).forEach(([product, count]) => {
    if (count > 2) {
      issues.push(`Składnik "${product}" występuje ${count} razy – przekroczony limit (max 2x)`);
    }
  });

  return issues;
}