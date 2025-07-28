// utils/nutrition/calculateMealMacros.ts

import { getTranslation } from "../translations/useTranslationAgent";
import { fetchNutrition } from './fetchNutrition';

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

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function calculateMealMacros(ingredients: Ingredient[]): Promise<NutrientData> {
  const empty: NutrientData = {
    kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
    sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
    iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0,
    vitaminC: 0, vitaminA: 0, vitaminE: 0, vitaminK: 0
  };

  const results = await Promise.all(
    ingredients.map(async ({ product, weight }) => {
      try {
        const translated = await getTranslation(product, "en");
        console.log(`🌍 Translacja produktu "${product}" → "${translated}"`);

        const data = await fetchNutrition(translated);
        if (!data) {
          console.warn(`⚠️ Brak danych dla składnika: ${translated}`);
          return empty;
        }

        const factor = weight / 100;
        const partial: NutrientData = {} as NutrientData;

        for (const key of Object.keys(empty) as (keyof NutrientData)[]) {
          partial[key] = (data[key] || 0) * factor;
        }

        return partial;
      } catch (err) {
        console.error(`❌ Błąd składnika "${product}":`, err);
        return empty;
      }
    })
  );

  const totals: NutrientData = { ...empty };
  for (const partial of results) {
    for (const key of Object.keys(empty) as (keyof NutrientData)[]) {
      totals[key] += partial[key];
    }
  }

  const rounded: NutrientData = {} as NutrientData;
  for (const key of Object.keys(empty) as (keyof NutrientData)[]) {
    rounded[key] = Math.round(totals[key] * 100) / 100;
  }

  console.log("🧪 calculateMealMacros → wynik:", rounded);
  return rounded;
}
