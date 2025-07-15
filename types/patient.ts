// /types/patient.ts

export interface BasicData {
    firstName: string;
    lastName: string;
    age: number;
    height: number;
    weight: number;
  }
  
  export interface MedicalData {
    chronicDiseases: string;
    medications: string;
    supplements: string;
    bloodTests: string;
  }
  
  export interface InterviewData {
    expectations: string;
    previousDiets: string;
    currentDiet: string;
    goals: string;
    chronicDiseasesInterview: string;
    dietRelatedDiseases: string;
    gastrointestinalIssues: string;
    allergies: string;
    stressSleep: string;
    familyDiseases: string;
    physicalActivity: string;
    workType: string;
    sleepHours: string;
    dailyStress: string;
    smoking: string;
    alcohol: string;
    caffeineDrinks: string;
    mealsPerDay: string;
    mealTimes: string;
    snacking: string;
    breakfast: string;
    sweetsFastFood: string;
    waterIntake: string;
    dairyFrequency: string;
    meatFrequency: string;
    fishFrequency: string;
    fruitsVegetablesFrequency: string;
    grainsFrequency: string;
    fatsFrequency: string;
    processedFoodsFrequency: string;
    cookingHabits: string;
    favoriteFoods: string;
    dislikedFoods: string;
    excludedFoods: string;
    specialDiet: string;
    appetite: string;
    currentWeightHeight: string;
    weightHistory: string;
    weightFluctuations: string;
    pastDiets: string;
    bingeEating: string;
    bloating: string;
    constipation: string;
    diarrhea: string;
    reflux: string;
    stomachPainAfterMeals: string;
    bowelMovementFrequency: string;
    bowelDiseases: string;
    menstrualCycleRegularity: string;
    hormonalIssues: string;
    pregnancyOrBreastfeeding: string;
    hormonalContraception: string;
    motivationLevel: string;
    dietBarriers: string;
    timeForMealPreparation: string;
    budgetConstraints: string;
    mandatoryProducts: string;
    importantHealthConditions: string;
    dietDifficulties: string;
    currentMedications: string;
    currentSupplements: string;
  }
  export interface PatientData {
  name: string;
  email: string;
  phone?: string;
  sex?: string;
  age?: number;
  height?: number;
  weight?: number;
  region?: string;
 assigned_doctor_email?: string; // dokładnie tak, jak używasz

}

  export {};
