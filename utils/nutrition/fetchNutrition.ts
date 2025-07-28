import type { NutrientData } from "./calculateMealMacros";
import { getTranslation } from "../translations/useTranslationAgent";
import { fetchNutritionFromUSDA } from "./fetchFromUSDA";

export async function fetchNutrition(product: string): Promise<NutrientData | null> {
  try {
    const translated = await getTranslation(product, "en");
    console.log(`🌍 Translacja produktu "${product}" → "${translated}"`);

    const usdaData = await fetchNutritionFromUSDA(translated);
    if (usdaData) {
      console.log(`✅ Dane z USDA dla: ${translated}`);
      return usdaData;
    }

    console.warn(`⚠️ Brak danych z USDA dla: ${translated}`);
    return null;
  } catch (err) {
    console.error(`❌ Błąd pobierania danych odżywczych dla "${product}":`, err);
    return null;
  }
}
