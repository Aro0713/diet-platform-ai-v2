// pages/panel.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { supabase } from '@/lib/supabaseClient';
import { usePatientData } from '@/hooks/usePatientData';
import { tUI, type LangKey } from '@/utils/i18n';
import { tryParseJSON } from '@/utils/tryParseJSON';
import { transformDietPlanToEditableFormat } from '@/utils/transformDietPlan';
import { extractMappedInterview } from '@/utils/interviewHelpers';

import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import { PatientIconGrid } from '@/components/PatientIconGrid';
import PatientSelfForm from '@/components/PatientSelfForm';
import MedicalForm from '@/components/MedicalForm';
import InterviewWizard from '@/components/InterviewWizard';
import CalculationBlock from '@/components/CalculationBlock';
import DietGoalForm from '@/components/DietGoalForm';
import SelectModelForm from '@/components/SelectModelForm';
import SelectCuisineForm from '@/components/SelectCuisineForm';
import DietTable from '@/components/DietTable';
import type { Meal } from '@/types';

export default function DoctorPanelPage(): React.JSX.Element {
  const router = useRouter();

  const [lang, setLang] = useState<LangKey>('pl');
  const [patientOption, setPatientOption] = useState<'existing' | 'new'>('existing');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [editableDiet, setEditableDiet] = useState({});
  const [notes, setNotes] = useState({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [narrativeText, setNarrativeText] = useState('');
  const [dietApproved, setDietApproved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang');
    if (storedLang) setLang(storedLang as LangKey);
  }, []);

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
    initialInterviewData
  } = usePatientData();

  useEffect(() => {
    fetchPatientData();
  }, []);

  useEffect(() => {
    if (selectedSection === 'medical') {
      fetchPatientData();
    }
  }, [selectedSection]);

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

      const { generateDietPdf } = await import('@/utils/generateDietPdf');
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

  const saveDraftToSupabase = async () => {
    try {
      const userId = localStorage.getItem('currentUserID');
      if (!userId) {
        alert(tUI('noUserIdError', lang));
        return;
      }

      const { error } = await supabase
        .from('patient_diets')
        .insert({
          user_id: userId,
          diet_plan: editableDiet,
          status: 'draft'
        });

      if (error) {
        console.error(`${tUI('draftSaveErrorLog', lang)}:`, error.message);
        alert(tUI('dietSubmissionError', lang));
        return;
      }

      alert(tUI('dietSubmissionSuccess', lang));
    } catch (err) {
      console.error(`${tUI('draftSaveCatchErrorLog', lang)}:`, err);
      alert(tUI('dietSaveError', lang));
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
    <main className="relative min-h-screen bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] flex flex-col justify-start items-center pt-10 px-6 text-white transition-all duration-300">
      <Head>
        <title>Panel lekarza</title>
      </Head>

      {/* Pasek nagłówka */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
        <div className="flex flex-col">
          {form?.name && (
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {form.name}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {tUI('patientPanelTitle', lang)}
          </h1>
        </div>
        <LangAndThemeToggle />
      </div>

      {/* Ikony */}
      <PatientIconGrid lang={lang} onSelect={(id) => setSelectedSection(id)} />

      {/* Główna zawartość */}
      <div className="z-10 flex flex-col w-full max-w-[1000px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20 dark:text-white transition-colors animate-flip-in origin-center">

        {/* Dane pacjenta */}
        {selectedSection === 'data' && (
          <>
            <div className="flex gap-6 items-center mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <input
                  type="radio"
                  name="patientOption"
                  value="existing"
                  checked={patientOption === 'existing'}
                  onChange={() => setPatientOption('existing')}
                />
                {tUI('patientHasAccount', lang)}
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-white">
                <input
                  type="radio"
                  name="patientOption"
                  value="new"
                  checked={patientOption === 'new'}
                  onChange={() => setPatientOption('new')}
                />
                {tUI('createPatientAccount', lang)}
              </label>
            </div>
            <PatientSelfForm lang={lang} />
          </>
        )}

        {/* Dane medyczne */}
        {selectedSection === 'medical' && (
          <>
            <MedicalForm
              onChange={(data) => {
                saveMedicalData(data).then(() => setIsConfirmed(true));
              }}
              onUpdateMedical={(summary) => {
                setMedicalData((prev: any) => ({ ...prev, summary }));
              }}
              initialData={initialMedicalData}
              existingMedical={medicalData}
              lang={lang}
            />
            {isConfirmed && !interviewData?.goal && (
              <div className="mt-6 p-4 bg-emerald-100/80 dark:bg-emerald-900/40 text-base rounded-md text-gray-900 dark:text-white shadow max-w-2xl mx-auto">
                {tUI('medicalConfirmationMessage', lang)}
              </div>
            )}
          </>
        )}

        {/* Wywiad */}
        {selectedSection === 'interview' && (
          <>
            <InterviewWizard
              form={form}
              onFinish={saveInterviewData}
              lang={lang}
              initialData={initialInterviewData}
            />
            {interviewData?.goal && (
              <div className="mt-6 p-4 bg-sky-100/80 dark:bg-sky-900/40 text-base rounded-md text-gray-900 dark:text-white shadow max-w-2xl mx-auto">
                {tUI('interviewConfirmationMessage', lang)}
              </div>
            )}
          </>
        )}

        {/* Kalkulator */}
        {selectedSection === 'calculator' && (
          <CalculationBlock
            form={form}
            interview={extractMappedInterview(interviewData)}
            lang={lang}
            onResult={(result) => {
              setInterviewData((prev: any) => ({
                ...prev,
                ...result,
                model: result.suggestedModel
              }));
            }}
          />
        )}

        {/* Dieta */}
        {selectedSection === 'diet' && (
          <div className="space-y-6">
            {/* Formularze */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DietGoalForm
                lang={lang}
                onChange={(goal) => setInterviewData({ ...interviewData, goal })}
              />
              <SelectModelForm
                lang={lang}
                onChange={(model) => setInterviewData({ ...interviewData, model })}
              />
              <SelectCuisineForm
                lang={lang}
                onChange={(cuisine) => setInterviewData({ ...interviewData, cuisine })}
              />
            </div>

            {/* Przyciski */}
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
              <button
                className="w-full bg-purple-700 text-white px-4 py-3 rounded-md font-medium hover:bg-purple-800 disabled:opacity-50"
                disabled={!editableDiet || Object.keys(editableDiet).length === 0}
                onClick={async () => {
                  const confirm = window.confirm(tUI('confirmApproveDietAsPatient', lang));
                  if (confirm) {
                    await saveDietToSupabaseAndPdf();
                  }
                }}
              >
                ✅ {tUI('approveDietAsPatient', lang)}
              </button>
              <button
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-600 disabled:opacity-50"
                disabled={!editableDiet || Object.keys(editableDiet).length === 0}
                onClick={async () => {
                  const confirm = window.confirm(tUI('confirmSendDietToDoctor', lang));
                  if (!confirm) return;
                  await saveDraftToSupabase();
                }}
              >
                📤 {tUI('sendDietToDoctor', lang)}
              </button>
            </div>

            {/* Tabela diety */}
            {editableDiet && Object.keys(editableDiet).length > 0 && (
              <DietTable
                editableDiet={editableDiet}
                setEditableDiet={setEditableDiet}
                setConfirmedDiet={() => {}}
                isEditable={false}
                lang={lang}
                notes={notes}
                setNotes={setNotes}
              />
            )}
          </div>
        )}

        {/* Instrukcja domyślna */}
        {!selectedSection && (
          <p className="text-center text-gray-300 text-sm max-w-xl mx-auto">
            {tUI('iconInstructionFull', lang)}
          </p>
        )}
      </div>
    </main>
  );
}
