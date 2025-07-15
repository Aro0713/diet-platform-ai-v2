import React from 'react';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import { tUI } from '@/utils/i18n';
import type { Meal } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { usePatientData } from '@/hooks/usePatientData';
import { transformDietPlanToEditableFormat } from '@/utils/transformDietPlan';
import { PatientIconGrid } from '@/components/PatientIconGrid';
import PatientSelfForm from '@/components/PatientSelfForm';
import MedicalForm from '@/components/MedicalForm';
import InterviewWizard from '@/components/InterviewWizard';
import CalculationBlock from '@/components/CalculationBlock';
import DietTable from '@/components/DietTable';
import { extractMappedInterview } from '@/utils/interviewHelpers';
import type { LangKey } from '@/utils/i18n';
import DietGoalForm from '@/components/DietGoalForm';
import SelectModelForm from '@/components/SelectModelForm';
import SelectCuisineForm from '@/components/SelectCuisineForm';
import { generateDietPdf } from '@/utils/generateDietPdf';
import NeonNextArrow from "@/components/NeonNextArrow";
import ProductAssistantPanel from '@/components/ProductAssistantPanel';
import BasketTable from '@/components/BasketTable';
import SelectMealsPerDayForm from '@/components/SelectMealsPerDay';
import ProgressOverlay from '@/components/ProgressOverlay';
import { useRef } from 'react';


export default function PatientPanelPage(): React.JSX.Element {
  const router = useRouter();
  const [lang, setLang] = useState<LangKey>('pl');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [notes, setNotes] = useState({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [narrativeText, setNarrativeText] = useState('');
  const [dietApproved, setDietApproved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipes, setRecipes] = useState<any>(null);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [doctorList, setDoctorList] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ HOOK na samym początku
  const {
    form,
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

  // ✅ dopiero potem useEffect
  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang');
    if (storedLang) setLang(storedLang as LangKey);

    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id;
      if (!userId) {
        console.warn("❌ Brak user.id – użytkownik nie jest zalogowany?");
        return;
      }

      localStorage.setItem('currentUserID', userId);
      console.log("✅ userId zapisany:", userId);

      supabase
        .from('patient_diets')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .order('confirmed_at', { ascending: false })
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Błąd przy pobieraniu diety:', error.message);
            return;
          }
          if (data && data[0]) {
            setEditableDiet((prev: Record<string, Meal[]> | undefined) => {
              if (prev && Object.keys(prev).length > 0) {
                console.log("🔁 Dieta już ustawiona — pomijam.");
                return prev;
              }
              console.log("✅ Załadowano dietę:", data[0]);
              return data[0].diet_plan;
            });
            setDietApproved(true);
          } else {
            console.warn('⚠️ Brak potwierdzonej diety');
          }
        });
    });
  }, []);

const startFakeProgress = (from = 5, to = 95, step = 1, delay = 300) => {
  setProgress(from);
  progressIntervalRef.current = setInterval(() => {
    setProgress((prev) => {
      if (prev >= to) return prev;
      return prev + step;
    });
  }, delay);
};

const stopFakeProgress = () => {
  if (progressIntervalRef.current) {
    clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = null;
  }
};

// 🔁 Pobranie danych przy powrocie do sekcji 'medical' + załaduj zatwierdzoną dietę, jeśli nie ma jeszcze żadnej
useEffect(() => {
  const userId = localStorage.getItem('currentUserID');
  if (!userId) return;

  // Jeśli wracamy do sekcji medycznej – odśwież dane
  if (selectedSection === 'medical') {
    fetchPatientData();
  }

  // Pobierz dietę tylko jeśli nie została już ustawiona
  supabase
    .from('patient_diets')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .order('confirmed_at', { ascending: false })
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Błąd przy pobieraniu diety:', error.message);
      } else if (data && data[0]) {
        setEditableDiet((prev: Record<string, Meal[]> | undefined) => {
        if (prev && Object.keys(prev).length > 0) {
          console.log("🔁 Dieta już była ustawiona — pomijam nadpisywanie.");
          return prev;
        } else {
          console.log('✅ Załadowano zatwierdzoną dietę z Supabase:', data[0]);
          return data[0].diet_plan;
        }
      });
        setDietApproved(true);
      } else {
        console.warn('⚠️ Brak potwierdzonej diety');
      }
    });
}, [selectedSection]);

const saveDietToSupabaseAndPdf = async () => {
  try {
    setProgressMessage(tUI('savingDiet', lang));
    startFakeProgress(5, 95);

    const bmi = form.weight && form.height
      ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
      : 0;

    const mealArray: Meal[] = (Object.values(editableDiet || {}) as Meal[][]).flat();
    if (!mealArray.length) {
      alert(tUI('noMealsToSave', lang));
      stopFakeProgress();
      setProgress(0);
      setProgressMessage('');
      return;
    }

    const userId = localStorage.getItem('currentUserID');
    if (!userId) {
      alert(tUI('noUserId', lang));
      stopFakeProgress();
      setProgress(0);
      setProgressMessage('');
      return;
    }

    const { error } = await supabase
      .from('patient_diets')
      .upsert({
        user_id: userId,
        diet_plan: editableDiet,
        status: 'draft',
        patient_name: form?.name || '',
        selected_doctor_id: selectedDoctor
      }, { onConflict: 'user_id' });

    if (error) throw new Error(error.message);

    setProgressMessage(tUI('generatingPdf', lang));

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
      narrativeText,
      recipes
    );

    stopFakeProgress();
    setProgress(100);
    setProgressMessage(tUI('pdfReady', lang));
    setTimeout(() => {
      setProgress(0);
      setProgressMessage('');
    }, 1000);

    alert(tUI('dietSaveSuccess', lang));
  } catch (err) {
    console.error(`${tUI('dietApprovalErrorPrefix', lang)}:`, err);
    alert(tUI('dietApprovalFailed', lang));
    stopFakeProgress();
    setProgress(0);
    setProgressMessage('');
  }
};

const saveDietToSupabaseOnly = async () => {
  if (!editableDiet || Object.keys(editableDiet).length === 0) return;

  const userId = localStorage.getItem('currentUserID');
  if (!userId) {
    alert(tUI('notLoggedIn', lang));
    return;
  }

  try {
    setProgressMessage(tUI('savingDiet', lang));
    startFakeProgress(10, 95);

    const { error } = await supabase
      .from('patient_diets')
      .upsert({
        user_id: userId,
        diet_plan: editableDiet,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        patient_name: form?.name || ''
      }, { onConflict: 'user_id' });

    if (error) throw new Error(error.message);

    stopFakeProgress();
    setProgress(100);
    setProgressMessage(tUI('dietReady', lang));
    setTimeout(() => {
      setProgress(0);
      setProgressMessage('');
    }, 1000);

    alert(tUI('dietApproved', lang));
  } catch (err) {
    console.error("❌ Błąd zapisu diety (try/catch):", err);
    alert(tUI("errorSavingDiet", lang));
    stopFakeProgress();
    setProgress(0);
    setProgressMessage('');
  }
};

const handleGenerateDiet = async () => {
  setProgress(5);
  setProgressMessage(tUI('startingDietGeneration', lang));
  setStreamingText('');
  setDietApproved(false);

  if (!medicalData) {
    alert(tUI('medicalApprovalRequired', lang));
    setProgress(0);
    setProgressMessage('');
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

    const recommendation = interviewData.recommendation?.trim();
    const goalExplanation = goalMap[interviewData.goal] || '';

    setProgressMessage(tUI('sendingDataToAI', lang));
    startFakeProgress(20, 95);

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

    setProgress(70);
    setProgressMessage(tUI('validatingDiet', lang));

    // ✅ Spróbuj sparsować wynik
    let json;
    try {
      json = JSON.parse(rawCompleteText);
    } catch (e) {
      console.error('❌ Błąd parsowania JSON z diety:', rawCompleteText);
      alert(tUI('dietGenerationFailed', lang));
      stopFakeProgress();
      setProgress(0);
      setProgressMessage('');
      return;
    }

    if (json.dietPlan && typeof json.dietPlan === 'object') {
      const transformed = transformDietPlanToEditableFormat(json.dietPlan, lang);
      setEditableDiet(transformed);
      setDietApproved(true);

      stopFakeProgress();
      setProgress(100);
      setProgressMessage(tUI('dietReady', lang));
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1000);
      return;
    }

    throw new Error('Brak poprawnego obiektu dietPlan');
  } catch (err) {
    console.error(`${tUI('dietGenerationErrorPrefix', lang)} ${err}`);
    alert(tUI('dietGenerationFailed', lang));
    stopFakeProgress();
    setProgress(0);
    setProgressMessage('');
  }
};

async function saveDraftToSupabaseWithDoctor(email: string): Promise<void> {
  try {
    const userId = localStorage.getItem('currentUserID');

    if (!userId) {
      alert(tUI('noUserIdError', lang));
      return;
    }

    const { error } = await supabase
      .from('patient_diets')
      .upsert({
        user_id: userId,
        diet_plan: editableDiet,
        status: 'draft',
        patient_name: form?.name || '',
        selected_doctor_id: email
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(`${tUI('draftSaveErrorLog', lang)}:`, error.message);
      alert(tUI('dietSubmissionError', lang));
    } else {
      alert(tUI('dietSubmissionSuccess', lang));
    }
  } catch (err) {
    console.error(`${tUI('draftSaveCatchErrorLog', lang)}:`, err);
    alert(tUI('dietSaveError', lang));
  }
}

const handleGenerateRecipes = async () => {
  try {
    setProgress(10);
    setProgressMessage(tUI('generatingRecipes', lang));

    const res = await fetch('/api/generate-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietPlan: editableDiet })
    });

    setProgress(60);
    setProgressMessage(tUI('processingRecipes', lang));

    const json = await res.json();
    setRecipes(json.recipes);

    setProgress(100);
    setProgressMessage(tUI('recipesReady', lang));
    setTimeout(() => {
      setProgress(0);
      setProgressMessage('');
    }, 1000);
  } catch (err) {
    console.error('❌ Błąd generowania przepisów:', err);
    alert(tUI('errorGeneratingRecipes', lang));
    setProgress(0);
    setProgressMessage('');
  }
};

const handleGenerateNarrative = async () => {
  try {
    setProgress(20);
    setProgressMessage(tUI('generatingNarrative', lang));

    const response = await fetch('/api/interview-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewData,
        goal: interviewData.goal,
        recommendation: interviewData.recommendation,
        lang
      })
    });

    const { narrativeText } = await response.json();
    if (narrativeText) setNarrativeText(narrativeText);

    setProgress(100);
    setProgressMessage(tUI('narrativeReady', lang));
    setTimeout(() => {
      setProgress(0);
      setProgressMessage('');
    }, 1000);
  } catch (err) {
    console.error('❌ Błąd przy pobieraniu opisu AI:', err);
    setNarrativeText('⚠️ Błąd generowania opisu wywiadu przez AI');
    setProgress(0);
    setProgressMessage('');
  }
};

console.log("📦 form w panel-patient:", form);

const handleSectionChange = async (newSection: string) => {
  // zapisz dane z aktualnej sekcji
  if (selectedSection === 'medical' && medicalData) {
    await saveMedicalData(medicalData);
    console.log('💾 Autozapis: dane medyczne zapisane');
  }

  if (selectedSection === 'interview' && interviewData) {
    await saveInterviewData(interviewData);
    console.log('💾 Autozapis: dane z wywiadu zapisane');
  }

  // zmień sekcję i przewiń
  setSelectedSection(newSection);
  setTimeout(() => {
    document.getElementById(`section-${newSection}`)?.scrollIntoView({ behavior: 'smooth' });
  }, 50);
};

const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

const handleShowDoctors = async () => {
  if (!showDoctorDropdown) {
    setShowDoctorDropdown(true);
    if (doctorList.length === 0) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .in('role', ['doctor', 'dietitian']);

      if (error) {
        console.error('❌ Błąd pobierania listy lekarzy:', error.message);
      } else {
        setDoctorList((data || []).sort((a, b) => a.name.localeCompare(b.name)));
      }
    }
  }
};

  return (
    
    <main className="relative min-h-screen bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] flex flex-col justify-start items-center pt-10 px-6 text-white transition-all duration-300">
      <Head>
        <title>{tUI('doctorPanelTitle', lang)}</title>

      </Head>

      {/* Pasek nagłówka */}
     <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
        <div className="flex flex-col">
          {form?.name && (
            <span className="text-sm font-medium text-white dark:text-white">
              {form.name}
            </span>
          )}
          <h1 className="text-2xl font-bold text-white dark:text-white">
            {tUI('patientPanelTitle', lang)}
          </h1>
        </div>
        <LangAndThemeToggle />
      </div>

      {/* Ikony */}
      <PatientIconGrid lang={lang} selected={selectedSection} onSelect={handleSectionChange} />
    
            {/* Główna zawartość */}
      <div className="z-10 flex flex-col w-full max-w-[1000px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20 dark:text-white transition-colors animate-flip-in origin-center">
        {selectedSection === 'data' && (
          <>
            <PatientSelfForm
              lang={lang}
              value={form}
            />
            <div className="flex justify-end mt-6">
          <NeonNextArrow
            onClick={() => handleSectionChange("medical")}
            label={tUI("nextSection_medical", lang)}
          />
        </div>
          </>
            )}

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

        {isConfirmed && interviewData?.goal && (
          <div className="mt-6 p-4 bg-emerald-100/80 dark:bg-emerald-900/40 text-base rounded-md text-gray-900 dark:text-white shadow max-w-2xl mx-auto">
            {tUI('medicalConfirmationMessage', lang)}
          </div>
        )}

          {/* 🔽 Neonowa strzałka Dalej */}
         <div className="mt-6 flex justify-end">
          <NeonNextArrow
           onClick={() => handleSectionChange("interview")}
            label={tUI("nextSection_interview", lang)}
          />
        </div>
        </>
      )}

       {selectedSection === 'interview' && (
  <>
          <InterviewWizard
            form={form}
            onFinish={async (data) => {
              await saveInterviewData(data);
              await handleGenerateNarrative();
            }}
            lang={lang}
            initialData={initialInterviewData}
          />

          {interviewData?.goal && (
            <div className="mt-6 p-4 bg-sky-100/80 dark:bg-sky-900/40 text-base rounded-md text-gray-900 dark:text-white shadow max-w-2xl mx-auto">
              {tUI('interviewConfirmationMessage', lang)}
            </div>
          )}

          {/* 🔽 Neonowa strzałka Dalej */}
          <div className="mt-6 flex justify-end">
          <NeonNextArrow
            onClick={() => handleSectionChange("calculator")}
            label={tUI("nextSection_calculator", lang)}
          />
        </div>
        </>
      )}

        {selectedSection === 'calculator' && (
          <>
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

            {/* 🔽 Neonowa strzałka Dalej */}
            <div className="mt-6 flex justify-end">
            <NeonNextArrow
              onClick={() => handleSectionChange("diet")}
              label={tUI("nextSection_diet", lang)}
            />
          </div>
          </>
        )}


{selectedSection === 'diet' && (
  <div className="space-y-6">
    {/* 🧠 Cel, model, kuchnia, posiłki – 2 rzędy po 2 kolumny */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
      <div className="w-full sm:max-w-[360px] min-h-[180px] flex flex-col justify-between items-center px-4 mx-auto">
        <DietGoalForm
          lang={lang}
          onChange={(goal) => setInterviewData({ ...interviewData, goal })}
        />
      </div>

      <div className="w-full sm:max-w-[360px] min-h-[180px] flex flex-col justify-between items-center px-4 mx-auto">
        <SelectModelForm
          lang={lang}
          onChange={(model) => setInterviewData({ ...interviewData, model })}
        />
      </div>

     <div className="w-full sm:max-w-[360px] min-h-[180px] flex flex-col justify-between items-center px-4 mx-auto">
       <SelectCuisineForm
          lang={lang}
          onChange={(cuisine) => setInterviewData({ ...interviewData, cuisine })}
        />
      </div>

      <div className="w-full sm:max-w-[360px] min-h-[180px] flex flex-col justify-between items-center px-4 mx-auto">
        <SelectMealsPerDayForm
          value={interviewData?.mealsPerDay}
          onChange={(meals: number) =>
            setInterviewData({ ...interviewData, mealsPerDay: meals })
          }
        />
      </div>
    </div>

    {/* 🔽 Kolejna sekcja – status, przyciski, tabela */}
    <div className="space-y-4">


  {/* ⏳ Status generowania */}
  {isGenerating && (
    <div className="text-sm text-gray-600 italic animate-pulse">
      ⏳ {tUI('writingDiet', lang)}{' '}
      {streamingText.length > 20 && `(${tUI('generatingWait', lang)})`}
    </div>
  )}

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
  {/* 🧠 Generuj dietę */}
  <button
    onClick={handleGenerateDiet}
    disabled={isGenerating}
    className="w-28 h-28 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow flex flex-col items-center justify-center text-center transition disabled:opacity-50"
  >
    <span className="text-4xl leading-none">🧠</span>
    <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
      {tUI('generateDiet', lang)}
    </span>
  </button>

{/* 📄 Generuj PDF */}
<button
  onClick={async () => {
    try {
      setProgress(10);
      setProgressMessage(tUI('generatingPdf', lang));

      const { generateDietPdf } = await import('@/utils/generateDietPdf');

      const bmi =
        form.weight && form.height
          ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
          : 0;

      const mealArray: Meal[] = (Object.values(editableDiet || {}) as Meal[][]).flat();

      if (!Array.isArray(mealArray) || mealArray.length === 0) {
        alert(tUI('dietPlanEmptyOrInvalid', lang));
        setProgress(0);
        setProgressMessage('');
        return;
      }

      setProgress(40);
      setProgressMessage(tUI('processingInterview', lang));

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
        narrativeText,
        recipes
      );

      setProgress(100);
      setProgressMessage(tUI('pdfReady', lang));
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1000);
    } catch (e) {
      console.error('❌ PDF generation error:', e);
      alert(tUI('errorGeneratingPdf', lang));
      setProgress(0);
      setProgressMessage('');
    }
  }}
  disabled={!editableDiet || Object.keys(editableDiet).length === 0 || progress > 0}
  className="w-28 h-28 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow flex flex-col items-center justify-center text-center transition disabled:opacity-50"
>
  <span className="text-4xl leading-none">📄</span>
  <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
    {tUI('generatePdf', lang)}
  </span>
</button>


  {/* ✅ Zatwierdź dietę */}
  <button
    onClick={async () => {
      const confirm = window.confirm(tUI('confirmApproveDietAsPatient', lang));
      if (confirm) {
        await saveDietToSupabaseOnly();
      }
    }}
    disabled={!editableDiet || Object.keys(editableDiet).length === 0}
    className="w-28 h-28 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow flex flex-col items-center justify-center text-center transition disabled:opacity-50"
  >
    <span className="text-4xl leading-none">✅</span>
    <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
      {tUI('approveDietAsPatient', lang)}
    </span>
  </button>

  {/* 🍽️ Generuj przepisy */}
{editableDiet && Object.keys(editableDiet).length > 0 && (
  <button
    onClick={handleGenerateRecipes}
    disabled={isGeneratingRecipes}
    className="w-28 h-28 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow flex flex-col items-center justify-center text-center transition disabled:opacity-50"
  >
    <span className="text-4xl leading-none">🍽️</span>
    <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
      {tUI('generateRecipes', lang)}
    </span>
  </button>
)}

{/* 📤 Wyślij dietę do lekarza/dietetyka */}
{editableDiet && Object.keys(editableDiet).length > 0 && (
  <div className="w-full max-w-xs flex flex-col items-center">
    <label htmlFor="doctorSelect" className="text-sm font-medium text-white mb-1">
      {tUI('sendDietToDoctor', lang)}
    </label>
    <select
      id="doctorSelect"
      className="w-full h-12 px-3 py-2 rounded-md bg-white text-black shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={handleShowDoctors} // 👈 pobiera listę tylko przy kliknięciu
      onChange={async (e) => {
        const selectedEmail = e.target.value;
        if (!selectedEmail) return;

        const selectedDoc = doctorList.find((doc) => doc.email === selectedEmail);
        if (!selectedDoc) return;

        const confirm = window.confirm(`${tUI('confirmSendDietToDoctor', lang)}\n${selectedDoc.name} (${selectedDoc.email})`);
        if (!confirm) return;

        setProgressMessage(tUI('savingDraft', lang));
        startFakeProgress(10, 95);

        await saveDraftToSupabaseWithDoctor(selectedEmail);

        setProgressMessage(tUI('sendingNotification', lang));

        try {
          const response = await fetch('/api/send-diet-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctorEmail: selectedDoc.email,
              patientName: form?.name || '',
              lang
            })
          });

          if (response.ok) {
            stopFakeProgress();
            setProgress(100);
            setProgressMessage(tUI('notificationSent', lang));
          } else {
            throw new Error('Mail failed');
          }
        } catch (err) {
          console.error('❌ Email error:', err);
          alert(tUI('notificationFailed', lang));
          stopFakeProgress();
          setProgress(0);
          setProgressMessage('');
        } finally {
          setTimeout(() => {
            setProgress(0);
            setProgressMessage('');
          }, 1000);
        }
      }}
    >
      <option value="">{tUI('selectDoctorPrompt', lang)}</option>
      {doctorList.map((doc) => (
        <option key={doc.id} value={doc.email}>
          {doc.name} ({doc.email})
        </option>
      ))}
    </select>
  </div>
)}

</div>

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

{/* 📖 Wyświetlenie przepisów */}
{selectedSection === 'diet' && recipes && Object.keys(recipes).length > 0 && (
  <div className="mt-6 space-y-6">
    {Object.entries(recipes).map(([day, meals]: any) => (
      <div key={day} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow">
        <h3 className="text-lg font-bold mb-2">{day}</h3>
        {Object.entries(meals).map(([mealName, recipe]: any) => (
          <div key={mealName} className="mb-4">
            <h4 className="font-semibold">{mealName}: {recipe.dish}</h4>
            <p className="italic text-sm text-gray-600 dark:text-gray-400 mb-1">{recipe.description}</p>
            <ul className="list-disc pl-5 text-sm">
              {recipe.ingredients?.map((ing: any, i: number) => (
                <li key={i}>{ing.product} – {ing.weight} {ing.unit}</li>
              ))}
            </ul>
            {recipe.steps && (
              <div className="mt-2 text-sm">
                <strong>Kroki:</strong>
                <ol className="list-decimal ml-4">
                  {recipe.steps.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {recipe.time && (
              <p className="mt-1 text-sm text-gray-500">⏱️ {recipe.time}</p>
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
)}

      {/* Asystent produktu + koszyk */}
      {selectedSection === 'scanner' && (
        <>
          <ProductAssistantPanel
        lang={lang}
        patient={form}
        form={form}
        interviewData={interviewData}
        medical={medicalData}
        dietPlan={editableDiet}
      />
        <BasketTable lang={lang} />

        </>
      )}

        {!selectedSection && (
          <p className="text-center text-gray-300 text-sm max-w-xl mx-auto">
            {tUI('iconInstructionFull', lang)}
          </p>
        )}
      </div>
      {progress > 0 && progress < 100 && (
  <ProgressOverlay message={progressMessage} percent={progress} />
)}

    </main>
  );
}
