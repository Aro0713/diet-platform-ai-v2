export const modelRules: Record<string, string> = {
  'Dieta ketogeniczna': `
    This is a strict ketogenic diet.
    - Total daily carbohydrates must be below 50g
    - No grains, no oats, no bread, no pasta
    - Avoid high-carb fruits (only berries allowed)
    - Focus on fat sources: avocado, olive oil, coconut oil
    - Moderate protein: eggs, meat, fish
    - Meals must be high-fat, moderate-protein, ultra-low-carb
  `,

  'Dieta niskowęglowodanowa': `
    This is a low-carbohydrate diet.
    - Total daily carbs should be 80–120g
    - Limit sugar, sweets, fruit juice, bread, pasta
    - Focus on proteins, vegetables, and healthy fats
  `,

  'Dieta wysokobiałkowa': `
    This is a high-protein diet.
    - At least 1.6g of protein per kg of body weight per day
    - Every meal should include a protein source
    - Avoid excessive carbs and ultra-processed foods
  `,

  'Dieta wątrobowa': `
    This is a liver-friendly diet.
    - Low fat, low sugar
    - Avoid alcohol, fried food, processed meats
    - Emphasize vegetables, lean protein, complex carbs
    - Avoid saturated fats and fructose
  `,

  'Dieta nerkowa': `
    This is a renal diet.
    - Limit phosphorus, potassium, and sodium
    - Reduce dairy, bananas, beans, processed foods
    - Limit protein to 0.6–0.8g/kg/day (unless on dialysis)
  `,

  'Dieta FODMAP (przy IBS)': `
    This is a low-FODMAP diet for IBS.
    - Avoid fermentable sugars: onion, garlic, apples, wheat, legumes
    - Prefer rice, potatoes, carrots, spinach, bananas (ripe), strawberries
    - Use lactose-free dairy only
  `,

  'Dieta bezglutenowa': `
    This is a gluten-free diet.
    - Absolutely avoid wheat, rye, barley, spelt
    - Only use gluten-free grains like rice, quinoa, buckwheat
  `,

  'Dieta DASH': `
    This is a DASH diet (for hypertension).
    - High in potassium, magnesium, calcium
    - Low in sodium (<1500mg/day)
    - Emphasize fruits, vegetables, whole grains, lean meats
    - Avoid salt, red meat, and processed foods
  `,

  'Dieta śródziemnomorska': `
    This is a Mediterranean diet.
    - Base meals on vegetables, legumes, whole grains, and olive oil
    - Include fish and moderate dairy
    - Limit red meat and sweets
  `,

  'Dieta wegańska': `
    This is a vegan diet.
    - Exclude all animal products: meat, dairy, eggs, honey
    - Use legumes, tofu, grains, nuts and seeds as protein sources
    - Ensure B12, iron and omega-3 intake
  `,

  'Dieta eliminacyjna': `
    This is an elimination diet.
    - Remove common allergens: dairy, eggs, gluten, soy, nuts, seafood
    - Use simple, hypoallergenic foods (e.g. rice, zucchini, turkey)
    - Meals must be limited in variety
  `,

  'Dieta lekkostrawna': `
    This is an easy-to-digest (light) diet.
    - Avoid raw vegetables, fried and fatty foods
    - Prefer boiled, steamed, baked meals
    - No legumes, nuts, seeds, cabbage, or spicy seasoning
  `,

  'Dieta przeciwzapalna': `
    This is an anti-inflammatory diet.
    - Avoid processed meat, refined sugar, trans fats
    - Use turmeric, ginger, green vegetables, berries, olive oil
    - Include omega-3 fats (fish, flaxseed)
  `
};
