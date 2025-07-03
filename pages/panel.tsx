// ✅ ZREFEKTORYZOWANY panel.tsx oparty na usePatientData (jak panel-patient) + WSPARCIE DLA DRAFT DIETY

import Head from 'next/head';
import { useState, useEffect } from 'react';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import PanelCard from '@/components/PanelCard';
import { tUI, type LangKey } from '@/utils/i18n';
import { usePatientData } from '@/hooks/usePatientData';
import { transformDietPlanToEditableFormat } from '@/utils/transformDietPlan';

import PatientPanelSection from '@/components/PatientPanelSection';
import MedicalForm from '@/components/MedicalForm';
import InterviewWizard from '@/components/InterviewWizard';
import CalculationBlock from '@/components/CalculationBlock';
import DietTable from '@/components/DietTable';
import DietGoalForm from '@/components/DietGoalForm';
import SelectModelForm from '@/components/SelectModelForm';
import SelectCuisineForm from '@/components/SelectCuisineForm';
import { extractMappedInterview } from '@/utils/interviewHelpers';
import { generateDietPdf } from '@/utils/generateDietPdf';

import type { Meal } from '@/types';

export default function Panel() {
  const [lang, setLang] = useState<LangKey>('pl');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [dietApproved, setDietApproved] = useState(false);

  const {
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
  } = usePatientData();

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [narrativeText, setNarrativeText] = useState('');

  const t = (key: keyof typeof tUI) => tUI(key, lang);

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang');
    if (storedLang) setLang(storedLang as LangKey);
    fetchPatientData();
  }, []);

  const handleGenerateDiet = async () => {
    setIsGenerating(true);
    setStreamingText('');
    setDietApproved(false);

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
        setDietApproved(true);
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

      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
        <h1 className="text-2xl font-bold text-gray-100">{tUI('doctorPanelTitle', lang)}</h1>
        <LangAndThemeToggle />
      </div>

      <div className="z-10 flex flex-col w-full max-w-[1400px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20">
        <PanelCard>
          <PatientPanelSection form={form} setForm={setForm} lang={lang} />
        </PanelCard>

        <PanelCard>
          <MedicalForm
            initialData={initialMedicalData || {}}
            existingMedical={medicalData}
            onChange={saveMedicalData}
            onUpdateMedical={(summary) => setMedicalData((prev: any) => ({ ...prev, summary }))}
            lang={lang}
          />
        </PanelCard>

        <PanelCard>
          <InterviewWizard
            form={form}
            lang={lang}
            initialData={initialInterviewData}
            onFinish={saveInterviewData}
            onUpdateNarrative={setNarrativeText}
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
            <button onClick={handleGenerateDiet} disabled={isGenerating} className="bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50">
              🧠 {isGenerating ? tUI('writingDiet', lang) : tUI('generateDiet', lang)}
            </button>
          </div>
          {isGenerating && streamingText && (
            <p className="mt-2 text-sm italic text-gray-200">{streamingText}</p>
          )}
        </PanelCard>

        {editableDiet && Object.keys(editableDiet).length > 0 && (
          <PanelCard>
            <DietTable
              editableDiet={editableDiet}
              setEditableDiet={setEditableDiet}
              setConfirmedDiet={() => {}}
              isEditable={!dietApproved}
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