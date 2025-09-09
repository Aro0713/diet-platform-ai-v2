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
import { validateDiet } from '@/utils/validateDiet';

// 🌍 Tłumaczenia
import { tUI } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';
import type { LangKey } from '@/utils/i18n';

import { usePatientFetchData } from '@/hooks/usePatientFetchData';
import { usePatientSubmitData } from '@/hooks/usePatientSubmitData';


// 📊 Typy
import type { Meal } from '@/types';

// Przepis w formacie używanym w UI i PDF
type RecipeUI = {
  dish: string;
  description?: string;
  servings?: number;
  time?: string;
  ingredients: { product: string; weight: number | null; unit: string }[];
  steps: string[];
};
// → kształt zgodny z utils/generateDietPdf.ts (wymagane description i servings)
type RecipePdf = {
  dish: string;
  description: string;
  servings: number;
  time?: string;
  ingredients: { product: string; weight: number; unit: string }[];
  steps: string[];
};

function toPdfRecipes(
  input: Record<string, Record<string, RecipeUI>>
): Record<string, Record<string, RecipePdf>> {
  const out: Record<string, Record<string, RecipePdf>> = {};

  // Object.entries z typami, żeby nie było 'implicitly any'
  for (const [day, meals] of Object.entries(input ?? {}) as [string, Record<string, RecipeUI>][]) {
    const dayOut: Record<string, RecipePdf> = {};

    for (const [mealName, r] of Object.entries(meals ?? {}) as [string, RecipeUI][]) {
      dayOut[mealName] = {
        dish: r.dish ?? '',
        description: r.description ?? '',
        servings: typeof r.servings === 'number' ? r.servings : 1,
        time: r.time || undefined,
        ingredients: (r.ingredients ?? []).map(
          (ing: RecipeUI['ingredients'][number]): { product: string; weight: number; unit: string } => ({
            product: ing.product ?? '',
            weight: typeof ing.weight === 'number' ? ing.weight : 0,
            unit: ing.unit || 'g'
          })
        ),
        steps: Array.isArray(r.steps) ? r.steps.filter((s): s is string => typeof s === 'string') : []
      };
    }

    out[day] = dayOut;
  }

  return out;
}
function parseRawDietPlan(raw: any): Record<string, Meal[]> {
  const parsed: Record<string, Meal[]> = {};
  for (const [day, dayData] of Object.entries(raw || {})) {
    const mealsForDay: Meal[] = [];
    if (Array.isArray(dayData)) {
      for (const meal of dayData) {
        if (!meal || typeof meal !== 'object') continue;
        const name = meal.name || meal.menu || meal.mealName || 'Posiłek';
        const time = meal.time || '00:00';
        const ingredients = (meal.ingredients || [])
          .map((i: any) => ({
            product: i.product || i.name || '',
            weight:
              typeof i.weight === 'number' ? i.weight :
              typeof i.quantity === 'number' ? i.quantity :
              Number(i.weight) || Number(i.quantity) || 0
          }))
          .filter((i: any) =>
            i.product && typeof i.product === 'string' &&
            !['undefined', 'null', 'name'].includes(i.product.toLowerCase())
          );
        mealsForDay.push({
          name,
          time,
          menu: name,
          ingredients,
          macros: meal.macros || {
            kcal: 0, protein: 0, fat: 0, carbs: 0,
            fiber: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
            iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0, vitaminC: 0,
            vitaminA: 0, vitaminE: 0, vitaminK: 0,
          },
          glycemicIndex: meal.glycemicIndex ?? 0,
          day
        });
      }
    }
    parsed[day] = mealsForDay;
  }
  return parsed;
}

type PatientFormData = {
  name?: string;
  email?: string;
  phone?: string;
  sex?: 'male' | 'female';
  age?: number;
  height?: number;
  weight?: number;
  region?: string;
  user_id?: string;
};

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
  const [recipes, setRecipes] = useState<Record<string, Record<string, RecipeUI>>>({});
  const [recipesLoading, setRecipesLoading] = useState(false);
  const router = useRouter();
  const [patientMode, setPatientMode] = useState<'registered' | 'unregistered'>('registered');
  const [formUnregistered, setFormUnregistered] = useState<PatientFormData>({});

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

const patientChoice = (initialInterviewData && Object.keys(initialInterviewData).length)
  ? initialInterviewData
  : (interviewData || {});

const {
  saveMedicalData,
  saveInterviewData,
  saveDietPlan,
  confirmDietPlan 
} = usePatientSubmitData(form);

// ⬇ pobierz najnowszą dietę pacjenta z `patient_diets`
const loadLatestDietFromSupabase = async (userId: string) => {
  const { data, error } = await supabase
    .from('patient_diets')
    .select('diet_plan, status, created_at') // ✅ tylko istniejące kolumny
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('⚠️ Błąd pobierania diety pacjenta:', error.message);
    return;
  }

  const rawJson = data?.diet_plan ?? null;
  if (!rawJson) {
    console.log('ℹ️ Brak zapisanej diety dla pacjenta.');
    return;
  }

  // diet_plan bywa JSONB lub string → znormalizuj
  const raw =
    typeof rawJson === 'string'
      ? (tryParseJSON(rawJson) ?? {})
      : rawJson;

  const loaded = parseRawDietPlan(raw);
  if (!loaded || !Object.keys(loaded).length) {
    console.warn('⚠️ diet_plan pusty lub w nieoczekiwanym formacie.');
    return;
  }

  // Zasil panel
  setMealPlan(loaded);
  setDiet(loaded);
  setEditableDiet(loaded);

  // Spłaszcz do PDF
  const flat = Object.entries(loaded).flatMap(([day, meals]) =>
    (meals as Meal[]).map(m => ({ ...m, day }))
  );
  setConfirmedDiet(flat);

  // Ustaw status zatwierdzenia wg rekordu
  setDietApproved(data?.status === 'confirmed');
};

  useEffect(() => {
  console.log("📊 form.user_id:", form?.user_id);
  console.log("📊 initialMedicalData:", initialMedicalData);
  console.log("📊 initialInterviewData:", initialInterviewData);
}, [form, initialMedicalData, initialInterviewData]);

// Gdy dieta wpadnie z bazy/hooka → pokaż ją w tabeli i umożliw PDF po zatwierdzeniu
useEffect(() => {
  if (editableDiet && Object.keys(editableDiet).length) {
    setMealPlan(editableDiet);
    setDiet(editableDiet);
    const flat = Object.entries(editableDiet).flatMap(([day, meals]) =>
      (meals as Meal[]).map(m => ({ ...m, day }))
    );
    setConfirmedDiet(flat); // PDF włączy się po wciśnięciu "Zatwierdź dietę"
  }
}, [editableDiet]);


  const t = (key: keyof typeof translationsUI): string => tUI(key, lang);

 useEffect(() => {
  const fetchUserData = async () => {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      console.error('❌ Nie udało się pobrać usera:', error?.message);
      return;
    }

    const { data, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('❌ Błąd pobierania danych użytkownika:', userError.message);
      return;
    }

    if (data) {
      console.log('📦 userData:', data);
      setUserData(data);
    }
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

let json: any;
try {
  json = JSON.parse(rawCompleteText);
} catch (e) {
  console.error('❌ Błąd parsowania JSON z diety:', rawCompleteText);
  alert(tUI('dietGenerationFailed', lang));
  setIsGenerating(false);
  return;
}

// --- priorytet 1: dietPlan / correctedDietPlan ---
if (json.dietPlan && typeof json.dietPlan === 'object') {
  const parsedDiet = parseRawDietPlan(json.dietPlan || json.correctedDietPlan);
  if (Object.keys(parsedDiet).length === 0) {
    console.warn('⚠️ Brak danych w dietPlan – nie zapisano.');
    setIsGenerating(false);
    return;
  }
  setMealPlan(parsedDiet);
  setDiet(parsedDiet);
  setEditableDiet(parsedDiet);
  await saveDietPlan(parsedDiet);
  setIsGenerating(false);
  return;
}

// --- priorytet 2: weekPlan (fallback) ---
const mapDaysToPolish: Record<string, string> = {
  Monday: 'Poniedziałek',
  Tuesday: 'Wtorek',
  Wednesday: 'Środa',
  Thursday: 'Czwartek',
  Friday: 'Piątek',
  Saturday: 'Sobota',
  Sunday: 'Niedziela'
};

if (json.weekPlan && Array.isArray(json.weekPlan)) {
  const converted: Record<string, Meal[]> = {};
  for (const { day, meals } of json.weekPlan) {
    converted[mapDaysToPolish[day] || day] = (meals || []).map((meal: any) => ({
      name: meal.name || '',
      menu: meal.menu || meal.description || meal.name || '',
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      macros: meal.macros || {
        kcal: meal.kcal || 0, protein: 0, fat: 0, carbs: 0,
        fiber: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
        iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0, vitaminC: 0,
        vitaminA: 0, vitaminE: 0, vitaminK: 0,
      },
      glycemicIndex: meal.glycemicIndex || 0,
      time: meal.time || ''
    }));
  }
  if (Object.keys(converted).length === 0) {
    console.warn('⚠️ Brak danych do zapisania – weekPlan był pusty.');
    setIsGenerating(false);
    return;
  }
  setMealPlan(converted);
  setDiet(converted);
  setEditableDiet(converted);
  await saveDietPlan(converted);
  setIsGenerating(false);
  return;
}

// --- priorytet 3: mealPlan (drugi fallback) ---
if (json.mealPlan && Array.isArray(json.mealPlan)) {
  const converted: Record<string, Meal[]> = {};
  for (const entry of json.mealPlan) {
    const { day, meals } = entry || {};
    converted[mapDaysToPolish[day] || day] = (meals || []).map((m: any) => ({
      name: m.name || '',
      menu: m.description || m.name || '',
      ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
      macros: m.macros || {
        kcal: m.kcal || 0, protein: 0, fat: 0, carbs: 0,
        fiber: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
        iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0, vitaminC: 0,
        vitaminA: 0, vitaminE: 0, vitaminK: 0,
      },
      glycemicIndex: m.glycemicIndex || 0,
      time: m.time || ''
    }));
  }
  if (Object.keys(converted).length === 0) {
    console.warn('⚠️ Brak danych do zapisania – mealPlan był pusty.');
    setIsGenerating(false);
    return;
  }
  setMealPlan(converted);
  setDiet(converted);
  setEditableDiet(converted);
  await saveDietPlan(converted);
  setIsGenerating(false);
  return;
}

// --- nic nie pasuje ---
console.error('❌ Brak poprawnego planu posiłków w odpowiedzi:', json);
alert(tUI('dietGenerationFailed', lang));
setIsGenerating(false);
return;

  } catch (err) {
    console.error('❌ Błąd przy generowaniu:', err);
    alert(tUI('dietGenerationError', lang));
  } finally {
    setIsGenerating(false);
  }
};
const handleGenerateRecipes = async () => {
  if (!mealPlan || Object.keys(mealPlan).length === 0) {
    alert(tUI('dietGenerationFailed', lang)); // albo dodaj osobny klucz np. 'noDietForRecipes'
    return;
  }
  try {
    setRecipesLoading(true);
    const res = await fetch('/api/generate-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dietPlan: mealPlan,       // ⬅️ przekazujemy słownik day -> Meal[]
        lang,
        cuisine: interviewData?.cuisine,
        nutrientFocus: []         // (opcjonalnie) możesz tu podać listę mikro, jeśli masz
      })
    });
    const json = await res.json();
    if (json?.recipes && typeof json.recipes === 'object') {
      setRecipes(json.recipes as Record<string, Record<string, RecipeUI>>);
    } else {
      console.warn('⚠️ Brak recipes w odpowiedzi:', json);
      alert(tUI('dietGenerationFailed', lang)); // lub 'recipesGenerationFailed' jeśli masz klucz
    }
  } catch (e) {
    console.error('❌ Błąd generate-recipes:', e);
    alert(tUI('dietGenerationError', lang)); // lub 'recipesGenerationError'
  } finally {
    setRecipesLoading(false);
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
    await loadLatestDietFromSupabase(patient.user_id);
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
if (!userData?.plan || new Date(userData.subscription_end) < new Date()) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur text-white p-6 flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold mb-4">{tUI('noActiveSubscription', lang)}</h1>
      <p className="text-sm mb-6 text-center max-w-md">{tUI('subscriptionRequiredInfo', lang)}</p>
      <button
        onClick={() => router.push('/paymentsUsers')}
        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded"
      >
        💳 {tUI('buySubscription', lang)}
      </button>
    </main>
  );
}

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
    <h1 className="text-2xl font-bold text-white dark:text-white">
      {tUI('doctorPanelTitle', lang)}
    </h1>

    {userData?.name && (
      <div className="flex flex-col gap-1 mt-1">
        <p className="text-sm font-medium text-white/90 dark:text-white/90">
          {userData.title &&
            translatedTitles[userData.title as 'dr' | 'drhab' | 'prof']?.[lang] && (
              <>{translatedTitles[userData.title as 'dr' | 'drhab' | 'prof'][lang]} </>
            )}
          {userData.name}
          {userData.role &&
            translationsUI[userData.role as 'doctor' | 'dietitian']?.[lang] && (
              <> – {translationsUI[userData.role][lang]}</>
            )}
        </p>

      {/* 🔔 Status subskrypcji */}
      {userData?.plan && new Date(userData.subscription_end) > new Date() ? (
        <p className="text-xs text-green-400">
          ✅ {tUI('activeSubscription', lang)}:{' '}
          {userData.plan === 'pro_annual'
            ? tUI('planAnnual', lang)
            : tUI('planMonthly', lang)}
          <span className="ml-4">
            {tUI('validUntil', lang)}: {new Date(userData.subscription_end).toLocaleDateString(lang)}
          </span>
          <button
            onClick={() => router.push('/paymentsUsers')}
            className="ml-4 underline text-white hover:text-blue-300 transition"
          >
            {tUI('manageSubscription', lang)}
          </button>
        </p>
      ) : userData?.plan ? (
        <p className="text-xs text-yellow-400">
          ⚠️ {tUI('expiredSubscription', lang)}
          <button
            onClick={() => router.push('/paymentsUsers')}
            className="ml-4 underline text-white hover:text-blue-300 transition"
          >
            {tUI('renewSubscription', lang)}
          </button>
        </p>
      ) : (
        <p className="text-xs text-yellow-400">
          ⚠️ {tUI('noActiveSubscription', lang)}
          <button
            onClick={() => router.push('/paymentsUsers')}
            className="ml-4 underline text-white hover:text-blue-300 transition"
          >
            {tUI('buySubscription', lang)}
          </button>
        </p>
      )}
    </div>
    )}
  </div>

  <LangAndThemeToggle />
</div>

    {/* Główna zawartość */}
    <div className="z-10 flex flex-col w-full max-w-[1400px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20 dark:text-white transition-colors">

<PanelCard>
  <div className="flex gap-4 mb-4">
  <label className="flex items-center gap-2">
    <input
      type="radio"
      name="patientMode"
      value="registered"
      checked={patientMode === 'registered'}
      onChange={() => setPatientMode('registered')}
    />
    {tUI('modeRegistered', lang)}
  </label>
  <label className="flex items-center gap-2">
    <input
      type="radio"
      name="patientMode"
      value="unregistered"
      checked={patientMode === 'unregistered'}
      onChange={() => setPatientMode('unregistered')}
    />
    {tUI('modeUnregistered', lang)}
  </label>
</div>


<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
  {/* 🔵 LEWA: Pacjent z kontem DCP */}
  <div className="flex flex-col gap-4">
    <label className="text-sm font-medium text-black dark:text-white">
      {tUI('patientData', lang)}
    </label>

    <input
      type="email"
      value={patientEmailInput}
      onChange={(e) => setPatientEmailInput(e.target.value)}
      placeholder={tUI('enterEmail', lang)}
      className="rounded px-4 py-2 text-black w-full"
      disabled={patientMode !== 'registered'}
    />
    <button
      onClick={handleSearchPatient}
      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
      disabled={patientMode !== 'registered'}
    >
      🔍 {tUI('fetchPatientData', lang)}
    </button>

    {patientLoadStatus === 'notFound' && patientMode === 'registered' && (
      <div className="text-yellow-400 mt-2">
        ❌ {tUI('patientNotFound', lang)}
      </div>
    )}

    {patientLoadStatus === 'success' && patientMode === 'registered' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tUI('fullName', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'registered'} />
        <input type="email" value={form.email || ''} disabled className="rounded px-3 py-2 bg-gray-200 text-black dark:bg-gray-700 dark:text-white cursor-not-allowed" />
        <input type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={tUI('phone', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'registered'} />
        <select value={form.sex || ''} onChange={(e) => setForm({ ...form, sex: e.target.value as 'male' | 'female' })} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'registered'}>
          <option value="">-- {tUI('selectSex', lang)} --</option>
          <option value="male">{tUI('male', lang)}</option>
          <option value="female">{tUI('female', lang)}</option>
        </select>
        <input type="number" value={form.age || ''} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} placeholder={tUI('age', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'registered'} />
        <input type="number" value={form.height || ''} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} placeholder={tUI('height', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'registered'} />
        <input type="number" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} placeholder={tUI('weight', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'registered'} />
        <select value={form.region || ''} onChange={(e) => setForm({ ...form, region: e.target.value })} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'registered'}>
          <option value="">-- {tUI('selectRegion', lang)} --</option>
          <option value="Europa">{tUI('regionEurope', lang)}</option>
          <option value="Ameryka Północna">{tUI('regionNorthAmerica', lang)}</option>
          <option value="Ameryka Południowa">{tUI('regionSouthAmerica', lang)}</option>
          <option value="Azja">{tUI('regionAsia', lang)}</option>
          <option value="Afryka">{tUI('regionAfrica', lang)}</option>
          <option value="Australia">{tUI('regionAustralia', lang)}</option>
        </select>
      </div>
    )}
  </div>

  {/* 🟣 PRAWA: Pacjent bez rejestracji */}
  <div className="flex flex-col gap-3">
    <label className="text-sm font-medium text-black dark:text-white">
      {tUI('unregisteredPatient', lang)}
    </label>
    <p className="text-xs text-yellow-500 dark:text-yellow-400">
      ⚠️ {tUI('unregisteredWarning', lang)}
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <input type="text" value={formUnregistered.name || ''} onChange={(e) => setFormUnregistered({ ...formUnregistered, name: e.target.value })} placeholder={tUI('fullName', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'unregistered'} />
      <input type="tel" value={formUnregistered.phone || ''} onChange={(e) => setFormUnregistered({ ...formUnregistered, phone: e.target.value })} placeholder={tUI('phone', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'unregistered'} />
      <select value={formUnregistered.sex || ''} onChange={(e) => setFormUnregistered({ ...formUnregistered, sex: e.target.value as 'male' | 'female' })} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'unregistered'}>
        <option value="">-- {tUI('selectSex', lang)} --</option>
        <option value="male">{tUI('male', lang)}</option>
        <option value="female">{tUI('female', lang)}</option>
      </select>
      <input type="number" value={formUnregistered.age || ''} onChange={(e) => setFormUnregistered({ ...formUnregistered, age: Number(e.target.value) })} placeholder={tUI('age', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'unregistered'} />
      <input type="number" value={formUnregistered.height || ''} onChange={(e) => setFormUnregistered({ ...formUnregistered, height: Number(e.target.value) })} placeholder={tUI('height', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'unregistered'} />
      <input type="number" value={formUnregistered.weight || ''} onChange={(e) => setFormUnregistered({ ...formUnregistered, weight: Number(e.target.value) })} placeholder={tUI('weight', lang)} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'unregistered'} />
      <select value={formUnregistered.region || ''} onChange={(e) => setFormUnregistered({ ...formUnregistered, region: e.target.value })} className="rounded px-3 py-2 bg-white text-black dark:bg-gray-800 dark:text-white" disabled={patientMode !== 'unregistered'}>
        <option value="">-- {tUI('selectRegion', lang)} --</option>
        <option value="Europa">{tUI('regionEurope', lang)}</option>
        <option value="Ameryka Północna">{tUI('regionNorthAmerica', lang)}</option>
        <option value="Ameryka Południowa">{tUI('regionSouthAmerica', lang)}</option>
        <option value="Azja">{tUI('regionAsia', lang)}</option>
        <option value="Afryka">{tUI('regionAfrica', lang)}</option>
        <option value="Australia">{tUI('regionAustralia', lang)}</option>
      </select>
    </div>
  </div>
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
      disabled={isGenerating || !confirmedDiet?.length || !dietApproved}
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
          'download',            // 👈 brakujący argument `mode`
          narrativeText,
          toPdfRecipes(recipes)
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

  {/* 🍽️ Generuj przepisy */}
  <div className="flex-1">
    <button
      type="button"
      onClick={handleGenerateRecipes}
      className="w-full h-full bg-amber-600 text-white px-4 py-3 rounded-md font-medium hover:bg-amber-700 disabled:opacity-50"
      disabled={isGenerating || recipesLoading || !mealPlan || Object.keys(mealPlan).length === 0}
    >
      {recipesLoading ? '⏳ ' : '🍽️ '}{tUI('generateRecipes', lang)}
    </button>
  </div>

{isGenerating && (
  <div className="text-sm text-gray-600 italic mt-4 animate-pulse">
    ⏳ Piszę dietę... {streamingText.length > 20 && '(czekaj, trwa generowanie)'}
  </div>
)}
{/* Podsumowanie wyborów pacjenta (z bazy) */}
{(patientChoice?.goal || patientChoice?.model || patientChoice?.cuisine) && (
  <div className="w-full mb-4">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm bg-black/20 dark:bg-white/10 rounded-md px-4 py-3">
      <span className="font-semibold">🎯 {tUI('goal', lang)}:</span>
      <span>{patientChoice?.goal ? tUI(patientChoice.goal as any, lang) : '—'}</span>

      <span className="opacity-40">|</span>

      <span className="font-semibold">🧬 {tUI('dietModel', lang)}:</span>
      <span>{patientChoice?.model ? tUI(patientChoice.model as any, lang) : '—'}</span>

      <span className="opacity-40">|</span>

      <span className="font-semibold">🌍 {tUI('cuisine', lang)}:</span>
      <span>{patientChoice?.cuisine ? tUI(patientChoice.cuisine as any, lang) : '—'}</span>
    </div>
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
        {/* Sekcja: Przepisy kulinarne */}
{Object.keys(recipes).length > 0 && (
  <PanelCard title={`🍽️ ${tUI('recipesTitle', lang)}`}>
    {Object.entries(recipes).map(([day, meals]) => (
      <div key={day} className="mb-6">
        <h3 className="text-lg font-semibold mb-3">{day}</h3>
        {Object.entries(meals).map(([mealName, r]) => (
          <div key={mealName} className="bg-black/20 dark:bg-white/10 rounded-lg p-4 mb-3">
            <div className="font-medium">
              {tUI(mealName.toLowerCase() as any, lang) || mealName}: {r.dish}
            </div>
            {!!r.time && <div className="text-sm opacity-80 mt-1">{tUI('time', lang)}: {r.time}</div>}
            {!!r.description && <div className="text-sm italic mt-1">{r.description}</div>}

            <div className="mt-3 text-sm">
              <div className="font-semibold">{tUI('ingredients', lang)}:</div>
              <ul className="list-disc ml-5">
                {(r.ingredients || []).map((ing, idx) => (
                  <li key={idx}>
                    {ing.product} — {ing.weight ?? '–'} {ing.unit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 text-sm">
              <div className="font-semibold">{tUI('steps', lang)}:</div>
              <ol className="list-decimal ml-5">
                {(r.steps || []).map((s, idx) => <li key={idx}>{s}</li>)}
              </ol>
            </div>
          </div>
        ))}
      </div>
    ))}
  </PanelCard>
)}
    </div>
  </main>
);
}

export default Panel;
