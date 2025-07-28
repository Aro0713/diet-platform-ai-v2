// utils/nutrition/fetchFromUSDA.ts

import type { NutrientData } from "./calculateMealMacros";

const API_KEY = process.env.USDA_API_KEY;
const SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const REPORT_URL = "https://api.nal.usda.gov/fdc/v1/food/";

const nutrientMap: Record<number, keyof NutrientData> = {
  1008: "kcal",
  1003: "protein",
  1004: "fat",
  1005: "carbs",
  1079: "fiber",
  1093: "sodium",
  1092: "potassium",
  1087: "calcium",
  1089: "magnesium",
  1101: "iron",
  1175: "zinc",
  1114: "vitaminD",
  1178: "vitaminB12",
  1162: "vitaminC",
  1106: "vitaminA",
  1185: "vitaminE",
  1186: "vitaminK"
};

export async function fetchNutritionFromUSDA(product: string): Promise<NutrientData | null> {
  if (!API_KEY) {
    console.error("❌ USDA_API_KEY is missing");
    return null;
  }

  try {
    const searchParams = new URLSearchParams({
      api_key: API_KEY,
      query: product,
      pageSize: "1"
    });

    const searchRes = await fetch(`${SEARCH_URL}?${searchParams}`);
    const searchJson = await searchRes.json();

    const fdcId = searchJson.foods?.[0]?.fdcId;
    if (!fdcId) {
      console.warn(`⚠️ Brak fdcId dla produktu: ${product}`);
      return null;
    }

    const reportRes = await fetch(`${REPORT_URL}${fdcId}?api_key=${API_KEY}`);
    const reportJson = await reportRes.json();

    const nutrients: NutrientData = {
      kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0,
      sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
      iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0,
      vitaminC: 0, vitaminA: 0, vitaminE: 0, vitaminK: 0
    };

    for (const item of reportJson.foodNutrients || []) {
      const key = nutrientMap[item.nutrient?.id];
      if (key && typeof item.amount === "number") {
        nutrients[key] += item.amount;
      }
    }

    console.log("🧪 USDA nutrients raw:", (reportJson.foodNutrients || []).map((n: any) => ({
  id: n.nutrient?.id,
  name: n.nutrient?.name,
  amount: n.amount
})));

    return nutrients;
  } catch (err) {
    console.error(`❌ Błąd USDA dla "${product}":`, err);
    return null;
  }
}
