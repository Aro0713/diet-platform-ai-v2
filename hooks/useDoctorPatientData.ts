import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { PatientData } from '@/types';

interface UseDoctorPatientDataResult {
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

export function useDoctorPatientData(): UseDoctorPatientDataResult {
  const [form, setForm] = useState<PatientData>({} as PatientData);
  const [interviewData, setInterviewData] = useState<any>({});
  const [medicalData, setMedicalData] = useState<any>(null);
  const [initialMedicalData, setInitialMedicalData] = useState<any>(undefined);
  const [initialInterviewData, setInitialInterviewData] = useState<any>(undefined);
  const [editableDiet, setEditableDiet] = useState<any>({});

  useEffect(() => {
    const userId = localStorage.getItem('currentUserID');
    if (userId && !form?.user_id) {
      setForm((prev) => ({ ...prev, user_id: userId }));
    }
  }, [form?.user_id]);

  const fetchPatientData = async () => {
    const userId = form?.user_id;
    if (!userId) {
      console.warn('❌ Brak user_id w form – nie można pobrać danych pacjenta');
      return;
    }

    const { data, error } = await supabase
      .from('patients')
      .select('*, interview_data, medical_data, health_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Błąd pobierania danych pacjenta:', error.message);
      return;
    }

    if (data) {
      const parsedMedical = Array.isArray(data.medical) ? data.medical : [];

      setForm((prev) => ({
        ...prev,
        conditionGroups: Array.isArray(data.conditionGroups) ? data.conditionGroups : [],
        conditions: Array.isArray(data.conditions) ? data.conditions : [],
        medical: parsedMedical
      }));

      setMedicalData({
        summary: data.health_status || '',
        json: data.medical_data || null
      });

      setInterviewData(data.interview_data || {});

      const freshInitial = buildInitialDataFromSupabase(data);
      setInitialMedicalData(JSON.parse(JSON.stringify(freshInitial)));

      const clonedInterview = JSON.parse(JSON.stringify(data.interview_data || {}));
      setInitialInterviewData(clonedInterview);

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
        } catch (err) {
          console.error('❌ Błąd parsowania diet_plan:', err);
        }
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
    const userId = form?.user_id;
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
