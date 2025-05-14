export type Ingredient = {
  product: string;
  weight: number;
};

export interface Meal {
  name: string;
  description: string;
  ingredients: Ingredient[];
  calories: number;
  glycemicIndex: number;
  time?: string; // <== teraz jest opcjonalne
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

export type PatientData = {
  name: string;
  age: number;
  sex: 'female' | 'male';        // zgodnie z InterviewForm
  weight: number;
  height: number;
  allergies?: string;
  region?: string;
  goal?: string;
  cuisine?: string;
  model?: string;
  phone?: string;
  email?: string;
  conditions: string[];
  medical: ConditionWithTests[];
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
