import { useState, useEffect } from 'react';
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
}

export function usePatientData(): UsePatientDataResult {
  const [form, setForm] = useState<PatientData>({} as PatientData);
  const [interviewData, setInterviewData] = useState<any>({});
  const [medicalData, setMedicalData] = useState<any>(null);
  const [initialMedicalData, setInitialMedicalData] = useState<any>(undefined);
  const [initialInterviewData, setInitialInterviewData] = useState<any>(undefined);

  const fetchPatientData = async () => {
  const userId = localStorage.getItem('currentUserID');
  if (!userId) return;

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
    console.log("🔥 initialMedicalData z Supabase:", freshInitial);

    // Wymuszona zmiana referencji obiektu
    setInitialMedicalData(JSON.parse(JSON.stringify(freshInitial)));
    setInitialInterviewData(data.interview_data || {});
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

  // 🔒 ZABEZPIECZENIE przed nadpisywaniem pustymi danymi
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
    initialInterviewData
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
