import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { PatientData } from '@/types';

interface UsePatientDataResult {
  form: PatientData;
  setForm: React.Dispatch<React.SetStateAction<PatientData>>;
  interviewData: any;
  setInterviewData: (data: any) => void;
  medicalData: any;
  setMedicalData: (data: any) => void;
  fetchPatientData: () => Promise<void>;
  saveMedicalData: (data: any) => Promise<void>;
  saveInterviewData: (data: any) => Promise<void>;
  initialMedicalData: any;
  initialInterviewData: any;
  editableDiet: any;
  setEditableDiet: (diet: any) => void;
}

export function usePatientData(): UsePatientDataResult {
  const [form, setForm] = useState<PatientData>({} as PatientData);
  const [interviewData, setInterviewData] = useState<any>({});
  const [medicalData, setMedicalData] = useState<any>(null);
  const [initialMedicalData, setInitialMedicalData] = useState<any>(undefined);
  const [initialInterviewData, setInitialInterviewData] = useState<any>(undefined);
  const [editableDiet, setEditableDiet] = useState<any>({});

  const fetchPatientData = async () => {
    console.log("🚀 fetchPatientData start");

    const userId = localStorage.getItem('currentUserID');
    if (!userId) {
      console.warn("❌ Brak userId – nie można pobrać danych pacjenta");
      return;
    }

    const { data, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (patientError) {
      console.error('❌ Błąd z Supabase:', patientError.message);
      return;
    }

    if (!data) {
      console.warn('⚠️ Supabase zwrócił null — brak wpisu w patients?');
      return;
    }

    console.log('✅ Supabase dane:', JSON.stringify(data, null, 2));

    setForm({
      user_id: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      sex: data.sex,
      age: data.age,
      height: data.height,
      weight: data.weight,
      region: data.region,
      medical: Array.isArray(data.medical) ? data.medical : [],
      conditionGroups: Array.isArray(data.conditionGroups) ? data.conditionGroups : [],
      conditions: Array.isArray(data.conditions) ? data.conditions : [],
      allergies: data.allergies || '',
      goal: data.goal || '',
      cuisine: data.cuisine || '',
      model: data.model || '',
      assigned_doctor_email: data.assigned_doctor_email || '',
            // 🤖 robot kitchen (patients.*)
      has_kitchen_robot: Boolean(data.has_kitchen_robot),
      kitchen_robot_model: data.kitchen_robot_model || '',
      kitchen_robot_serial: data.kitchen_robot_serial || '',
      kitchen_robot_profile: data.kitchen_robot_profile || '',
      kitchen_robot_linked_at: data.kitchen_robot_linked_at || null,

      // 💳 subscription (używane w panelu)
      subscription_status: data.subscription_status || null,
      subscription_started_at: data.subscription_started_at || null,
      subscription_expires_at: data.subscription_expires_at || null,
      trial_ends_at: data.trial_ends_at || null,
      plan: data.plan || null,
      invoice_url: data.invoice_url || null,
    });

    setMedicalData({
      summary: data.health_status || '',
      json: data.medical_data || null
    });

    setInterviewData(data.interview_data || {});

    const freshInitial = buildInitialDataFromSupabase(data);
    setInitialMedicalData(JSON.parse(JSON.stringify(freshInitial)));
    setInitialInterviewData(JSON.parse(JSON.stringify(data.interview_data || {})));

    // 🔍 Dieta potwierdzona
    const { data: confirmed } = await supabase
      .from('patient_diets')
      .select('diet_plan')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (confirmed?.diet_plan) {
      try {
        const parsed = typeof confirmed.diet_plan === 'string'
          ? JSON.parse(confirmed.diet_plan)
          : confirmed.diet_plan;
        setEditableDiet(parsed);
        console.log('✅ Ustawiono dietę: confirmed');
        return;
      } catch (err) {
        console.error('❌ Błąd parsowania confirmed diet_plan:', err);
      }
    }

    // 🔄 Jeśli brak confirmed – sprawdź draft
    const { data: draft } = await supabase
      .from('patient_diets')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draft?.diet_plan) {
      try {
        const parsed = typeof draft.diet_plan === 'string'
          ? JSON.parse(draft.diet_plan)
          : draft.diet_plan;
        setEditableDiet(parsed);
        console.log('ℹ️ Ustawiono dietę: draft');
      } catch (err) {
        console.error('❌ Błąd parsowania draft diet_plan:', err);
      }
    }
  };

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
    const userId = localStorage.getItem('currentUserID');
    if (!userId) return;

    const isEmpty =
      (!selectedGroups || selectedGroups.length === 0) &&
      (!selectedConditions || selectedConditions.length === 0) &&
      (!testResults || Object.keys(testResults).length === 0) &&
      !structuredOutput &&
      !medicalSummary;

    if (isEmpty) {
      console.warn('⚠️ Pominięto zapis pustych danych medycznych');
      return;
    }

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
    } else {
      console.log('✅ Dane medyczne zapisane');
    }

    setForm((prev) => ({
      ...prev,
      conditionGroups: selectedGroups,
      conditions: selectedConditions,
      testResults,
      medical: convertedMedical
    }));

    setMedicalData({
      summary: medicalSummary ?? '',
      json: structuredOutput ?? null
    });
  };

  const saveInterviewData = async (data: any) => {
    const userId = localStorage.getItem('currentUserID');
    if (!userId) return;

    const isSame = JSON.stringify(data) === JSON.stringify(interviewData);
    if (isSame) return;

    await supabase
      .from('patients')
      .update({ interview_data: data })
      .eq('user_id', userId);

    setInterviewData(data);

    setForm((prev) => ({
      ...prev,
      stressLevel: data.stressLevel,
      sleepQuality: data.sleepQuality,
      physicalActivity: data.physicalActivity,
      mealsPerDay: data.mealsPerDay
    }));
  };

  return {
    form,
    setForm,
    interviewData,
    setInterviewData,
    medicalData,
    setMedicalData,
    fetchPatientData,
    saveMedicalData,
    saveInterviewData,
    initialMedicalData,
    initialInterviewData,
    editableDiet,
    setEditableDiet
  };
}

function buildInitialDataFromSupabase(data: any) {
  return {
    selectedGroups: Array.isArray(data.conditionGroups) ? data.conditionGroups : [],
    selectedConditions: Array.isArray(data.conditions) ? data.conditions : [],
    testResults: Object.fromEntries(
      Array.isArray(data.medical)
        ? data.medical.flatMap((c: any) => {
            if (!c || typeof c !== 'object' || !Array.isArray(c.tests)) return [];
            return c.tests
              .filter((t: any) => t && typeof t.name === 'string')
              .map((t: { name: string; value: any }) => [
                `${c.condition ?? 'Nieznane'}__${t.name}`,
                t.value
              ]);
          })
        : []
    )
  };
}
