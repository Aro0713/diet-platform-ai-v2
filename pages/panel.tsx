// ✅ PEŁNA ZREFEKTORYZOWANA WERSJA panel.tsx z zapisem i odczytem danych pacjenta

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import PanelCard from '@/components/PanelCard';
import { supabase } from '@/lib/supabaseClient';
import { tUI, type LangKey } from '@/utils/i18n';
import { translatedTitles } from '@/utils/translatedTitles';
import { translationsUI } from '@/utils/translationsUI';

import PatientPanelSection from '@/components/PatientPanelSection';
import MedicalForm from '@/components/MedicalForm';
import InterviewWizard from '@/components/InterviewWizard';
import CalculationBlock from '@/components/CalculationBlock';
import DietGoalForm from '@/components/DietGoalForm';
import SelectCuisineForm from '@/components/SelectCuisineForm';
import SelectModelForm from '@/components/SelectModelForm';
import DietTable from '@/components/DietTable';
import { extractMappedInterview } from '@/utils/interviewHelpers';
import { generateDietPdf } from '@/utils/generateDietPdf';
import { transformDietPlanToEditableFormat } from '@/utils/transformDietPlan';

import type { PatientData, Meal } from '@/types';

export default function Panel() {
  const [lang, setLang] = useState<LangKey>('pl');
  const [form, setForm] = useState<PatientData>({
    name: '', age: 0, sex: 'female', weight: 0, height: 0,
    region: '', phone: '', email: '', goal: '', model: '', cuisine: '',
    allergies: '', conditions: [], medical: []
  });
  const [medicalData, setMedicalData] = useState<any>(null);
  const [interviewData, setInterviewData] = useState<any>({});
  const [initialMedicalData, setInitialMedicalData] = useState<any>(null);
  const [editableDiet, setEditableDiet] = useState<Record<string, Meal[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [userData, setUserData] = useState<any>(null);

  const t = (key: keyof typeof translationsUI) => tUI(key, lang);

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang');
    if (storedLang) setLang(storedLang as LangKey);
  }, []);

  const fetchPatientData = async () => {
    const userId = localStorage.getItem('currentUserID');
    if (!userId) return;

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !patient) {
      alert('❌ Nie znaleziono danych pacjenta.');
      return;
    }

    setForm({
      ...form,
      ...patient,
      conditions: Array.isArray(patient.conditions) ? patient.conditions : [],
      medical: patient.medical || []
    });

    setMedicalData({
      json: patient.medical_data || {},
      summary: patient.health_status || '',
      selectedConditions: patient.conditions || [],
      selectedGroups: patient.conditionGroups || [],
      testResults: patient.testResults || {}
    });

    setInterviewData({
      ...patient.interview_data,
      summary: patient.interview_summary || ''
    });

    setInitialMedicalData({
      ...medicalData,
      ...patient
    });

    alert('📥 Dane pacjenta zostały pobrane.');
  };

  const savePatientData = async () => {
    const userId = localStorage.getItem('currentUserID');
    if (!userId) {
      alert(t('noUserId'));
      return;
    }

    const { data: existing } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      ...form,
      interview_data: interviewData,
      interview_summary: interviewData.summary || '',
      medical_data: medicalData?.json || null,
      health_status: medicalData?.summary || '',
      medical: form.medical || [],
      conditionGroups: form.conditionGroups || [],
      conditions: form.conditions || [],
      testResults: form.testResults || {}
    };

    let result;
    if (existing) {
      result = await supabase.from('patients').update(payload).eq('user_id', userId);
    } else {
      result = await supabase.from('patients').insert(payload);
    }

    if (result.error) {
      console.error('❌ Błąd zapisu:', result.error);
      alert('❌ Nie udało się zapisać danych.');
    } else {
      alert('✅ Dane zapisane.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-black dark:text-white">
      <Head><title>Panel lekarza</title></Head>

      <div className="flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">{tUI('doctorPanelTitle', lang)}</h1>
        <LangAndThemeToggle />
      </div>

      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <PanelCard>
          <PatientPanelSection form={form} setForm={setForm} lang={lang} />
        </PanelCard>

        <PanelCard>
          <MedicalForm
            key={JSON.stringify(medicalData)}
            initialData={initialMedicalData || {}}
            existingMedical={medicalData}
            onChange={setMedicalData}
            onUpdateMedical={(summary) =>
              setMedicalData((prev: any) => ({ ...prev, summary }))}
            lang={lang}
          />
        </PanelCard>

        <PanelCard>
          <InterviewWizard
            form={form}
            initialData={interviewData}
            lang={lang}
            onFinish={setInterviewData}
            onUpdateNarrative={(text) =>
              setInterviewData((prev: any) => ({ ...prev, summary: text }))}
          />
        </PanelCard>

        <PanelCard>
          <CalculationBlock
            form={form}
            interview={extractMappedInterview(interviewData)}
            lang={lang}
            onResult={(res) => setInterviewData((prev: any) => ({ ...prev, ...res }))}
          />
        </PanelCard>

        <PanelCard>
          <div className="flex flex-wrap gap-4">
            <button onClick={fetchPatientData} className="bg-blue-600 text-white px-4 py-2 rounded">
              📥 {tUI('fetchPatientData', lang)}
            </button>
            <button onClick={savePatientData} className="bg-green-600 text-white px-4 py-2 rounded">
              💾 {tUI('savePatientData', lang)}
            </button>
          </div>
        </PanelCard>

        {editableDiet && Object.keys(editableDiet).length > 0 && (
          <PanelCard>
            <DietTable
              editableDiet={editableDiet}
              setEditableDiet={setEditableDiet}
              setConfirmedDiet={() => {}}
              isEditable={true}
              lang={lang}
              notes={notes}
              setNotes={setNotes}
            />
          </PanelCard>
        )}
      </div>
    </main>
  );
}