import { fetchNutritionFromOpenFoodFacts } from './fetchFromOFF';

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

export type Ingredient = {
  product: string;
  weight: number;
};

// Pomocnicze zaokrąglanie
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function calculateMealMacros(ingredients: Ingredient[]): Promise<NutrientData> {
  const totals: NutrientData = {
    kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
    sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
    iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0,
    vitaminC: 0, vitaminA: 0, vitaminE: 0, vitaminK: 0
  };

  for (const { product, weight } of ingredients) {
    const data = await fetchNutritionFromOpenFoodFacts(product);
    const factor = weight / 100;

    if (data) {
      for (const key of Object.keys(totals) as (keyof NutrientData)[]) {
        totals[key] += (data[key] || 0) * factor;
      }
    }
  }

  const rounded: NutrientData = {} as NutrientData;
  for (const key of Object.keys(totals) as (keyof NutrientData)[]) {
    rounded[key] = round(totals[key]);
  }

  console.log("🧪 calculateMealMacros → wynik:", rounded);
  return rounded;
}
