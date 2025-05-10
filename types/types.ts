export interface MedicalData {
  selectedGroups: string[];
  selectedConditions: string[];
  testResults: { [key: string]: string };
}

export interface Meal {
  name: string;
  ingredients: {
    product: string;
    weight: number;
  }[];
  calories: number;
  glycemicIndex: number;
}

export interface PatientData {
  age: string;
  sex: string;
  weight: string;
  height: string;
  allergies: string;
  region: string;
  medical: MedicalData; // ✅ poprawka tutaj
  conditions: string[];
}

  
