// usePatientSubmitData.ts
import { supabase } from '@/lib/supabaseClient';
import type { PatientData } from '@/types';

export function usePatientSubmitData(form: PatientData) {
  const saveMedicalData = async ({
    selectedGroups,
    selectedConditions,
    testResults,
    medicalSummary,
    structuredOutput
  }: {
    selectedGroups: string[];
    selectedConditions: string[];
    testResults: { [testName: string]: string };
    medicalSummary?: string;
    structuredOutput?: any;
  }) => {
    const userId = form?.user_id;
    if (!userId) return;

    const convertedMedical = selectedConditions.map((condition) => ({
      condition,
      tests: Object.entries(testResults)
        .filter(([key]) => key.startsWith(`${condition}__`))
        .map(([name, value]) => ({
          name: name.replace(`${condition}__`, ''),
          value
        }))
    }));

    const { error } = await supabase
      .from('patients')
      .update({
        medical: convertedMedical,
        medical_data: structuredOutput,
        health_status: medicalSummary,
        conditionGroups: selectedGroups,
        conditions: selectedConditions
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Błąd zapisu danych medycznych:', error.message);
    }
  };

  const saveInterviewData = async (data: any) => {
    const userId = form?.user_id;
    if (!userId) return;

    await supabase
      .from('patients')
      .update({ interview_data: data })
      .eq('user_id', userId);
  };

const saveDietPlan = async (dietPlan: any) => {
  const userId = form?.user_id;
  if (!userId) return;

  const { error } = await supabase
    .from('patient_diets')
    .upsert({
      user_id: userId,
      diet_plan: JSON.stringify(dietPlan),
      status: 'draft'
    }, {
      onConflict: 'user_id'  // ✅ string, nie tablica
    });

  if (error) {
    console.error('❌ Błąd zapisu planu diety:', error.message);
  }
};


  return {
    saveMedicalData,
    saveInterviewData,
    saveDietPlan
  };
}
