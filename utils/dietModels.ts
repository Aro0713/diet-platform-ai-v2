export const modelRules: Record<string, string> = {
  'Dieta ketogeniczna': `
You are generating a strict clinical ketogenic diet.
- You MUST stay below 50g of carbohydrates per day.
- You MUST use high-fat ingredients in every meal (e.g. avocado, eggs, coconut oil).
- You ABSOLUTELY CANNOT include oats, bread, rice, potatoes, bananas, or sugar.
- Moderate protein only: use meat, fish, eggs.
- Meals MUST be keto-adapted individually — not just the daily sum.
`,

  'Dieta niskowęglowodanowa': `
This is a low-carbohydrate diet for blood sugar control or weight management.
- You MUST limit carbs to 80–120g/day.
- You MUST limit bread, sugar, pasta, rice, juice.
- You MUST emphasize vegetables, protein and fats.
- Avoid ultra-processed foods.
`,

  'Dieta wysokobiałkowa': `
This is a high-protein clinical diet.
- You MUST provide at least 1.6g protein per kg body weight.
- You MUST include a protein source in EVERY meal.
- You MUST limit simple carbohydrates and sugars.
- You CANNOT omit protein in any meal.
`,

  'Dieta wątrobowa': `
This is a liver-friendly diet for hepatic protection.
- You MUST use low-fat, low-sugar ingredients.
- You MUST AVOID alcohol, fried food, fructose and processed meat.
- Meals should be vegetable-based with complex carbs.
`,

  'Dieta nerkowa': `
This is a renal diet for chronic kidney disease.
- You MUST limit sodium, phosphorus and potassium.
- You ABSOLUTELY CANNOT include bananas, dairy, beans, nuts or processed foods.
- Protein MUST be limited to 0.6–0.8g/kg unless dialysis is active.
`,

  'Dieta FODMAP (przy IBS)': `
You are generating a low-FODMAP diet for IBS symptom control.
- You MUST exclude onion, garlic, apples, wheat, legumes.
- Use only tolerated foods: rice, potatoes, spinach, carrots, ripe banana.
- Use lactose-free or plant-based dairy ONLY.
`,

  'Dieta bezglutenowa': `
This is a strict gluten-free diet.
- You ABSOLUTELY CANNOT include any wheat, rye, barley or spelt.
- You MUST use gluten-free grains (e.g. rice, quinoa, buckwheat).
- Avoid all hidden gluten sources.
`,

  'Dieta DASH': `
You are generating a DASH diet for hypertension prevention.
- You MUST prioritize potassium, magnesium, calcium-rich foods.
- You MUST stay below 1500mg sodium/day.
- You MUST emphasize vegetables, fruits, whole grains, legumes.
- You CANNOT include processed meats, salty snacks or sugary drinks.
`,

  'Dieta śródziemnomorska': `
This is a Mediterranean clinical diet.
- You MUST use vegetables, legumes, whole grains and olive oil as the core.
- You SHOULD include fish and fermented dairy.
- You MUST limit red meat and sweets.
- You SHOULD include herbs like basil, thyme, oregano.
`,

  'Dieta wegańska': `
This is a strict vegan diet.
- You ABSOLUTELY CANNOT include any animal product: meat, dairy, eggs, honey.
- You MUST use legumes, tofu, soy, grains, nuts, seeds.
- You MUST ensure B12, iron and omega-3 presence.
`,

  'Dieta eliminacyjna': `
This is a short-term elimination diet for allergy identification.
- You MUST remove common allergens: dairy, eggs, gluten, soy, nuts, seafood.
- You MUST use simple hypoallergenic ingredients.
- You CANNOT include processed foods or sauces.
- Meals MUST be repetitive and minimal.
`,

  'Dieta lekkostrawna': `
You are generating an easy-to-digest diet for GI sensitivity.
- You MUST avoid raw vegetables, fried foods, legumes, cabbage, spicy seasoning.
- You MUST use boiled, baked or steamed ingredients.
- Meals MUST be soft-textured and low-residue.
`,

  'Dieta przeciwzapalna': `
This is an anti-inflammatory diet.
- You MUST exclude processed meat, sugar, refined oils, trans fats.
- You MUST include turmeric, ginger, leafy greens, berries, olive oil.
- You SHOULD include omega-3 fats from fish, flax, chia.
`
};