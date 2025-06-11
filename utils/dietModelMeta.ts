export interface DietModelMetadata {
  forbiddenIngredients?: string[];
  requiredPatterns?: string[];
  macros?: {
    carbsPerDayLimit?: number;
    proteinPerKgMin?: number;
    sodiumLimitMg?: number;
  };
  minMeals?: number;
  maxMeals?: number;
  requiresFat?: boolean;
  culturalEnforcement?: boolean;
}

export const dietModelMeta: Record<string, DietModelMetadata> = {
  'Dieta ketogeniczna': {
    forbiddenIngredients: ['cukier', 'miód', 'banan', 'płatki owsiane', 'ryż', 'makaron', 'pieczywo', 'ziemniaki'],
    macros: { carbsPerDayLimit: 50 },
    requiresFat: true,
    minMeals: 3,
    maxMeals: 5
  },
  'Dieta niskowęglowodanowa': {
    forbiddenIngredients: ['cukier', 'słodycze', 'sok owocowy', 'makaron biały'],
    macros: { carbsPerDayLimit: 120 },
    minMeals: 3,
    maxMeals: 5
  },
  'Dieta wysokobiałkowa': {
    macros: { proteinPerKgMin: 1.6 },
    minMeals: 3,
    maxMeals: 6
  },
  'Dieta wątrobowa': {
    forbiddenIngredients: ['alkohol', 'tłuszcze nasycone', 'fruktoza', 'mięso przetworzone'],
    minMeals: 4,
    maxMeals: 5
  },
  'Dieta nerkowa': {
    forbiddenIngredients: ['banan', 'nabiał', 'fasola', 'orzechy', 'produkty przetworzone'],
    macros: { proteinPerKgMin: 0.6 },
    minMeals: 4,
    maxMeals: 6
  },
  'Dieta FODMAP (przy IBS)': {
    forbiddenIngredients: ['czosnek', 'cebula', 'jabłko', 'fasola', 'pszenica'],
    minMeals: 5,
    maxMeals: 6
  },
  'Dieta bezglutenowa': {
    forbiddenIngredients: ['pszenica', 'żyto', 'jęczmień', 'orkisz'],
    minMeals: 3,
    maxMeals: 5
  },
  'Dieta DASH': {
    forbiddenIngredients: ['sól', 'mięso czerwone', 'produkty przetworzone'],
    macros: { sodiumLimitMg: 1500 },
    minMeals: 4,
    maxMeals: 6
  },
  'Dieta śródziemnomorska': {
    requiredPatterns: ['oliwa z oliwek', 'ryby', 'rośliny strączkowe'],
    culturalEnforcement: true,
    minMeals: 3,
    maxMeals: 5
  },
  'Dieta wegańska': {
    forbiddenIngredients: ['mięso', 'nabiał', 'jaja', 'miód'],
    minMeals: 3,
    maxMeals: 6
  },
  'Dieta eliminacyjna': {
    forbiddenIngredients: ['nabiał', 'jaja', 'gluten', 'soja', 'orzechy', 'owoce morza'],
    minMeals: 4,
    maxMeals: 5
  },
  'Dieta lekkostrawna': {
    forbiddenIngredients: ['surowe warzywa', 'strączki', 'kapusta', 'ostre przyprawy'],
    minMeals: 4,
    maxMeals: 5
  },
  'Dieta przeciwzapalna': {
    forbiddenIngredients: ['mięso przetworzone', 'cukier', 'tłuszcze trans'],
    requiredPatterns: ['imbir', 'kurkuma', 'zielone warzywa', 'olej lniany', 'ryby'],
    minMeals: 3,
    maxMeals: 6
  }
};
