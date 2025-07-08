import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { PatientData } from '@/types';

export function usePatientFetchData() {
  const [form, setForm] = useState<PatientData>({} as PatientData);
  const [interviewData, setInterviewData] = useState<any>({});
  const [medicalData, setMedicalData] = useState<any>(null);
  const [initialMedicalData, setInitialMedicalData] = useState<any>(undefined);
  const [initialInterviewData, setInitialInterviewData] = useState<any>(undefined);
  const [editableDiet, setEditableDiet] = useState<any>({});

  const loadPatientData = async (userId: string) => {
    console.log("📥 [HOOK] Ręczne ładowanie pacjenta:", userId);

    const { data, error } = await supabase
      .from('patients')
      .select('*') // ✅ NIE używaj '*, interview_data...' – Supabase nie pozwala
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('❌ Błąd pobierania pacjenta:', error?.message);
      return;
    }

    if (!data.user_id || !data.name) {
      console.warn("⚠️ Dane niepełne — SELECT mógł zostać ograniczony przez RLS.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      user_id: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      age: data.age,
      sex: data.sex,
      height: data.height,
      weight: data.weight,
      region: data.region,
      medical: Array.isArray(data.medical) ? data.medical : [],
      conditionGroups: Array.isArray(data.conditionGroups) ? data.conditionGroups : [],
      conditions: Array.isArray(data.conditions) ? data.conditions : []
    }));

    setMedicalData({
      summary: data.health_status || '',
      json: data.medical_data || null
    });

    setInterviewData(data.interview_data || {});

    const freshInitial = buildInitialDataFromSupabase(data);
    setInitialMedicalData(JSON.parse(JSON.stringify(freshInitial)));
    setInitialInterviewData(JSON.parse(JSON.stringify(data.interview_data || {})));

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
        setEditableDiet({});
      }
    }
  };

  return {
    form,
    setForm,
    interviewData,
    setInterviewData,
    medicalData,
    setMedicalData,
    loadPatientData,
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
