export type Ingredient = {
  product: string;
  weight?: number | null;
  unit?: string;
  quantity?: number;
};

export interface Meal {
  name: string;
  time: string;
  date?: string;
  day?: string;
  menu: string;
  description?: string;
  ingredients: Ingredient[];
  glycemicIndex: number;
  macros: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sodium: number;
    potassium: number;
    calcium: number;
    magnesium: number;
    iron: number;
    zinc: number;
    vitaminD: number;
    vitaminB12: number;
    vitaminC: number;
    vitaminA: number;
    vitaminE: number;
    vitaminK: number;
  };
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
    // 🤖 Robot kuchenny (public.patients)
  has_kitchen_robot?: boolean | null;
  kitchen_robot_model?: string | null;
  kitchen_robot_serial?: string | null;
  kitchen_robot_profile?: string | null;
  kitchen_robot_linked_at?: string | null;

  // (opcjonalnie) subskrypcja / faktura (używane w panelu)
  subscription_status?: string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  trial_ends_at?: string | null;
  plan?: string | null;
  invoice_url?: string | null;
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
