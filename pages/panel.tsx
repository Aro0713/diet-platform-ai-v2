// ✅ PANEL LEKARZA — pełna logika z panel-patient.tsx + poprawki rerenderów + logi diagnostyczne

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import { tUI } from '@/utils/i18n';
import type { Meal } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { usePatientData } from '@/hooks/usePatientData';
import { transformDietPlanToEditableFormat } from '@/utils/transformDietPlan';

import PanelCard from '@/components/PanelCard';
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
import type { LangKey } from '@/utils/i18n';

export default function Panel(): React.JSX.Element {
  const [lang, setLang] = useState<LangKey>('pl');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [dietApproved, setDietApproved] = useState(false);
  const [narrativeText, setNarrativeText] = useState('');

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

  const [notes, setNotes] = useState({});

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang');
    if (storedLang) setLang(storedLang as LangKey);
    fetchPatientData();
  }, []);

  useEffect(() => {
    console.log('🧪 form', form);
    console.log('🧪 initialMedicalData', initialMedicalData);
    console.log('🧪 medicalData', medicalData);
    console.log('🧪 initialInterviewData', initialInterviewData);
    console.log('🧪 editableDiet', editableDiet);
  }, [form, initialMedicalData, medicalData, initialInterviewData, editableDiet]);

  const saveDietToSupabaseAndPdf = async () => {
    try {
      const bmi = form.weight && form.height
        ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
        : 0;

      const mealArray: Meal[] = (Object.values(editableDiet || {}) as Meal[][]).flat();

      if (!Array.isArray(mealArray) || mealArray.length === 0) {
        alert(tUI('noMealsToSave', lang));
        return;
      }

      const userId = localStorage.getItem('currentUserID');
      if (!userId) {
        alert(tUI('noUserId', lang));
        return;
      }

      const { error } = await supabase
        .from('patient_diets')
        .insert({
          user_id: userId,
          diet_plan: editableDiet,
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        });

      if (error) {
        console.error(`${tUI('supabaseSaveErrorPrefix', lang)} ${error.message}`);
        alert(tUI('dietSaveFailed', lang));
        return;
      }

      alert(tUI('dietSaveSuccess', lang));

      await generateDietPdf(
        form,
        bmi,
        mealArray,
        true,
        notes,
        lang,
        interviewData,
        {
          bmi: interviewData.bmi,
          ppm: interviewData.ppm,
          cpm: interviewData.cpm,
          pal: interviewData.pal,
          kcalMaintain: interviewData.kcalMaintain,
          kcalReduce: interviewData.kcalReduce,
          kcalGain: interviewData.kcalGain,
          nmcBroca: interviewData.nmcBroca,
          nmcLorentz: interviewData.nmcLorentz
        },
        'download',
        narrativeText
      );
    } catch (err) {
      console.error(`${tUI('dietApprovalErrorPrefix', lang)} ${err}`);
      alert(tUI('dietApprovalFailed', lang));
    }
  };

  const handleGenerateDiet = async () => {
    setIsGenerating(true);
    setStreamingText('');
    setDietApproved(false);

    if (!medicalData) {
      alert(tUI('medicalApprovalRequired', lang));
      setIsGenerating(false);
      return;
    }

    try {
      const goalMap: Record<string, string> = {
        lose: 'The goal is weight reduction.',
        gain: 'The goal is to gain muscle mass.',
        maintain: 'The goal is to maintain current weight.',
        detox: 'The goal is detoxification and cleansing.',
        regen: 'The goal is regeneration of the body and immune system.',
        liver: 'The goal is to support liver function and reduce toxin load.',
        kidney: 'The goal is to support kidney function and manage fluid/sodium balance.'
      };

      if (!interviewData.mealsPerDay) {
        interviewData.mealsPerDay = 4;
      }

      const recommendation = interviewData.recommendation?.trim();
      const goalExplanation = goalMap[interviewData.goal] || '';

      const res = await fetch('/api/generate-diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          interviewData,
          lang,
          goalExplanation,
          recommendation,
          medical: medicalData
        })
      });

      if (!res.body) throw new Error('Brak treści w odpowiedzi serwera.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let rawText = '';
      let rawCompleteText = '';
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        rawText += chunk;
        rawCompleteText += chunk;
        setStreamingText(rawText);
      }

      const json = JSON.parse(rawCompleteText);

      if (json.dietPlan && typeof json.dietPlan === 'object') {
        const transformed = transformDietPlanToEditableFormat(json.dietPlan, lang);
        setEditableDiet(transformed);
        setDietApproved(true);
        return;
      }

      alert(tUI('dietPlanMissing', lang));
    } catch (err) {
      console.error(`${tUI('dietGenerationErrorPrefix', lang)} ${err}`);
      alert(tUI('dietGenerationFailed', lang));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black text-black dark:text-white pt-10 px-6">
      <Head><title>Panel lekarza</title></Head>

      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
        <h1 className="text-2xl font-bold">{tUI('doctorPanelTitle', lang)}</h1>
        <LangAndThemeToggle />
      </div>

      <div className="z-10 flex flex-col w-full max-w-[1400px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20">
        <PanelCard>
          <PatientPanelSection form={form} setForm={setForm} lang={lang} />
        </PanelCard>

        <PanelCard>
          <MedicalForm
            key={JSON.stringify(initialMedicalData)}
            initialData={initialMedicalData || {}}
            existingMedical={medicalData}
            onChange={(data) => saveMedicalData(data).then(() => setIsConfirmed(true))}
            onUpdateMedical={(summary) => setMedicalData((prev: any) => ({ ...prev, summary }))}
            lang={lang}
          />
        </PanelCard>

        <PanelCard>
          <InterviewWizard
            key={JSON.stringify(initialInterviewData)}
            form={form}
            initialData={initialInterviewData}
            lang={lang}
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
          <div className="space-y-4">
            {isGenerating && (
              <div className="text-sm text-gray-600 italic animate-pulse">
                ⏳ {tUI('writingDiet', lang)}{' '}
                {streamingText.length > 20 && `(${tUI('generatingWait', lang)})`}
              </div>
            )}

            <button
              className="w-full bg-emerald-600 text-white px-4 py-3 rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50"
              disabled={isGenerating}
              onClick={handleGenerateDiet}
            >
              🧠 {tUI('generateDiet', lang)}
            </button>

            <button
              className="w-full bg-green-700 text-white px-4 py-3 rounded-md font-medium hover:bg-green-800 disabled:opacity-50"
              disabled={isGenerating || !editableDiet || Object.keys(editableDiet).length === 0}
              onClick={saveDietToSupabaseAndPdf}
            >
              📄 {tUI('generatePdf', lang)}
            </button>
          </div>
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
