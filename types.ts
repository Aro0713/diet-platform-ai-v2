export type Ingredient = {
  product: string;
  weight: number;
  unit?: string; // np. "g", "ml", "szt", "łyżka"
};

export interface Meal {
  name: string;
  time: string;
  date?: string; // 🆕 do PDF
  day?: string;  // ✅ DODAJ TO POLE
  menu: string;
  description?: string;
  ingredients: Ingredient[];
  calories: number;
  glycemicIndex: number;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
    fiber?: number;     // 🆕 do PDF
    potassium?: number; // 🆕 do PDF
  };
  imageUrl?: string; 
}


export type TestResult = {
  name: string;
  value: string;
};

export interface MedicalData {
  name: string;
  value: string;
  unit?: string;
  note?: string;
}

export type ConditionWithTests = {
  condition: string;
  tests: TestResult[];
};

export interface PatientData {
  assigned_doctor_email: any;
  user_id: string; 
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
  createdByName?: string; // 🆕 do PDF podpisu

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

  pal?: number | null;
  bmi?: number | null;
  cpm?: number | null;
}

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
