import { nutrientRequirementsMap, type NutrientRequirements, type NutrientKey } from "@/utils/nutrientRequirementsMap";

// Wszystkie wymagane klucze składników odżywczych
const requiredKeys: NutrientKey[] = [
  "protein", "fat", "carbs", "fiber", "sodium", "potassium", "magnesium",
  "iron", "zinc", "calcium", "vitaminD", "vitaminB12", "vitaminC",
  "vitaminA", "vitaminE", "vitaminK"
];

let hasError = false;

for (const [name, nutrients] of Object.entries(nutrientRequirementsMap)) {
  const keys = Object.keys(nutrients);
  const missing = requiredKeys.filter(k => !(k in nutrients));
  const extra = keys.filter(k => !requiredKeys.includes(k as NutrientKey));
  const invalid = Object.entries(nutrients).filter(([_, range]) => range.min >= range.max);

  if (missing.length > 0) {
    console.error(`❌ ${name} – brakuje: ${missing.join(", ")}`);
    hasError = true;
  }

  if (extra.length > 0) {
    console.warn(`⚠️ ${name} – nadmiarowe klucze: ${extra.join(", ")}`);
    hasError = true;
  }

  for (const [key, range] of invalid) {
    console.error(`❌ ${name} – ${key} ma nieprawidłowy zakres: min=${range.min}, max=${range.max}`);
    hasError = true;
  }
}

if (!hasError) {
  console.log("✅ Wszystkie wpisy są kompletne i poprawne.");
  process.exit(0);
} else {
  process.exit(1);
}
