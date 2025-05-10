import { Meal } from '../types';

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
