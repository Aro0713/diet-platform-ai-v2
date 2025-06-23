// utils/nutrition/calculateMealMacros.ts

export type NutrientData = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  potassium: number;
};

type Ingredient = {
  product: string;
  weight: number;
};

// Przykładowa baza składników - do zastąpienia danymi z bazy (Open Food Facts / IŻŻ)
const ingredientNutrients: Record<string, NutrientData> = {
  "Jajka": { kcal: 143, protein: 13, fat: 10, carbs: 1.1, fiber: 0, potassium: 126 },
  "Awokado": { kcal: 160, protein: 2, fat: 15, carbs: 9, fiber: 7, potassium: 485 },
  "Kurczak": { kcal: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, potassium: 256 },
  "Jogurt naturalny": { kcal: 61, protein: 3.5, fat: 3.3, carbs: 4.7, fiber: 0, potassium: 155 },
  "Masło klarowane": { kcal: 717, protein: 0.9, fat: 81, carbs: 0.1, fiber: 0, potassium: 13 },
  "Brokuły": { kcal: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6, potassium: 316 },
  // Dodawaj więcej według potrzeb...
};

const getNutrientDataForProduct = (product: string): NutrientData | null => {
  return ingredientNutrients[product] || null;
};

export function calculateMealMacros(ingredients: Ingredient[]): NutrientData {
  return ingredients.reduce<NutrientData>(
    (total, { product, weight }) => {
      const data = getNutrientDataForProduct(product);
      const factor = weight / 100;

      return {
        kcal: total.kcal + (data?.kcal || 0) * factor,
        protein: total.protein + (data?.protein || 0) * factor,
        fat: total.fat + (data?.fat || 0) * factor,
        carbs: total.carbs + (data?.carbs || 0) * factor,
        fiber: total.fiber + (data?.fiber || 0) * factor,
        potassium: total.potassium + (data?.potassium || 0) * factor,
      };
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, potassium: 0 }
  );
}
