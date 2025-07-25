// utils/nutrition/calculateMealMacros.ts

export type NutrientData = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  iron: number;
  zinc: number;
  vitaminD: number;
  vitaminB12: number;
  vitaminC: number;
  vitaminA: number;
  vitaminE: number;
  vitaminK: number;
};

type Ingredient = {
  product: string;
  weight: number;
};

// Przykładowa baza składników – rozwijana sukcesywnie
const ingredientNutrients: Record<string, NutrientData> = {
  "Jajka": {
    kcal: 143, protein: 13, fat: 10, carbs: 1.1, fiber: 0,
    sodium: 140, potassium: 126, calcium: 56, magnesium: 12,
    iron: 1.8, zinc: 1.3, vitaminD: 2, vitaminB12: 1.1,
    vitaminC: 0, vitaminA: 160, vitaminE: 1.0, vitaminK: 0.3
  },
  "Awokado": {
    kcal: 160, protein: 2, fat: 15, carbs: 9, fiber: 7,
    sodium: 7, potassium: 485, calcium: 12, magnesium: 29,
    iron: 0.6, zinc: 0.6, vitaminD: 0, vitaminB12: 0,
    vitaminC: 10, vitaminA: 146, vitaminE: 2.1, vitaminK: 21
  },
  "Kurczak": {
    kcal: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0,
    sodium: 74, potassium: 256, calcium: 15, magnesium: 25,
    iron: 1.2, zinc: 1, vitaminD: 0.1, vitaminB12: 0.3,
    vitaminC: 0, vitaminA: 40, vitaminE: 0.3, vitaminK: 0
  },
  "Jogurt naturalny": {
    kcal: 61, protein: 3.5, fat: 3.3, carbs: 4.7, fiber: 0,
    sodium: 46, potassium: 155, calcium: 121, magnesium: 12,
    iron: 0.1, zinc: 0.4, vitaminD: 0.05, vitaminB12: 0.4,
    vitaminC: 0.5, vitaminA: 27, vitaminE: 0.1, vitaminK: 0.3
  },
  "Masło klarowane": {
    kcal: 717, protein: 0.9, fat: 81, carbs: 0.1, fiber: 0,
    sodium: 11, potassium: 13, calcium: 2, magnesium: 1,
    iron: 0, zinc: 0, vitaminD: 2.5, vitaminB12: 0.2,
    vitaminC: 0, vitaminA: 684, vitaminE: 2.8, vitaminK: 8.6
  },
  "Brokuły": {
    kcal: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6,
    sodium: 33, potassium: 316, calcium: 47, magnesium: 21,
    iron: 0.7, zinc: 0.4, vitaminD: 0, vitaminB12: 0,
    vitaminC: 89, vitaminA: 623, vitaminE: 1.5, vitaminK: 101
  }
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
        sodium: total.sodium + (data?.sodium || 0) * factor,
        potassium: total.potassium + (data?.potassium || 0) * factor,
        calcium: total.calcium + (data?.calcium || 0) * factor,
        magnesium: total.magnesium + (data?.magnesium || 0) * factor,
        iron: total.iron + (data?.iron || 0) * factor,
        zinc: total.zinc + (data?.zinc || 0) * factor,
        vitaminD: total.vitaminD + (data?.vitaminD || 0) * factor,
        vitaminB12: total.vitaminB12 + (data?.vitaminB12 || 0) * factor,
        vitaminC: total.vitaminC + (data?.vitaminC || 0) * factor,
        vitaminA: total.vitaminA + (data?.vitaminA || 0) * factor,
        vitaminE: total.vitaminE + (data?.vitaminE || 0) * factor,
        vitaminK: total.vitaminK + (data?.vitaminK || 0) * factor
      };
    },
    {
      kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
      sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
      iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0,
      vitaminC: 0, vitaminA: 0, vitaminE: 0, vitaminK: 0
    }
  );
}
