export type Ingredient = {
  product: string;
  weight: number;
  unit?: string; // np. "g", "ml", "szt", "łyżka"
};


export interface Meal {
  name: string;
  time: string;
  menu: string; // np. "Sałatka z tuńczykiem i jajkiem"
  description?: string; // opcjonalny komentarz
  ingredients: Ingredient[];
  calories: number;
  glycemicIndex: number;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
  };
}


export type TestResult = {
  name: string;
  value: string;
};

export interface MedicalData {
  name: string;       // np. "glukoza"
  value: string;      // np. "98"
  unit?: string;      // np. "mg/dl"
  note?: string;      // np. "po posiłku", "na czczo"
}

export type ConditionWithTests = {
  condition: string;
  tests: TestResult[];
};

export interface PatientData {
  name: string;
  age: number;
  sex: 'male' | 'female';
  weight: number;
  height: number;
  phone: string;
  email: string;
  region: string;
  allergies: string;
  goal: string;
  cuisine: string;
  model: string;
  password?: string;

  // Choroby i badania
  conditions: string[];
  conditionGroups?: string[];
  testResults?: Record<string, string>;
  medical?: {
    condition: string;
    tests: {
      name: string;
      value: string;
    }[];
  }[];

  // 🔽 Wskaźniki z kalkulatora
  pal?: number | null;
  bmi?: number | null;
  cpm?: number | null;
};

export interface InterviewData {
  section1: Record<string, string>;
  section2: Record<string, string>;
  section3: Record<string, string>;
  section4: Record<string, string>;
  section5: Record<string, string>;
  section6: Record<string, string>;
  section7: Record<string, string>;
  section8: Record<string, string>;
  section9?: Record<string, string>;
  mealsPerDay: number;
  mealPlan: { name: string; time: string }[];
}
