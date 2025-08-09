// utils/dietModels.ts

export type Range = [number, number];

type MicroKey =
  | "sodium"
  | "potassium"
  | "calcium"
  | "magnesium"
  | "iron"
  | "zinc"
  | "iodine"
  | "selenium"
  | "phosphorus" // nowy klucz
  | "vitaminD"
  | "vitaminB12"
  | "vitaminC"
  | "vitaminA"
  | "vitaminE"
  | "vitaminK";

export type DietRule = {
  macros?: {
    protein_g_per_kg?: Range;           // [min, max]
    fat_pct_kcal?: Range;               // [%kcal min, max]
    carbs_g_per_day?: Range;            // [min, max]
    per_meal?: {
      max_carbs_g?: number;             // g/meal
      max_gi?: number;                  // Glycemic Index cap per meal
    };
  };
  micros?: Partial<Record<MicroKey, { min?: number; max?: number }>>;
  sodium_mg_max_per_day?: number;
  added_sugars_g_max_per_day?: number;
  alcohol_allowed?: boolean;            // default true if undefined
  cooking_methods?: string[];           // e.g., ["boil","bake","steam"]
  exclusions?: string[];                // ingredients/foods to avoid
  inclusions?: string[];                // preferred/required foods
  notes?: string[];                     // free-form clinical notes
};

// -------- MODELS (quantified) --------

export const dietModelRules: Record<string, DietRule> = {
  "Ketogenic diet": {
    macros: {
      carbs_g_per_day: [0, 50],
      per_meal: { max_carbs_g: 15 },
      // protein/fat left flexible to allow personalization
    },
    exclusions: ["oats", "bread", "rice", "potatoes", "bananas", "sugar", "juices", "sweetened drinks"],
    inclusions: ["avocado", "eggs", "fatty fish", "olive oil", "coconut oil", "nuts", "seeds", "low-starch vegetables"],
    notes: [
      "Distribute carbs under 15 g per meal.",
      "Avoid high-GI fruit and starchy sides.",
      "Contraindications may apply (e.g., pregnancy, advanced CKD, some dyslipidemias)."
    ]
  },

  "Low-carbohydrate diet": {
    macros: {
      carbs_g_per_day: [80, 120],
      per_meal: { max_carbs_g: 40 }
    },
    exclusions: ["sugar", "juices", "white bread", "sweets", "white flour pasta"],
    inclusions: ["vegetables", "whole grains (in moderation)", "eggs", "fish", "lean meats", "unsaturated fats"],
    notes: ["Emphasize vegetables, proteins, healthy fats; avoid ultra-processed foods."]
  },

  "High-protein diet": {
    macros: {
      protein_g_per_kg: [1.6, 2.2]
    },
    exclusions: ["excess simple sugars", "sweetened drinks"],
    inclusions: ["eggs", "fish", "lean meats", "fermented dairy", "legumes", "tofu/tempeh"],
    notes: [
      "Protein source in every meal.",
      "Screen renal function before high-protein regimens."
    ]
  },

  "Liver-support diet": {
    macros: {
      // keep fat modest; carbs from complex sources
    },
    added_sugars_g_max_per_day: 25,
    alcohol_allowed: false,
    cooking_methods: ["boil", "bake", "steam", "stew"],
    exclusions: ["alcohol", "fried foods", "fatty offal", "processed meats", "excess fructose and syrups"],
    inclusions: ["vegetables", "whole grains (in moderation)", "lean proteins", "unsaturated fats"],
    notes: ["Favor vegetable-forward meals and complex carbohydrates; avoid heavy meals late at night."]
  },

  "Renal diet": {
    sodium_mg_max_per_day: 2000,
    micros: {
      potassium: { max: 2700 }, // tune per CKD stage in overlays
      phosphorus: { max: 800 }  // CKD: limit phosphorus intake
    },
    macros: { protein_g_per_kg: [0.6, 0.8] },
    exclusions: ["bananas", "nuts", "seeds", "aged cheeses", "processed meats", "cola drinks"],
    inclusions: ["low-K vegetables (controlled portions)", "rice", "white bread (controlled)"],
    notes: ["Adjust limits per CKD stage and dialysis status; individualize potassium and phosphorus."]
  },

  "Low FODMAP diet (for IBS)": {
    macros: {
      per_meal: { max_gi: 55 }
    },
    exclusions: ["onion", "garlic", "apples", "wheat", "legumes (elimination phase)"],
    inclusions: ["rice", "potatoes", "carrots", "spinach", "ripe banana (controlled portion)", "lactose-free/plant-based dairy alternatives"],
    notes: [
      "This represents the elimination phase.",
      "Plan reintroduction and personalization phases after symptom control."
    ]
  },

  "Gluten-free diet": {
    exclusions: ["wheat", "rye", "barley", "spelt", "hidden gluten", "barley malt"],
    inclusions: ["rice", "buckwheat", "quinoa", "millet", "corn", "certified GF products"],
    notes: ["Check cross-contamination; verify sauces, marinades, and processed foods."]
  },

  "DASH diet": {
    sodium_mg_max_per_day: 1500,
    micros: {
      potassium: { min: 3000 }, // tailor per patient
      magnesium: { min: 300 },
      calcium: { min: 1000 }
    },
    exclusions: ["processed meats", "salty snacks", "sweetened drinks"],
    inclusions: ["vegetables", "fruits", "whole grains", "legumes", "low-fat fermented dairy"],
    notes: ["Favor unsalted, minimally processed foods; limit added sugars."]
  },

  "Mediterranean diet": {
    inclusions: ["vegetables", "legumes", "whole grains", "olive oil", "fish", "nuts", "herbs (basil, thyme, oregano)"],
    exclusions: ["red meat (frequent)", "sweets (frequent)"],
    notes: [
      "Prefer olive oil as main fat source.",
      "Fish ≥ 2×/week; red meat ≤ 1×/week."
    ]
  },

  "Vegan diet": {
    exclusions: ["meat", "fish", "eggs", "dairy", "honey"],
    inclusions: ["legumes", "tofu", "tempeh", "grains", "nuts", "seeds", "leafy green vegetables"],
    micros: {
      vitaminB12: { min: 2.4 }, // µg/d from fortified foods/supplement
      iron: { min: 8 },         // adjust by sex/age
      vitaminD: { min: 800 },   // IU/d (depends on latitude/status)
      iodine: { min: 150 }
    },
    notes: ["Ensure B12, omega-3 (ALA/EPA/DHA), iron with vitamin C co-intake."]
  },

  "Elimination diet": {
    exclusions: ["dairy", "eggs", "gluten", "soy", "nuts", "seafood", "processed additives/sauces"],
    inclusions: ["hypoallergenic ingredients", "simple single-ingredient foods"],
    notes: [
      "Short-term (2–6 weeks) for identification; keep meals repetitive and minimal.",
      "Plan guided reintroduction afterward."
    ]
    },

  "Light (easily digestible) diet": {
  cooking_methods: ["boil", "steam", "bake"],
  exclusions: [
    "raw hard-to-digest vegetables",
    "fried foods",
    "legumes (depending on tolerance)",
    "cabbage",
    "spicy seasonings"
  ],
  inclusions: ["gruels", "purees", "delicate soups", "cooked vegetables", "lean protein"],
  notes: [
    "Focus on soft textures and low residue; split meals into smaller portions."
  ]
},

"Anti-inflammatory diet": {
  exclusions: [
    "processed meats",
    "added sugar",
    "excess refined omega-6 oils",
    "trans fats"
  ],
  inclusions: [
    "turmeric",
    "ginger",
    "leafy greens",
    "berries",
    "olive oil",
    "fatty fish",
    "flaxseed",
    "chia"
  ],
  notes: [
    "Favor omega-3 sources.",
    "Vegetables ≥ 400–600 g/day; limit refined carbs."
  ]
}
};

// -------- Legacy prompts (English), for backward compatibility --------

export const legacyModelPrompts: Record<string, string> = {
  "Dieta ketogeniczna": `
You are generating a strict clinical ketogenic diet.
- Stay below 50 g carbohydrates per day AND under ~15 g per meal.
- Use high-fat, unprocessed ingredients (avocado, eggs, oily fish, olive/coconut oil).
- Absolutely exclude grains, starchy sides, sugar, and juices.
- Moderate protein per meal.`,
  "Dieta niskowęglowodanowa": `
Low-carbohydrate diet (80–120 g/day), ≤40 g carbs per meal.
- Limit bread, sugar, pasta, rice, juices.
- Emphasize vegetables, protein, and healthy fats.
- Avoid ultra-processed foods.`,
  "Dieta wysokobiałkowa": `
High-protein diet: target 1.6–2.2 g protein/kg/day.
- Include a protein source in every meal.
- Limit simple sugars and sweetened beverages.
- Verify renal status before applying high-protein plans.`,
  "Dieta wątrobowa": `
Liver-friendly diet.
- No alcohol; avoid fried foods and high-fructose syrups.
- Prefer vegetable-forward meals, complex carbs; gentle cooking methods.`,
  "Dieta nerkowa": `
Renal-friendly diet (non-dialysis baseline).
- Sodium ≤ 2000 mg/day.
- Limit potassium and phosphorus; adjust per stage.
- Protein ~0.6–0.8 g/kg/day.
- Avoid processed meats, aged cheeses, nuts/seeds, cola drinks.`,
  "Dieta FODMAP (przy IBS)": `
Low-FODMAP elimination phase.
- Exclude onion, garlic, apples, wheat, legumes.
- Use rice, potatoes, spinach, carrots, ripe banana (controlled portions).
- Use lactose-free or plant-based dairy. Plan reintroduction.`,
  "Dieta bezglutenowa": `
Strict gluten-free diet.
- Exclude wheat, rye, barley, spelt and hidden gluten.
- Use certified GF grains. Watch for cross-contamination.`,
  "Dieta DASH": `
DASH diet for hypertension.
- Sodium < 1500 mg/day.
- Emphasize K/Mg/Ca-rich foods, vegetables, fruits, whole grains, legumes.
- Avoid processed meats, salty snacks, sugary drinks.`,
  "Dieta śródziemnomorska": `
Mediterranean diet.
- Vegetables, legumes, whole grains and olive oil as core.
- Fish ≥ 2×/week; limit red meat and sweets; use fresh herbs.`,
  "Dieta wegańska": `
Strict vegan diet.
- No animal products.
- Use legumes, tofu, grains, nuts, seeds.
- Ensure B12, iodine, iron and omega‑3 sources.`,
  "Dieta eliminacyjna": `
Short-term elimination diet (2–6 weeks).
- Remove common allergens (dairy, eggs, gluten, soy, nuts, seafood).
- Simple, repetitive meals. No processed sauces. Plan reintroduction.`,
  "Dieta lekkostrawna": `
Easy-to-digest diet.
- Avoid raw crucifers, fried foods, heavy spices; use boiling/steaming/baking.
- Small, soft-textured, low-residue meals.`,
  "Dieta przeciwzapalna": `
Anti-inflammatory diet.
- Exclude processed meats, added sugar, refined oils, trans fats.
- Include turmeric, ginger, leafy greens, berries, olive oil; prefer omega‑3 sources.`
};

// -------- Helper to generate English prompt from structured data --------

export function buildModelPrompt(modelName: string): string {
  const rule = dietModelRules[modelName];
  if (!rule) return legacyModelPrompts[modelName] || "";

  const lines: string[] = [];
  lines.push(`You are generating a clinical meal plan for: ${modelName}.`);

  // Macros
  if (rule.macros?.carbs_g_per_day) {
    const [min, max] = rule.macros.carbs_g_per_day;
    lines.push(`- Daily carbohydrates: ${min}–${max} g/day.`);
  }
  if (rule.macros?.protein_g_per_kg) {
    const [min, max] = rule.macros.protein_g_per_kg;
    lines.push(`- Protein: ${min}–${max} g/kg/day.`);
  }
  if (rule.macros?.fat_pct_kcal) {
    const [min, max] = rule.macros.fat_pct_kcal;
    lines.push(`- Fat: ${min}–${max}% of daily kcal.`);
  }
  if (rule.macros?.per_meal?.max_carbs_g !== undefined) {
    lines.push(`- Per-meal carbohydrate cap: ≤ ${rule.macros.per_meal.max_carbs_g} g.`);
  }
  if (rule.macros?.per_meal?.max_gi !== undefined) {
    lines.push(`- Per-meal GI cap: ≤ ${rule.macros.per_meal.max_gi}.`);
  }

  // Sodium & sugars
  if (rule.sodium_mg_max_per_day !== undefined) {
    lines.push(`- Sodium: ≤ ${rule.sodium_mg_max_per_day} mg/day.`);
  }
  if (rule.added_sugars_g_max_per_day !== undefined) {
    lines.push(`- Added sugars: ≤ ${rule.added_sugars_g_max_per_day} g/day.`);
  }

  // Micros (only list those present)
  if (rule.micros) {
    const microLines = Object.entries(rule.micros).map(([k, v]) => {
      const bounds = [
        v.min !== undefined ? `min ${v.min}` : null,
        v.max !== undefined ? `max ${v.max}` : null
      ].filter(Boolean).join(", ");
      return bounds ? `  • ${k}: ${bounds}` : `  • ${k}`;
    });
    if (microLines.length) {
      lines.push("- Micronutrient targets:\n" + microLines.join("\n"));
    }
  }

  // Inclusions / Exclusions
  if (rule.inclusions?.length) {
    lines.push(`- Prefer: ${rule.inclusions.join(", ")}.`);
  }
  if (rule.exclusions?.length) {
    lines.push(`- Absolutely avoid: ${rule.exclusions.join(", ")}.`);
  }

  // Cooking
  if (rule.cooking_methods?.length) {
    lines.push(`- Cooking methods: ${rule.cooking_methods.join(", ")}.`);
  }

  // Alcohol
  if (rule.alcohol_allowed === false) {
    lines.push("- Alcohol prohibited.");
  }

  // Notes
  if (rule.notes?.length) {
    lines.push(...rule.notes.map(n => `- ${n}`));
  }

  return lines.join("\n");
}
