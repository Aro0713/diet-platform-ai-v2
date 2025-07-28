import { getTranslation } from "@/utils/translations/useTranslationAgent";
import { fetchNutritionFromOpenFoodFacts } from "./fetchFromOFF";
import { fetchNutritionFromUSDA } from "./fetchFromUSDA"; // nowy plik
import type { LangKey } from "@/utils/i18n";

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
    try {
      const translated = await getTranslation(product, "en" as LangKey);
      console.log(`🌍 Translacja produktu "${product}" → "${translated}"`);

      const data =
        (await fetchNutritionFromOpenFoodFacts(translated)) ??
        (await fetchNutritionFromUSDA(translated));

      const factor = weight / 100;

      if (data) {
        for (const key of Object.keys(totals) as (keyof NutrientData)[]) {
          totals[key] += (data[key] || 0) * factor;
        }
      } else {
        console.warn(`⚠️ Brak danych dla składnika: ${translated} (oryg.: ${product})`);
      }
    } catch (err) {
      console.error(`❌ Błąd przetwarzania składnika "${product}":`, err);
    }
  }

  const rounded: NutrientData = {} as NutrientData;
  for (const key of Object.keys(totals) as (keyof NutrientData)[]) {
    rounded[key] = round(totals[key]);
  }

  console.log("🧪 calculateMealMacros → wynik:", rounded);
  return rounded;
}
