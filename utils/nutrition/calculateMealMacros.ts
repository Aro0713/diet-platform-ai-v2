import { fetchNutritionFromOpenFoodFacts } from './fetchFromOFF';
import { getTranslation } from '../translations/useTranslationAgent';

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

// Cache lokalny
const translationCache: Record<string, string> = {};
const nutritionCache: Record<string, NutrientData> = {};

export async function calculateMealMacros(ingredients: Ingredient[]): Promise<NutrientData> {
  const totals: NutrientData = {
    kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
    sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
    iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0,
    vitaminC: 0, vitaminA: 0, vitaminE: 0, vitaminK: 0
  };

  // 🔁 Tłumaczenia w batchu
  const translatedIngredients = await Promise.all(
    ingredients.map(async ({ product, weight }) => {
      try {
        const cached = translationCache[product];
        const translated = cached || await getTranslation(product, 'en');
        if (!cached) translationCache[product] = translated;
        console.log(`🌍 Translacja produktu "${product}" → "${translated}"`);
        return { product: translated, weight, original: product };
      } catch (err) {
        console.error(`❌ Błąd tłumaczenia "${product}":`, err);
        return { product: 'unknown', weight, original: product };
      }
    })
  );

          // 🔁 Pobranie danych odżywczych
          await Promise.all(
            translatedIngredients.map(async ({ product, weight, original }) => {
              try {
                if (!product || product === 'unknown') return;

                let data = nutritionCache[product];
        if (!data) {
          const fetched = await fetchNutritionFromOpenFoodFacts(product);
          if (!fetched) {
            console.warn(`⚠️ Brak danych dla składnika: ${product} (oryg.: ${original})`);
            return;
          }
          nutritionCache[product] = fetched;
          data = fetched;
        }

        const factor = weight / 100;
        for (const key of Object.keys(totals) as (keyof NutrientData)[]) {
          totals[key] += (data[key] || 0) * factor;
        }
      } catch (err) {
        console.error(`❌ Błąd przetwarzania składnika "${product}":`, err);
      }
    })
  );

  const rounded: NutrientData = {} as NutrientData;
  for (const key of Object.keys(totals) as (keyof NutrientData)[]) {
    rounded[key] = round(totals[key]);
  }

  console.log("🧪 calculateMealMacros → wynik:", rounded);
  return rounded;
}
