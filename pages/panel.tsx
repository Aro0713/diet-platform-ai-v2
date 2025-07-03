// ✅ PEŁNA ZREFEKTORYZOWANA WERSJA panel.tsx z zapisem, odczytem i generowaniem diety

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

  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');

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

    setInitialMedicalData({
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

    const { data: draftDiet } = await supabase
      .from('patient_diets')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    try {
      const raw = draftDiet?.dietPlan || draftDiet?.diet_plan;
      if (typeof raw === 'string') {
        setEditableDiet(JSON.parse(raw));
      } else if (typeof raw === 'object' && raw !== null) {
        setEditableDiet(raw);
      }
    } catch (err) {
      console.error('❌ Błąd parsowania diety draft:', err);
    }

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

  const handleGenerateDiet = async () => {
    setIsGenerating(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/generate-diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          interviewData,
          lang,
          goalExplanation: '',
          recommendation: interviewData.recommendation || '',
          medical: medicalData
        })
      });

      if (!res.body) throw new Error('Brak treści odpowiedzi.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let rawText = '', done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        rawText += chunk;
        setStreamingText(rawText);
      }

      const parsed = JSON.parse(rawText);
      if (parsed?.dietPlan) {
        const transformed = transformDietPlanToEditableFormat(parsed.dietPlan, lang);
        setEditableDiet(transformed);
        alert('✅ Dieta wygenerowana.');
      } else {
        alert('❌ Nie udało się wygenerować diety.');
      }
    } catch (err) {
      console.error('❌ Błąd generowania diety:', err);
      alert('❌ Błąd generowania diety.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] flex flex-col justify-start items-center pt-10 px-6 text-white transition-all duration-300">
      <Head><title>Panel lekarza</title></Head>

      <div className="flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">{tUI('doctorPanelTitle', lang)}</h1>
        <LangAndThemeToggle />
      </div>

      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <PanelCard>
          <PatientPanelSection form={form} setForm={setForm} lang={lang} />
          <div className="mt-4 flex flex-wrap gap-4">
            <button onClick={fetchPatientData} className="bg-blue-600 text-white px-4 py-2 rounded">
              📥 {tUI('fetchPatientData', lang)}
            </button>
            <button onClick={savePatientData} className="bg-green-600 text-white px-4 py-2 rounded">
              💾 {tUI('savePatientData', lang)}
            </button>
            <button
              onClick={handleGenerateDiet}
              disabled={isGenerating}
              className="bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              🧠 {isGenerating ? tUI('writingDiet', lang) : tUI('generateDiet', lang)}
            </button>
          </div>
          {isGenerating && streamingText && (
            <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-300">{streamingText}</p>
          )}
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