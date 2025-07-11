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


export default function DoctorPanelPage(): React.JSX.Element {
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
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false)

  // 🧠 Ustawienie języka z localStorage
useEffect(() => {
  const storedLang = localStorage.getItem('platformLang');
  if (storedLang) setLang(storedLang as LangKey);
}, []);

// 💾 Ustawienie userId w localStorage do zapisu danych
useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    if (data?.user?.id) {
      localStorage.setItem('currentUserID', data.user.id);
      console.log("✅ Zapisano userId do localStorage:", data.user.id);
    } else {
      console.warn("❌ Brak user.id – użytkownik nie jest zalogowany?");
    }
  });
}, []);

  // 📦 Hook z danymi pacjenta
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

  console.log("📦 form w panel-patient:", form);

  // ✅ Pobranie danych pacjenta po załadowaniu komponentu
useEffect(() => {
  fetchPatientData(); // ✅ ta wersja jest zgodna z Twoim hookiem
}, []);


  // 🔁 Pobranie danych przy powrocie do sekcji 'medical'
  useEffect(() => {
    if (selectedSection === 'medical') {
      const userId = localStorage.getItem('currentUserID');
      if (userId) {
        fetchPatientData(); 
      }
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
      .upsert({
        user_id: userId,
        diet_plan: editableDiet,
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

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
        narrativeText,
        recipes
        );

    } catch (err) {
      console.error(`${tUI('dietApprovalErrorPrefix', lang)} ${err}`);
      alert(tUI('dietApprovalFailed', lang));
    }
  };
const saveDietToSupabaseOnly = async () => {
  if (!editableDiet || Object.keys(editableDiet).length === 0) return;

  const userId = localStorage.getItem('currentUserID');
  if (!userId) {
    alert(tUI("notLoggedIn", lang));
    return;
  }

  try {
  const { error } = await supabase
  .from("patient_diets")
  .upsert({
    user_id: userId,
    diet_plan: editableDiet,
    status: "confirmed",
    confirmed_at: new Date().toISOString()
  }, { onConflict: 'user_id' });

    if (error) {
      console.error("❌ Błąd zapisu diety:", error.message);
      alert(tUI("errorSavingDiet", lang));
    } else {
      alert(tUI("dietApproved", lang));
    }
  } catch (err) {
    console.error("❌ Błąd zapisu diety (try/catch):", err);
    alert(tUI("errorSavingDiet", lang));
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
  .upsert({
    user_id: userId,
    diet_plan: editableDiet,
    status: 'draft'
  }, { onConflict: 'user_id' });

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

    // 🧠 Pacjent nie ustawia liczby posiłków – agent to zrobi na podstawie wywiadu i wyników

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
const handleGenerateRecipes = async () => {
  try {
    setIsGeneratingRecipes(true);
    const res = await fetch('/api/generate-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietPlan: editableDiet })
    });

    const json = await res.json();
    setRecipes(json.recipes);
  } catch (err) {
    console.error('❌ Błąd generowania przepisów:', err);
    alert(tUI('errorGeneratingRecipes', lang));
  } finally {
    setIsGeneratingRecipes(false);
  }
};
const handleGenerateNarrative = async () => {
  try {
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
  } catch (err) {
    console.error('❌ Błąd przy pobieraniu opisu AI:', err);
    setNarrativeText('⚠️ Błąd generowania opisu wywiadu przez AI');
  }
};
console.log("📦 form w panel-patient:", form);

const goToSectionWithScroll = (id: string) => {
  setSelectedSection(id);
  setTimeout(() => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  }, 50);
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
      <PatientIconGrid lang={lang} selected={selectedSection} onSelect={(id) => setSelectedSection(id)} />
     
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
            onClick={() => goToSectionWithScroll("medical")}
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
           onClick={() => goToSectionWithScroll("interview")}
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
            onClick={() => goToSectionWithScroll("interview")}
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
              onClick={() => goToSectionWithScroll("diet")}
              label={tUI("nextSection_diet", lang)}
            />
          </div>
          </>
        )}


        {selectedSection === 'diet' && (
  <div className="space-y-6">
    {/* Wybór celu, modelu, kuchni */}
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
        setIsGenerating(true);
        const { generateDietPdf } = await import('@/utils/generateDietPdf');
        const bmi = form.weight && form.height
          ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
          : 0;
        const mealArray: Meal[] = (Object.values(editableDiet || {}) as Meal[][]).flat();

        if (!Array.isArray(mealArray) || mealArray.length === 0) {
          alert(tUI('dietPlanEmptyOrInvalid', lang));
          return;
        }

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
      } catch (e) {
        alert(tUI('errorGeneratingPdf', lang));
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }}
    disabled={isGenerating || !editableDiet || Object.keys(editableDiet).length === 0}
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

  {/* 📤 Wyślij do lekarza */}
  <button
    onClick={async () => {
      const confirm = window.confirm(tUI('confirmSendDietToDoctor', lang));
      if (!confirm) return;
      await saveDraftToSupabase();
    }}
    disabled={!editableDiet || Object.keys(editableDiet).length === 0}
    className="w-28 h-28 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow flex flex-col items-center justify-center text-center transition disabled:opacity-50"
  >
    <span className="text-4xl leading-none">📤</span>
    <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
      {tUI('sendDietToDoctor', lang)}
    </span>
  </button>
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
    </main>
  );
}
