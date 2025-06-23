// Typ pojedynczego badania
export interface TestResult {
  name: string;
  value: string;
}

// Typ medycznej jednostki: choroba + przypisane badania
export interface ConditionWithTests {
  condition: string;
  tests: TestResult[];
}

// Główna struktura danych pacjenta
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

  // 🔽 Dodane przez MedicalForm
  conditionGroups?: string[];
  conditions: string[];
  testResults?: Record<string, string>;
  medical?: ConditionWithTests[];
}

export interface Meal {
  name: string;
  menu: string;
  time: string;
  calories: number;
  glycemicIndex: number;
  day?: string;
  ingredients: {
    product: string;
    weight: number;
  }[];
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
    fiber?: number;
    potassium?: number;
  };
}



