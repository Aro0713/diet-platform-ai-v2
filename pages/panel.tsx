// 🔁 React / Next
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import PanelCard from '@/components/PanelCard';
import { translatedTitles } from '@/utils/translatedTitles';

// 🔌 Supabase
import { supabase } from '@/lib/supabaseClient';

// 🧩 Komponenty
import PatientPanelSection from '@/components/PatientPanelSection';
import PatientDataForm from '@/components/PatientDataForm';
import MedicalForm from '@/components/MedicalForm';
import SelectConditionForm from '@/components/SelectConditionForm';
import InterviewWizard from '@/components/InterviewWizard';
import DietGoalForm from '@/components/DietGoalForm';
import SelectCuisineForm from '@/components/SelectCuisineForm';
import SelectModelForm from '@/components/SelectModelForm';
import CalculationBlock from '@/components/CalculationBlock';
import DietTable from '@/components/DietTable';
import ConfirmationModal from '@/components/ConfirmationModal';

// 🧠 AI i utils
import { convertInterviewAnswers, extractMappedInterview } from '@/utils/interviewHelpers';
import { tryParseJSON } from '@/utils/tryParseJSON';
import { transformDietPlanToEditableFormat } from '@/utils/transformDietPlan';
import { generateDietPdf } from '@/utils/generateDietPdf';
import { validateDiet } from '@/utils/validateDiet';


// 🌍 Tłumaczenia
import { tUI } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';
import type { LangKey } from '@/utils/i18n';

import { usePatientFetchData } from '@/hooks/usePatientFetchData';
import { usePatientSubmitData } from '@/hooks/usePatientSubmitData';


// 📊 Typy
import type { Meal } from '@/types';

function Panel() {
  const [lang, setLang] = useState<LangKey>('pl');
  const [userData, setUserData] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<Record<string, Meal[]>>({});
  const [diet, setDiet] = useState<Record<string, Meal[]> | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [confirmedDiet, setConfirmedDiet] = useState<Meal[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [bmi, setBmi] = useState<number | null>(null);
  const [interviewNarrative, setInterviewNarrative] = useState('');
  const [pendingDiets, setPendingDiets] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [submitPending, setSubmitPending] = useState<(() => void) | null>(null);
  const [dietApproved, setDietApproved] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [narrativeText, setNarrativeText] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

 const {
  form, setForm,
  interviewData, setInterviewData,
  medicalData, setMedicalData,
  loadPatientData,
  initialMedicalData,
  initialInterviewData,
  editableDiet,
  setEditableDiet
} = usePatientFetchData();

const {
  saveMedicalData,
  saveInterviewData,
  saveDietPlan,
  confirmDietPlan 
} = usePatientSubmitData(form);



  useEffect(() => {
  console.log("📊 form.user_id:", form?.user_id);
  console.log("📊 initialMedicalData:", initialMedicalData);
  console.log("📊 initialInterviewData:", initialInterviewData);
}, [form, initialMedicalData, initialInterviewData]);

  const t = (key: keyof typeof translationsUI): string => tUI(key, lang);

 useEffect(() => {
  const fetchUserData = async () => {
    const role = localStorage.getItem('currentUserRole');
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ Błąd pobierania użytkownika:', error.message);
      return;
    }

    const userId = user?.id;
    console.log('👤 Zalogowano jako:', role, userId);
  };

  fetchUserData();
}, []);


  useEffect(() => {
    const langStorage = localStorage.getItem('platformLang') as LangKey | null;
    if (langStorage) setLang(langStorage);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    console.log('📘 Opis wywiadu zapisany:', interviewNarrative);
  }, [interviewNarrative]);
  useEffect(() => {
  const fetchUserData = async () => {
    const userId = localStorage.getItem('currentUserID');
    if (!userId) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Błąd pobierania danych użytkownika:', error.message);
      return;
    }

    if (data) {
      setUserData(data); // 🔥 teraz userData.name i userData.role będą działać
    }
  };

  fetchUserData();
}, []);

  useEffect(() => {
    const fetchDraftDiets = async () => {
      const { data, error } = await supabase
        .from('patient_diets')
        .select('*, patients(*)')
        .eq('status', 'draft');
      if (!error) setPendingDiets(data || []);
    };
    fetchDraftDiets();
  }, []);

  const handleMedicalChange = (data: {
    selectedGroups: string[];
    selectedConditions: string[];
    testResults: { [testName: string]: string };
    medicalSummary?: string;
    structuredOutput?: any;
  }) => {
    saveMedicalData(data);
  };

  const handleCalculationResult = ({ suggestedModel, ...rest }: any) => {
    setInterviewData((prev: any) => ({ ...prev, ...rest, model: suggestedModel }));
  };

  const getRecommendedMealsPerDay = (form: any, interviewData: any): number => {
    const bmi = form.weight && form.height ? form.weight / ((form.height / 100) ** 2) : null;
    if (['diabetes', 'insulin', 'pcos', 'ibs', 'reflux', 'ulcer'].some(c => form.conditions?.includes(c))) return 5;
    if (interviewData.goal === 'gain' || interviewData.goal === 'regen' || (bmi && bmi < 18.5)) return 5;
    if (interviewData.goal === 'lose' || (bmi && bmi > 30)) return 3;
    return 4;
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const missing: string[] = [];
  if (!form.age) missing.push(t('age'));
  if (!form.sex) missing.push(t('sex'));
  if (!form.weight) missing.push(t('weight'));
  if (!form.height) missing.push(t('height'));
  if (!interviewData.goal) missing.push(t('goal'));
  if (!interviewData.cuisine) missing.push(t('cuisine'));

  if (missing.length > 0) {
    setMissingFields(missing);
    setShowConfirmModal(true);
    setSubmitPending(() => () => handleSubmit(e));
    return;
  }

  const bmiCalc = form.weight / ((form.height / 100) ** 2);
  setBmi(parseFloat(bmiCalc.toFixed(1)));
  setIsGenerating(true);
  setStreamingText('');
  setDietApproved(false);

  if (!medicalData) {
    alert(tUI('confirmMedicalWarning', lang));
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
      interviewData.mealsPerDay = getRecommendedMealsPerDay(form, interviewData);
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

    const parsed = tryParseJSON(rawCompleteText);

    const mapDaysToPolish: Record<string, string> = {
      Monday: 'Poniedziałek',
      Tuesday: 'Wtorek',
      Wednesday: 'Środa',
      Thursday: 'Czwartek',
      Friday: 'Piątek',
      Saturday: 'Sobota',
      Sunday: 'Niedziela'
    };

    if (parsed.dietPlan && typeof parsed.dietPlan === 'object') {
  const transformed = transformDietPlanToEditableFormat(parsed.dietPlan, lang);

  if (Object.keys(transformed).length === 0) {
    console.warn('⚠️ Brak danych w dietPlan – nie zapisano.');
    return;
  }

  setMealPlan(transformed);
  setDiet(transformed);
  setEditableDiet(transformed);
  await saveDietPlan(transformed);
  return;
}

if (parsed.weekPlan && Array.isArray(parsed.weekPlan)) {
  const converted: Record<string, Meal[]> = {};
  for (const { day, meals } of parsed.weekPlan) {
    converted[mapDaysToPolish[day] || day] = meals.map((meal: any) => ({
      name: meal.name || '',
      description: meal.menu || '',
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      calories: meal.kcal || 0,
      glycemicIndex: meal.glycemicIndex || 0,
      time: meal.time || ''
    }));
  }

  if (Object.keys(converted).length === 0) {
    console.warn('⚠️ Brak danych do zapisania w saveDietPlan – weekPlan był pusty.');
    return;
  }

  setMealPlan(converted);
  setDiet(converted);
  setEditableDiet(converted);
  await saveDietPlan(converted);
  return;
}


    if (parsed.mealPlan && Array.isArray(parsed.mealPlan)) {
  const converted: Record<string, Meal[]> = {};
  for (const entry of parsed.mealPlan) {
    const { day, meals } = entry;
    converted[mapDaysToPolish[day] || day] = meals.map((m: any) => ({
      name: m.name || '',
      description: m.description || '',
      ingredients: [],
      calories: m.kcal || 0,
      glycemicIndex: m.glycemicIndex || 0,
      time: m.time || ''
    }));
  }
  if (Object.keys(converted).length === 0) {
    console.warn('⚠️ Brak danych do zapisania w saveDietPlan – weekPlan był pusty.');
    return;
  }

  setMealPlan(converted);
  setDiet(converted);
  setEditableDiet(converted);
  await saveDietPlan(converted); 
  return;
}

    throw new Error('Brak poprawnego planu posiłków.');
  } catch (err) {
    console.error('❌ Błąd przy generowaniu:', err);
    alert(tUI('dietGenerationError', lang));
  } finally {
    setIsGenerating(false);
  }
};

const handleGenerateNarrative = async () => {
  try {
    const { narrativeInput } = convertInterviewAnswers(interviewData);
    const response = await fetch('/api/interview-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewData: narrativeInput,
        goal: interviewData.goal,
        recommendation: interviewData.recommendation,
        lang
      })
    });

    const fullResult = await response.text();
   const jsonMatch = fullResult.match(/```json\s*([\s\S]*?)```/);

    let parsed: Record<string, any> | null = null;

    if (jsonMatch && jsonMatch[1]) {
      try {
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch {}
    }
   
    const summary = fullResult.split('```json')[0].trim();
    setNarrativeText(summary);
    setInterviewData((prev: any) => ({
      ...prev,
      narrativeText: summary,
      narrativeJson: parsed || null
    }));
  } catch (err) {
    alert('⚠️ Nie udało się połączyć z AI.');
  }
};
const [patientEmailInput, setPatientEmailInput] = useState('');
const [patientLoadStatus, setPatientLoadStatus] = useState<'idle' | 'loading' | 'notFound' | 'success'>('idle');

const handleSearchPatient = async () => {
  setPatientLoadStatus('loading');
  const email = patientEmailInput.trim().toLowerCase();

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    console.error("❌ Nie udało się pobrać użytkownika (auth.uid())", error?.message);
    setPatientLoadStatus('notFound');
    return;
  }

  const doctorId = user.id;

  const { error: insertError } = await supabase
    .from('patient_access_requests')
    .insert([{
      doctor_id: doctorId,
      patient_email: email,
      status: 'pending'
    }]);

  if (insertError) {
    console.error('❌ Błąd podczas tworzenia zgłoszenia:', insertError.message);
    setPatientLoadStatus('notFound');
    return;
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('user_id')
    .eq('email', email)
    .maybeSingle();

  if (patient?.user_id) {
    console.log('📥 Załadowano dane pacjenta:', patient.user_id);
    await loadPatientData(patient.user_id);
    setPatientLoadStatus('success');
  } else {
    alert(tUI('accessRequestSent', lang)); // zgłoszenie wysłane, pacjent jeszcze nie istnieje
    setPatientLoadStatus('idle');
  }
};
const handleApproveDiet = async () => {
  const ok = await confirmDietPlan();
  if (ok) {
    setDietApproved(true);
    alert(tUI('dietApprovedSuccess', lang));
  } else {
    alert(tUI('dietApprovedError', lang));
  }
};
const handleSendDietToPatient = async () => {
  if (!form.email || !form.name) {
    alert(tUI('missingPatientEmailOrName', lang));
    return;
  }

  try {
    const res = await fetch('/api/send-diet-approved-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientEmail: form.email,
        patientName: form.name,
        lang
      })
    });

    const json = await res.json();
    if (json.success) {
      alert(tUI('dietSentSuccess', lang));
    } else {
      alert(tUI('dietSentError', lang));
    }
  } catch (err) {
    console.error('❌ Błąd przy wysyłaniu maila:', err);
    alert(tUI('dietSentError', lang));
  }
};

return (
  <main className="relative min-h-screen
    bg-[#0f271e]/70
    bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60
    backdrop-blur-[12px]
    shadow-[inset_0_0_60px_rgba(255,255,255,0.08)]
    flex flex-col justify-start items-center pt-10 px-6
    text-white transition-all duration-300"
  >
    {/* Pasek z nagłówkiem i przełącznikiem */}
    <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
      <div className="flex flex-col">
        {userData?.name && (
          <span className="text-sm font-medium text-white dark:text-white">
            {userData.title &&
              translatedTitles[userData.title as 'dr' | 'drhab' | 'prof']?.[lang] && (
                <>{translatedTitles[userData.title as 'dr' | 'drhab' | 'prof'][lang]} </>
              )}
            {userData.name}
            {userData.role &&
              translationsUI[userData.role as 'doctor' | 'dietitian']?.[lang] && (
                <> – {translationsUI[userData.role as 'doctor' | 'dietitian'][lang]}</>
              )}
          </span>
        )}
        <h1 className="text-2xl font-bold text-white dark:text-white">
        {tUI('doctorPanelTitle', lang)}
      </h1>
      </div>
      <LangAndThemeToggle />
    </div>

    {/* Główna zawartość */}
    <div className="z-10 flex flex-col w-full max-w-[1400px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20 dark:text-white transition-colors">

<PanelCard>
  <div className="flex flex-col gap-4">
    <label className="text-sm font-medium text-black dark:text-white">
      Dane pacjenta
    </label>

    {/* 🔍 Pobieranie pacjenta po e-mailu */}
    <input
      type="email"
      value={patientEmailInput}
      onChange={(e) => setPatientEmailInput(e.target.value)}
      placeholder="adres@example.com"
      className="rounded px-4 py-2 text-black w-full"
    />
    <button
      onClick={handleSearchPatient}
      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
    >
      🔍 Pobierz dane pacjenta
    </button>

    {patientLoadStatus === 'notFound' && (
      <div className="text-yellow-400 mt-2">❌ Nie znaleziono pacjenta</div>
    )}

    {patientLoadStatus === 'success' && (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <input
            type="text"
            value={form.name || ''}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Imię i nazwisko"
            className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white"
          />
          <input
            type="email"
            value={form.email || ''}
            disabled
            className="rounded px-3 py-2 bg-gray-200 text-black dark:bg-gray-700 dark:text-white cursor-not-allowed"
          />
          <input
            type="tel"
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Telefon"
            className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white"
          />
          <select
            value={form.sex || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'male' || val === 'female') {
                setForm({ ...form, sex: val as 'male' | 'female' });
              }
            }}
            className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white"
          >
            <option value="">-- Wybierz płeć --</option>
            <option value="male">Mężczyzna</option>
            <option value="female">Kobieta</option>
          </select>
          <input
            type="number"
            value={form.age || ''}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            placeholder="Wiek"
            className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white"
          />
          <input
            type="number"
            value={form.height || ''}
            onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
            placeholder="Wzrost (cm)"
            className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white"
          />
          <input
            type="number"
            value={form.weight || ''}
            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
            placeholder="Waga (kg)"
            className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white"
          />
          <select
            value={form.region || ''}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white"
          >
            <option value="">-- Wybierz region --</option>
            <option value="Europa">Europa</option>
            <option value="Ameryka Północna">Ameryka Północna</option>
            <option value="Ameryka Południowa">Ameryka Południowa</option>
            <option value="Azja">Azja</option>
            <option value="Afryka">Afryka</option>
            <option value="Australia">Australia</option>
          </select>
        </div>

        <button
          onClick={async () => {
            const { error } = await supabase
              .from('patients')
              .update({
                name: form.name,
                phone: form.phone,
                sex: form.sex,
                age: form.age,
                height: form.height,
                weight: form.weight,
                region: form.region
              })
              .eq('user_id', form.user_id);

            if (!error) {
              alert('✅ Dane pacjenta zostały zapisane');
            } else {
              alert('❌ Błąd przy zapisie danych pacjenta: ' + error.message);
            }
          }}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          💾 Zapisz dane pacjenta
        </button>
      </>
    )}
  </div>
</PanelCard>


      {/* Sekcja 2: Dane medyczne */}
      <PanelCard className="z-30">
          <MedicalForm
            key={JSON.stringify(initialMedicalData)}
            initialData={initialMedicalData}
            existingMedical={medicalData}
            onChange={handleMedicalChange}
            onUpdateMedical={(summary) => setMedicalData((prev: any) => ({ ...prev, summary }))}
            userId={form.user_id}
            lang={lang}
          />
        </PanelCard>

      {/* Sekcja 3: Wywiad pacjenta */}
              <PanelCard title={`🧠 ${tUI('interviewTitle', lang)}`}>
          <InterviewWizard
            key={JSON.stringify(initialInterviewData)}
            form={form}
            initialData={initialInterviewData}
            lang={lang}
            onFinish={saveInterviewData}
            onUpdateNarrative={(text) => setNarrativeText(text)}
          />
        </PanelCard>
  
{/* Sekcja 3.1: Rekomendacje i liczba posiłków */}

  <PanelCard className="h-full">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-black dark:text-white">
          {tUI('doctorRecommendation', lang)}
        </label>
        <textarea
          rows={4}
          className="w-full border rounded px-3 py-2 text-sm text-gray-800 dark:text-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          value={interviewData.recommendation || ''}
          onChange={(e) =>
            setInterviewData({ ...interviewData, recommendation: e.target.value })
          }
        />
      </div>
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-black dark:text-white">
          {tUI('mealsPerDay', lang)}
        </label>
        <select
          className="w-full border rounded px-3 py-2 text-sm text-gray-800 dark:text-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          value={interviewData.mealsPerDay || ''}
          onChange={(e) =>
            setInterviewData({ ...interviewData, mealsPerDay: parseInt(e.target.value) })
          }
        >
          <option value="">{`-- ${tUI('selectOption', lang)} --`}</option>
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  </PanelCard>


          {/* Sekcja 4: Cel, model, kuchnia */}
    
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-start">
        <PanelCard className="h-full">
          <DietGoalForm
            onChange={(goal) => setInterviewData({ ...interviewData, goal })}
            lang={lang}
          />
        </PanelCard>
        <PanelCard className="h-full">
          <SelectModelForm
            onChange={(model) => setInterviewData({ ...interviewData, model })}
            lang={lang}
          />
        </PanelCard>
        <PanelCard className="h-full">
          <SelectCuisineForm
            onChange={(cuisine) => setInterviewData({ ...interviewData, cuisine })}
            lang={lang}
          />
        </PanelCard>
      </div>


    {/* Sekcja 5: Kalkulator */}
    
      <PanelCard title={`🧮 ${tUI('patientInNumbers', lang)}`} className="h-full">
        <CalculationBlock
          form={form}
          interview={extractMappedInterview(interviewData)}
          lang={lang}
          onResult={handleCalculationResult}
        />
      </PanelCard>
    
<div className="flex flex-wrap justify-between items-stretch gap-4 mt-6 w-full">
  {/* 🔵 Wygeneruj dietę */}
  <div className="flex-1">
    <button
      type="button"
      onClick={handleSubmit}
      className="w-full h-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
      disabled={isGenerating}
    >
      {isGenerating ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⚙️</span>
          {tUI('writingDiet', lang)}
        </span>
      ) : tUI('generate', lang)}
    </button>
  </div>

  {/* 🟣 Zatwierdź dietę */}
  {editableDiet && !dietApproved && (
    <div className="flex-1">
      <button
        type="button"
        className="w-full h-full bg-purple-700 text-white px-4 py-3 rounded-md font-medium hover:bg-purple-800 disabled:opacity-50"
        onClick={handleApproveDiet}
        disabled={isGenerating}
      >
        ✅ {tUI('confirmDiet', lang)}
      </button>
    </div>
  )}

  {/* 📤 Wyślij dietę do pacjenta */}
  {editableDiet && dietApproved && (
    <div className="flex-1">
      <button
        type="button"
        className="w-full h-full bg-indigo-600 text-white px-4 py-3 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
        onClick={handleSendDietToPatient}
        disabled={isGenerating || !form?.email}
      >
        📤 {tUI('sendDietToPatient', lang)}
      </button>
    </div>
  )}

  {/* 📄 PDF */}
  <div className="flex-1">
    <button
      type="button"
      className="w-full h-full bg-green-700 text-white px-4 py-3 rounded-md font-medium hover:bg-green-800 disabled:opacity-50"
      disabled={isGenerating || !confirmedDiet || !dietApproved}
      onClick={async () => {
        try {
          setIsGenerating(true);
          const { generateDietPdf } = await import('@/utils/generateDietPdf');
          await generateDietPdf(
            form,
            bmi,
            confirmedDiet!,
            dietApproved,
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
        } catch (e) {
          alert('❌ Błąd przy generowaniu PDF');
          console.error(e);
        } finally {
          setIsGenerating(false);
        }
      }}
    >
      📄 {tUI('pdf', lang)}
    </button>
  </div>
</div>

{isGenerating && (
  <div className="text-sm text-gray-600 italic mt-4 animate-pulse">
    ⏳ Piszę dietę... {streamingText.length > 20 && '(czekaj, trwa generowanie)'}
  </div>
)}

      {/* Sekcja 7: Tabela z dietą */}
       <PanelCard>
          <DietTable
            editableDiet={editableDiet}
            setEditableDiet={setEditableDiet}
            setConfirmedDiet={(dietByDay) => {
              const mealsWithDays = Object.entries(dietByDay).flatMap(([day, meals]) =>
                meals.map((meal) => ({ ...meal, day }))
              );
              setConfirmedDiet(mealsWithDays);
              setDietApproved(true);
            }}
            isEditable={!dietApproved}
            lang={lang}
            notes={notes}
            setNotes={setNotes}
          />
        </PanelCard>
    </div>
  </main>
);
}

export default Panel;
