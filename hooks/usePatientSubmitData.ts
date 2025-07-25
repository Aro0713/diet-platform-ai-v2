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
      return false;
    }

    return true;
  };

  const saveInterviewData = async (data: any) => {
    const userId = form?.user_id;
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({ interview_data: data })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Błąd zapisu danych wywiadu:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ Wyjątek przy zapisie wywiadu:', err);
      return false;
    }
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
        onConflict: 'user_id'
      });

    if (error) {
      console.error('❌ Błąd zapisu planu diety:', error.message);
      return false;
    }

    return true;
  };

  const confirmDietPlan = async () => {
    const userId = form?.user_id;
    if (!userId) return false;

    const { error } = await supabase
      .from('patient_diets')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Błąd zatwierdzania diety:', error.message);
      return false;
    }

    return true;
  };

  return {
    saveMedicalData,
    saveInterviewData,
    saveDietPlan,
    confirmDietPlan
  };
}
