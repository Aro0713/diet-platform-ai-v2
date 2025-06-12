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

export function validateDietWithModel(diet: Meal[] & { weightKg?: number }, modelName: string): string[] {

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
  
  if (meta.requiredPatterns) {
  meta.requiredPatterns.forEach(req => {
    const found = diet.some(meal =>
      meal.ingredients.some(ing => ing.product.toLowerCase().includes(req.toLowerCase())) ||
      meal.name.toLowerCase().includes(req.toLowerCase())
    );
    if (!found) {
      issues.push(`Brakuje wymaganego składnika/wzorca "${req}" w żadnym posiłku`);
    }
  });
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
  // 2. Sprawdź brak wymaganych składników
  if (meta.requiredPatterns) {
    meta.requiredPatterns.forEach(req => {
      const found = diet.some(meal =>
        meal.ingredients.some(ing => ing.product.toLowerCase().includes(req.toLowerCase())) ||
        meal.name.toLowerCase().includes(req.toLowerCase())
      );
      if (!found) {
        issues.push(`Brakuje wymaganego składnika/wzorca "${req}" w żadnym posiłku`);
      }
    });
  }

  // 3. Sprawdź wymagane minimum białka (jeśli znana masa ciała i są makroskładniki)
  if (meta.macros?.proteinPerKgMin && (diet as any).weightKg) {
    const totalProtein = diet.reduce((sum, meal) => sum + (meal.macros?.protein || 0), 0);
    const requiredProtein = (diet as any).weightKg * meta.macros.proteinPerKgMin;
    if (totalProtein < requiredProtein) {
      issues.push(`Za mało białka: ${totalProtein}g vs wymagane minimum ${requiredProtein.toFixed(1)}g`);
    }
  }

  // 4. Limit sodu (np. dieta DASH)
  if (meta.macros?.sodiumLimitMg) {
    const totalSodium = diet.reduce((sum, meal) => sum + (meal.macros?.sodium || 0), 0);
    if (totalSodium > meta.macros.sodiumLimitMg) {
      issues.push(`Przekroczony limit sodu: ${totalSodium}mg > ${meta.macros.sodiumLimitMg}mg`);
    }
  }

  // 5. Wymagany udział tłuszczu (np. dieta ketogeniczna)
  if (meta.requiresFat) {
    const totalFat = diet.reduce((sum, meal) => sum + (meal.macros?.fat || 0), 0);
    const totalCalories = diet.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    if (totalFat < 0.3 * totalCalories / 9) {
      issues.push(`Za mało tłuszczu: ${totalFat}g vs wymagane min. 30% energii z tłuszczu`);
    }
  }

  return issues;
}