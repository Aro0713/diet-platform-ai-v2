// nutrientRequirementsMap.ts
// Zakresy minimalne i maksymalne dla mikro, makro i witamin
// Obowiązuje dla każdego modelu diety oraz każdej choroby

export type NutrientRequirement = {
  min: number;
  max: number;
};

export type NutrientKey =
  | 'protein'
  | 'fat'
  | 'carbs'
  | 'fiber'
  | 'sodium'
  | 'potassium'
  | 'magnesium'
  | 'iron'
  | 'zinc'
  | 'calcium'
  | 'vitaminD'
  | 'vitaminB12'
  | 'vitaminC'
  | 'vitaminA'
  | 'vitaminE'
  | 'vitaminK';

export type NutrientRequirements = Record<NutrientKey, NutrientRequirement>;

export const nutrientRequirementsMap: Record<string, NutrientRequirements> = {
  // 🟢 MODELE DIETETYCZNE
  "Dieta ketogeniczna": {
    protein: { min: 15, max: 25 },
    fat: { min: 70, max: 80 },
    carbs: { min: 5, max: 10 },
    fiber: { min: 15, max: 25 },
    sodium: { min: 1500, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Dieta wegetariańska": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 35 },
    carbs: { min: 45, max: 60 },
    fiber: { min: 25, max: 40 },
    sodium: { min: 0, max: 2300 },
    potassium: { min: 4000, max: 5000 },
    magnesium: { min: 320, max: 450 },
    iron: { min: 14, max: 22 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Dieta wysokobiałkowa": {
    protein: { min: 25, max: 35 },
    fat: { min: 25, max: 35 },
    carbs: { min: 30, max: 45 },
    fiber: { min: 20, max: 35 },
    sodium: { min: 1500, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 320, max: 450 },
    iron: { min: 8, max: 18 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Cukrzyca typu 2": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 35 },
    carbs: { min: 40, max: 50 },
    fiber: { min: 25, max: 50 },
    sodium: { min: 0, max: 2000 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 300, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Cukrzyca typu 1": {
    protein: { min: 15, max: 20 },
    fat: { min: 30, max: 40 },
    carbs: { min: 40, max: 50 },
    fiber: { min: 30, max: 50 },
    sodium: { min: 0, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 300, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },
  "Dieta śródziemnomorska": {
    protein: { min: 15, max: 20 },
    fat: { min: 30, max: 40 },
    carbs: { min: 40, max: 55 },
    fiber: { min: 25, max: 40 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Dieta wegańska": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 35 },
    carbs: { min: 45, max: 60 },
    fiber: { min: 30, max: 50 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 4000, max: 5000 },
    magnesium: { min: 320, max: 450 },
    iron: { min: 14, max: 32 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1200 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 5, max: 25 },
    vitaminC: { min: 90, max: 300 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 100, max: 150 }
  },
  "Cukrzyca": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 35 },
    carbs: { min: 40, max: 50 },
    fiber: { min: 30, max: 50 },
    sodium: { min: 0, max: 2000 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 320, max: 450 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 700, max: 1300 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Nadciśnienie": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 30 },
    carbs: { min: 45, max: 55 },
    fiber: { min: 30, max: 50 },
    sodium: { min: 0, max: 1500 },
    potassium: { min: 4700, max: 5000 },
    magnesium: { min: 350, max: 450 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1500 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Choroby nerek": {
    protein: { min: 10, max: 12 },
    fat: { min: 30, max: 35 },
    carbs: { min: 50, max: 60 },
    fiber: { min: 25, max: 35 },
    sodium: { min: 0, max: 1500 },
    potassium: { min: 0, max: 3000 },
    magnesium: { min: 250, max: 350 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 800, max: 1000 },
    vitaminD: { min: 10, max: 80 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 60, max: 100 },
    vitaminA: { min: 700, max: 1300 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Choroby wątroby": {
    protein: { min: 15, max: 20 },
    fat: { min: 20, max: 30 },
    carbs: { min: 50, max: 60 },
    fiber: { min: 25, max: 35 },
    sodium: { min: 1000, max: 2000 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 700, max: 1300 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },
"Dieta DASH": {
    protein: { min: 15, max: 20 },
    fat: { min: 20, max: 30 },
    carbs: { min: 50, max: 60 },
    fiber: { min: 30, max: 50 },
    sodium: { min: 0, max: 1500 },
    potassium: { min: 4700, max: 5000 },
    magnesium: { min: 350, max: 450 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1500 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },
  "Dieta FODMAP (przy IBS)": {
    protein: { min: 20, max: 25 },
    fat: { min: 30, max: 35 },
    carbs: { min: 40, max: 50 },
    fiber: { min: 20, max: 30 },
    sodium: { min: 0, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },
  "Dieta bezglutenowa": {
    protein: { min: 15, max: 20 },
    fat: { min: 30, max: 40 },
    carbs: { min: 40, max: 55 },
    fiber: { min: 25, max: 35 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 14, max: 32 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },
  "Dieta lekkostrawna": {
    protein: { min: 15, max: 20 },
    fat: { min: 20, max: 30 },
    carbs: { min: 50, max: 60 },
    fiber: { min: 15, max: 25 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 3000, max: 4500 },
    magnesium: { min: 300, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },
    "Dieta paleolityczna": {
    protein: { min: 20, max: 30 },
    fat: { min: 30, max: 40 },
    carbs: { min: 30, max: 40 },
    fiber: { min: 25, max: 35 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 4000, max: 4700 },
    magnesium: { min: 320, max: 450 },
    iron: { min: 12, max: 22 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 100, max: 300 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 100, max: 150 }
  },

  "Dieta niskowęglowodanowa": {
    protein: { min: 20, max: 30 },
    fat: { min: 40, max: 50 },
    carbs: { min: 20, max: 30 },
    fiber: { min: 20, max: 30 },
    sodium: { min: 1500, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1300 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Dieta niskosodowa": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 35 },
    carbs: { min: 45, max: 55 },
    fiber: { min: 30, max: 50 },
    sodium: { min: 0, max: 1200 },
    potassium: { min: 4700, max: 5000 },
    magnesium: { min: 350, max: 450 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1500 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 700, max: 1300 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },
  "Dieta niskotłuszczowa": {
    protein: { min: 15, max: 20 },
    fat: { min: 15, max: 25 },
    carbs: { min: 55, max: 65 },
    fiber: { min: 25, max: 40 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Dieta eliminacyjna": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 35 },
    carbs: { min: 45, max: 55 },
    fiber: { min: 25, max: 40 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 10, max: 20 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 5, max: 25 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Post przerywany": {
    protein: { min: 20, max: 30 },
    fat: { min: 30, max: 40 },
    carbs: { min: 30, max: 40 },
    fiber: { min: 25, max: 35 },
    sodium: { min: 1500, max: 2300 },
    potassium: { min: 4000, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Dieta MIND (dla mózgu)": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 35 },
    carbs: { min: 45, max: 55 },
    fiber: { min: 25, max: 40 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 4000, max: 5000 },
    magnesium: { min: 350, max: 450 },
    iron: { min: 10, max: 18 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 4, max: 25 },
    vitaminC: { min: 100, max: 300 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 20, max: 200 },
    vitaminK: { min: 100, max: 150 }
  },

  "Dieta przy insulinooporności i PCOS": {
    protein: { min: 20, max: 30 },
    fat: { min: 30, max: 40 },
    carbs: { min: 30, max: 40 },
    fiber: { min: 30, max: 50 },
    sodium: { min: 0, max: 2000 },
    potassium: { min: 4000, max: 4700 },
    magnesium: { min: 320, max: 450 },
    iron: { min: 10, max: 20 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },
  "PCOS": {
    protein: { min: 20, max: 25 },
    fat: { min: 30, max: 40 },
    carbs: { min: 30, max: 40 },
    fiber: { min: 30, max: 50 },
    sodium: { min: 0, max: 2000 },
    potassium: { min: 4000, max: 4700 },
    magnesium: { min: 320, max: 450 },
    iron: { min: 10, max: 20 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 25, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "IBS": {
    protein: { min: 20, max: 25 },
    fat: { min: 30, max: 35 },
    carbs: { min: 40, max: 50 },
    fiber: { min: 20, max: 30 },
    sodium: { min: 0, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 8, max: 18 },
    zinc: { min: 8, max: 11 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 15, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 75, max: 200 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Celiakia": {
    protein: { min: 15, max: 20 },
    fat: { min: 30, max: 40 },
    carbs: { min: 40, max: 55 },
    fiber: { min: 25, max: 35 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 3500, max: 4700 },
    magnesium: { min: 310, max: 420 },
    iron: { min: 14, max: 32 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 15, max: 100 },
    vitaminK: { min: 90, max: 120 }
  },

  "Menopauza": {
    protein: { min: 15, max: 20 },
    fat: { min: 25, max: 35 },
    carbs: { min: 45, max: 55 },
    fiber: { min: 25, max: 40 },
    sodium: { min: 0, max: 2000 },
    potassium: { min: 4000, max: 4700 },
    magnesium: { min: 350, max: 450 },
    iron: { min: 8, max: 18 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1200, max: 1500 },
    vitaminD: { min: 20, max: 100 },
    vitaminB12: { min: 2.4, max: 10 },
    vitaminC: { min: 90, max: 250 },
    vitaminA: { min: 700, max: 1500 },
    vitaminE: { min: 20, max: 200 },
    vitaminK: { min: 90, max: 120 }
  },

  "Niedoczynność tarczycy": {
    protein: { min: 20, max: 25 },
    fat: { min: 25, max: 35 },
    carbs: { min: 45, max: 55 },
    fiber: { min: 25, max: 35 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 4000, max: 4700 },
    magnesium: { min: 350, max: 450 },
    iron: { min: 10, max: 20 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 25, max: 100 },
    vitaminB12: { min: 4, max: 20 },
    vitaminC: { min: 100, max: 250 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 20, max: 200 },
    vitaminK: { min: 90, max: 120 }
  },

  "Hashimoto": {
    protein: { min: 20, max: 25 },
    fat: { min: 25, max: 35 },
    carbs: { min: 45, max: 55 },
    fiber: { min: 30, max: 40 },
    sodium: { min: 1000, max: 2300 },
    potassium: { min: 4000, max: 4700 },
    magnesium: { min: 350, max: 450 },
    iron: { min: 10, max: 20 },
    zinc: { min: 10, max: 14 },
    calcium: { min: 1000, max: 1300 },
    vitaminD: { min: 25, max: 100 },
    vitaminB12: { min: 4, max: 20 },
    vitaminC: { min: 100, max: 250 },
    vitaminA: { min: 800, max: 1500 },
    vitaminE: { min: 20, max: 200 },
    vitaminK: { min: 90, max: 120 }
  },
"Zespół krótkiego jelita": {
  protein: { min: 20, max: 30 },        // wysoka podaż białka (utrata przez jelito)
  fat: { min: 25, max: 35 },           // umiarkowana ilość tłuszczu, lepiej MCT
  carbs: { min: 40, max: 50 },         // reszta energii z węglowodanów
  fiber: { min: 10, max: 20 },         // ograniczone błonnik nierozpuszczalny
  sodium: { min: 3000, max: 5000 },    // zwiększona podaż sodu (utrata w stolcu)
  potassium: { min: 4000, max: 5500 }, // wyższe zapotrzebowanie
  magnesium: { min: 400, max: 600 },   // wyższe zapotrzebowanie
  iron: { min: 10, max: 20 },          // możliwe niedobory
  zinc: { min: 12, max: 20 },          // zwiększona utrata
  calcium: { min: 1200, max: 1500 },   // wsparcie kości i absorpcji
  vitaminD: { min: 25, max: 100 },     // suplementacja często konieczna
  vitaminB12: { min: 5, max: 20 },     // zwykle suplementacja iniekcyjna
  vitaminC: { min: 90, max: 200 },     // w normie
  vitaminA: { min: 900, max: 2000 },   // witaminy ADEK – kontrola poziomu
  vitaminE: { min: 20, max: 200 },
  vitaminK: { min: 120, max: 200 }
},
"Padaczka": {
  protein: { min: 15, max: 20 },
  fat: { min: 60, max: 75 }, // dieta ketogeniczna w leczeniu padaczki
  carbs: { min: 5, max: 10 },
  fiber: { min: 15, max: 25 },
  sodium: { min: 1500, max: 2300 },
  potassium: { min: 3500, max: 4700 },
  magnesium: { min: 320, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 20, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 75, max: 200 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Stwardnienie rozsiane (SM)": {
  protein: { min: 15, max: 20 },
  fat: { min: 25, max: 35 },
  carbs: { min: 45, max: 55 },
  fiber: { min: 25, max: 40 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 4000, max: 5000 },
  magnesium: { min: 350, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 10, max: 14 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 50, max: 100 }, // wysoka suplementacja
  vitaminB12: { min: 4, max: 20 },
  vitaminC: { min: 90, max: 250 },
  vitaminA: { min: 800, max: 1500 },
  vitaminE: { min: 20, max: 200 },
  vitaminK: { min: 90, max: 120 }
},

"Choroba Parkinsona": {
  protein: { min: 15, max: 20 }, // timing białka ważny
  fat: { min: 25, max: 35 },
  carbs: { min: 45, max: 55 },
  fiber: { min: 25, max: 40 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 4000, max: 4700 },
  magnesium: { min: 350, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 10, max: 14 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 20, max: 100 },
  vitaminB12: { min: 4, max: 20 },
  vitaminC: { min: 90, max: 250 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Mukowiscydoza": {
  protein: { min: 20, max: 25 },
  fat: { min: 35, max: 40 }, // dużo tłuszczu + ADEK
  carbs: { min: 35, max: 45 },
  fiber: { min: 20, max: 30 },
  sodium: { min: 3000, max: 5000 }, // zwiększona utrata
  potassium: { min: 4000, max: 5000 },
  magnesium: { min: 400, max: 600 },
  iron: { min: 10, max: 20 },
  zinc: { min: 12, max: 20 },
  calcium: { min: 1200, max: 1500 },
  vitaminD: { min: 25, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 100, max: 300 },
  vitaminA: { min: 900, max: 2000 },
  vitaminE: { min: 20, max: 200 },
  vitaminK: { min: 120, max: 200 }
},

"Przewlekła obturacyjna choroba płuc (POChP)": {
  protein: { min: 20, max: 25 },
  fat: { min: 30, max: 40 },
  carbs: { min: 35, max: 45 },
  fiber: { min: 20, max: 30 },
  sodium: { min: 1500, max: 2300 },
  potassium: { min: 4000, max: 5000 },
  magnesium: { min: 350, max: 450 },
  iron: { min: 10, max: 20 },
  zinc: { min: 10, max: 14 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 25, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 100, max: 300 },
  vitaminA: { min: 800, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Przewlekłe zapalenie trzustki": {
  protein: { min: 20, max: 25 },
  fat: { min: 20, max: 30 },
  carbs: { min: 45, max: 55 },
  fiber: { min: 20, max: 30 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 3500, max: 4700 },
  magnesium: { min: 320, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 20, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 90, max: 200 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Nietolerancja fruktozy": {
  protein: { min: 15, max: 20 },
  fat: { min: 25, max: 35 },
  carbs: { min: 45, max: 55 }, // tylko dozwolone źródła
  fiber: { min: 20, max: 30 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 3500, max: 4700 },
  magnesium: { min: 320, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 15, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 75, max: 90 }, // ograniczona ilość
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Choroba Leśniowskiego-Crohna": {
  protein: { min: 20, max: 25 },
  fat: { min: 25, max: 35 },
  carbs: { min: 40, max: 50 },
  fiber: { min: 10, max: 20 }, // w zaostrzeniach mniej
  sodium: { min: 1500, max: 2300 },
  potassium: { min: 4000, max: 5000 },
  magnesium: { min: 350, max: 450 },
  iron: { min: 10, max: 20 },
  zinc: { min: 10, max: 14 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 25, max: 100 },
  vitaminB12: { min: 4, max: 20 },
  vitaminC: { min: 90, max: 200 },
  vitaminA: { min: 800, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Wrzodziejące zapalenie jelita grubego (WZJG)": {
  protein: { min: 20, max: 25 },
  fat: { min: 25, max: 35 },
  carbs: { min: 40, max: 50 },
  fiber: { min: 10, max: 20 },
  sodium: { min: 1500, max: 2300 },
  potassium: { min: 4000, max: 5000 },
  magnesium: { min: 350, max: 450 },
  iron: { min: 10, max: 20 },
  zinc: { min: 10, max: 14 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 25, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 90, max: 200 },
  vitaminA: { min: 800, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Niewydolność serca": {
  protein: { min: 15, max: 20 },
  fat: { min: 25, max: 35 },
  carbs: { min: 45, max: 55 },
  fiber: { min: 25, max: 35 },
  sodium: { min: 0, max: 2000 },
  potassium: { min: 4000, max: 5000 },
  magnesium: { min: 350, max: 450 },
  iron: { min: 10, max: 20 },
  zinc: { min: 10, max: 14 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 20, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 90, max: 250 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Zaburzenia rytmu serca": {
  protein: { min: 15, max: 20 },
  fat: { min: 25, max: 35 },
  carbs: { min: 45, max: 55 },
  fiber: { min: 25, max: 35 },
  sodium: { min: 0, max: 2000 },
  potassium: { min: 4500, max: 5000 }, // wyższy potas
  magnesium: { min: 400, max: 500 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 20, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 90, max: 250 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Hipercholesterolemia": {
  protein: { min: 15, max: 20 },
  fat: { min: 20, max: 30 },
  carbs: { min: 50, max: 60 },
  fiber: { min: 30, max: 50 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 4000, max: 5000 },
  magnesium: { min: 320, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 20, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 90, max: 250 },
  vitaminA: { min: 700, max: 1300 },
  vitaminE: { min: 20, max: 200 },
  vitaminK: { min: 90, max: 120 }
},

"Hipoglikemia reaktywna": {
  protein: { min: 20, max: 25 },
  fat: { min: 25, max: 35 },
  carbs: { min: 40, max: 50 }, // niski IG
  fiber: { min: 25, max: 40 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 3500, max: 4700 },
  magnesium: { min: 320, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 15, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 75, max: 200 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Hipertriglicerydemia": {
  protein: { min: 20, max: 25 },
  fat: { min: 20, max: 30 },
  carbs: { min: 45, max: 55 },
  fiber: { min: 25, max: 40 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 3500, max: 4700 },
  magnesium: { min: 320, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 15, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 90, max: 250 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 20, max: 200 },
  vitaminK: { min: 90, max: 120 }
},

"Zespół Cushinga": {
  protein: { min: 20, max: 25 },
  fat: { min: 25, max: 35 },
  carbs: { min: 40, max: 50 },
  fiber: { min: 25, max: 40 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 3500, max: 4700 },
  magnesium: { min: 320, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1200, max: 1500 },
  vitaminD: { min: 20, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 90, max: 250 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},

"Fenyloketonuria (PKU)": {
  protein: { min: 8, max: 12 }, // tylko białko z mieszanek niskofenyloalaninowych
  fat: { min: 25, max: 35 },
  carbs: { min: 55, max: 65 },
  fiber: { min: 20, max: 35 },
  sodium: { min: 1000, max: 2300 },
  potassium: { min: 3500, max: 4700 },
  magnesium: { min: 320, max: 450 },
  iron: { min: 8, max: 18 },
  zinc: { min: 8, max: 11 },
  calcium: { min: 1000, max: 1300 },
  vitaminD: { min: 15, max: 100 },
  vitaminB12: { min: 2.4, max: 10 },
  vitaminC: { min: 75, max: 200 },
  vitaminA: { min: 700, max: 1500 },
  vitaminE: { min: 15, max: 100 },
  vitaminK: { min: 90, max: 120 }
},
};


