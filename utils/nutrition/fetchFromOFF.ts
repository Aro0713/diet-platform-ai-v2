import type { NutrientData } from './calculateMealMacros';
import { translatorAgent } from '@/agents/translationAgent';

export async function fetchNutritionFromOpenFoodFacts(productName: string): Promise<NutrientData | null> {
  const translations = await translatorAgent.run({ text: productName });
  const translated = translations.en || productName;

  console.log(`🌍 Przetłumaczono "${productName}" → "${translated}"`);
  const query = encodeURIComponent(translated);
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=1`;

  try {
    const searchRes = await fetch(url);
    const searchData = await searchRes.json();
    const product = searchData.products?.[0];

    if (!product || !product.nutriments) return null;
    const n = product.nutriments;

    const data: NutrientData = {
      kcal: n['energy-kcal_100g'] ?? 0,
      protein: n['proteins_100g'] ?? 0,
      fat: n['fat_100g'] ?? 0,
      carbs: n['carbohydrates_100g'] ?? 0,
      fiber: n['fiber_100g'] ?? 0,
      sodium: n['sodium_100g'] ? n['sodium_100g'] * 1000 : 0,
      potassium: n['potassium_100g'] ?? 0,
      calcium: n['calcium_100g'] ?? 0,
      magnesium: n['magnesium_100g'] ?? 0,
      iron: n['iron_100g'] ?? 0,
      zinc: n['zinc_100g'] ?? 0,
      vitaminD: n['vitamin-d_100g'] ?? 0,
      vitaminB12: n['vitamin-b12_100g'] ?? 0,
      vitaminC: n['vitamin-c_100g'] ?? 0,
      vitaminA: n['vitamin-a_100g'] ?? 0,
      vitaminE: n['vitamin-e_100g'] ?? 0,
      vitaminK: n['vitamin-k_100g'] ?? 0
    };

    return data;
  } catch (err) {
    console.warn("⚠️ Błąd pobierania z OpenFoodFacts:", err);
    return null;
  }
}


