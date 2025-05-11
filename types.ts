export type Ingredient = {
  product: string;
  weight: number;
};

export type Meal = {
  name: string;
  ingredients: Ingredient[];
  calories: number;
  glycemicIndex: number;
  description?: string;     // 🆕 opis posiłku (np. wygenerowany przez AI)
  errors?: string[];        // opcjonalne błędy walidacyjne
};

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
