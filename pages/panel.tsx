// 🔁 React / Next
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// 🔌 Supabase
import { supabase } from '@/lib/supabaseClient';

// 🧩 Komponenty - główne bloki UI
import PatientPanelSection from '@/components/PatientPanelSection';
import PatientDataForm from '@/components/PatientDataForm'; // 
import MedicalForm from '@/components/MedicalForm';
import SelectConditionForm from '@/components/SelectConditionForm';
import InterviewWizard from '@/components/InterviewWizard'; 
import DietGoalForm from '@/components/DietGoalForm';
import SelectCuisineForm from '@/components/SelectCuisineForm';
import SelectModelForm from '@/components/SelectModelForm';
import CalculationBlock from '@/components/CalculationBlock';
import DietTable from '@/components/DietTable';
import ConfirmationModal from '@/components/ConfirmationModal';

// 📊 Typy danych
import type { Meal, PatientData, MedicalData, ConditionWithTests } from '@/types';
import type { LangKey } from '@/utils/i18n';

// 🧠 Utils – AI, walidacja, PDF
import { generateDietPdf } from '@/utils/generateDietPdf';
import { generateInterviewPdf } from '@/utils/generateInterviewPdf';
import { validateDiet } from '@/utils/validateDiet';
import { parseMealPlanPreview } from '@/utils/parseMealPlanPreview';

// 🌍 Tłumaczenia
import { getTranslation, tUI, languageLabels } from '@/utils/i18n';
import { translations } from '@/utils/translations';
import { translationsUI } from '@/utils/translationsUI';

function Panel() {
  const [lang, setLang] = useState<LangKey>('pl');
  const [userData, setUserData] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<Record<string, Meal[]>>({});

  const t = (key: keyof typeof translationsUI): string =>
  tUI(key, lang);


  const [diet, setDiet] = useState<Record<string, Meal[]> | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [confirmedDiet, setConfirmedDiet] = useState<Meal[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [editableDiet, setEditableDiet] = useState<Record<string, Meal[]>>({});
  const [bmi, setBmi] = useState<number | null>(null);
  const [form, setForm] = useState<PatientData>({
    name: '',
    age: 0,
    sex: 'female',
    weight: 0,
    height: 0,
    allergies: '',
    region: '',
    goal: '',
    cuisine: '',
    model: '',
    phone: '',
    email: '',
    conditions: [],
    medical: []
  });

  const [interviewData, setInterviewData] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [submitPending, setSubmitPending] = useState<(() => void) | null>(null);
  const [dietApproved, setDietApproved] = useState(false);

  const router = useRouter();
  useEffect(() => {
  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUserData(data);
      setForm((prev) => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        region: data.jurisdiction || '',
      }));
    }

    if (error) console.error('Błąd pobierania danych użytkownika:', error.message);
  };

  fetchUserData();
}, []);

  const mapSex = (s: string): 'female' | 'male' =>
    s.toLowerCase().startsWith('k') ? 'female' : 'male';

  useEffect(() => {
    const savedLang = localStorage.getItem('platformLang') as LangKey;
    if (savedLang) setLang(savedLang);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

const handleMedicalChange = (data: {
  selectedGroups: string[];
  selectedConditions: string[];
  testResults: { [testName: string]: string };
}) => {
  const convertedMedical = data.selectedConditions.map((condition) => ({
    condition,
    tests: Object.entries(data.testResults).map(([name, value]) => ({ name, value }))
  }));

  setForm((prev) => ({
    ...prev,
    conditionGroups: data.selectedGroups,
    conditions: data.selectedConditions,
    testResults: data.testResults,
    medical: convertedMedical,
  }));
};


  const handleDietSave = (meals: Meal[]) => {
    const errors = validateDiet(meals);
    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      setConfirmedDiet(meals);
      setDietApproved(true);
    }
  };

  const dayMap = {
    Monday: 'Poniedzia�ek',
    Tuesday: 'Wtorek',
    Wednesday: '�roda',
    Thursday: 'Czwartek',
    Friday: 'Pi�tek',
    Saturday: 'Sobota',
    Sunday: 'Niedziela'
  };

  const mapDaysToPolish: Record<string, string> = {
  Monday: 'Poniedziałek',
  Tuesday: 'Wtorek',
  Wednesday: 'Środa',
  Thursday: 'Czwartek',
  Friday: 'Piątek',
  Saturday: 'Sobota',
  Sunday: 'Niedziela',
};

const normalizeDiet = (raw: any): Record<string, Meal[]> => {
  const result: Record<string, Meal[]> = {};
  const data = raw.dietPlan || raw.weekPlan;

  if (!data) {
    throw new Error('Brak dietPlan ani weekPlan w odpowiedzi AI');
  }

  for (const dayKey in data) {
    const translatedDay = mapDaysToPolish[dayKey] || dayKey;
    const mealsForDay = data[dayKey];

    result[translatedDay] = Object.entries(mealsForDay).map(([mealName, mealData]: any) => ({
      name: mealName,
      description: mealData.menu || '',
      ingredients: [],
      calories: mealData.kcal || 0,
      glycemicIndex: 0,
      time: mealData.time || '',
    }));
  }

  return result;
};


const getRecommendedMealsPerDay = (form: PatientData, interviewData: any): number => {
  const conditions = form.conditions || [];
  const goal = interviewData.goal || '';
  const bmi = form.weight && form.height
    ? form.weight / ((form.height / 100) ** 2)
    : null;

  // Cukrzyca, insulinooporno��, wrzody, PCOS, refluks, IBS � 5 posi�k�w
  if (
    conditions.some(c =>
      ['diabetes', 'insulin', 'pcos', 'ibs', 'reflux', 'ulcer'].includes(c)
    )
  ) {
    return 5;
  }

  // Regeneracyjne, przyrost masy, niedowaga � 5�6
  if (goal === 'gain' || goal === 'regen' || (bmi && bmi < 18.5)) {
    return 5;
  }

  // Redukcja lub siedz�cy tryb �ycia � 3
  if (goal === 'lose' || (bmi && bmi > 30)) {
    return 3;
  }

  // Domy�lnie � 4
  return 4;
};
const tryParseJSON = (raw: string): any | null => {
  try {
  let cleaned = raw
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/^\s*AI\s*[:\-]?\s*/gi, '')
    .replace(/\r?\n/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || start >= end) {
    console.warn('⚠️ Nie znaleziono poprawnych nawiasów w JSON:', cleaned);
    return null;
  }

  cleaned = cleaned.slice(start, end + 1);

  // 🔍 Wstępna walidacja przed parsowaniem
  if (
    !(cleaned.startsWith('{') && cleaned.endsWith('}')) &&
    !(cleaned.startsWith('[') && cleaned.endsWith(']'))
  ) {
    console.warn('⚠️ Nie wygląda na poprawny JSON:', cleaned);
    return null;
  }

  console.log('? Cleaned JSON:', cleaned);
  return JSON.parse(cleaned);
} catch (err) {
  console.error('❌ Błąd parsowania JSON:', err, '\nŹródło:', raw);
  return null;
}
};
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const mapDaysToPolish: Record<string, string> = {
    Monday: 'Poniedziałek',
    Tuesday: 'Wtorek',
    Wednesday: 'Środa',
    Thursday: 'Czwartek',
    Friday: 'Piątek',
    Saturday: 'Sobota',
    Sunday: 'Niedziela',
  };

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
      body: JSON.stringify({ form, interviewData, lang, goalExplanation, recommendation })
    });

    if (!res.body) throw new Error('Brak treści w odpowiedzi serwera.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let rawText = '';
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunk = decoder.decode(value, { stream: true });
      rawText += chunk;
      setStreamingText(rawText);

      try {
        const partial = tryParseJSON(rawText);
        if (partial) {
          const preview = parseMealPlanPreview(partial);
          setEditableDiet(preview);
        }
      } catch {
        // ignorujemy błędy parsowania częściowego
      }
    }

    console.log("📦 RAW AI TEXT:", rawText);
    let parsed = tryParseJSON(rawText);
    console.log("✅ Parsed JSON:", parsed);

    if (!parsed) throw new Error('Nie można sparsować odpowiedzi AI.');

    const converted: Record<string, Meal[]> = {};
    const sourcePlan = parsed.mealPlan || parsed.week_plan;

    if (sourcePlan && Array.isArray(sourcePlan)) {
      for (const entry of sourcePlan) {
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
    } else if (parsed.dietPlan && typeof parsed.dietPlan === 'object') {
      for (const [day, mealsObj] of Object.entries(parsed.dietPlan)) {
        const meals: Meal[] = Object.entries(mealsObj as any).map(
          ([name, meal]: [string, any]) => ({
            name,
            description: meal.menu || '',
            ingredients: [],
            calories: meal.kcal || 0,
            glycemicIndex: meal.glycemicIndex || 0,
            time: meal.time || ''
          })
        );
        converted[mapDaysToPolish[day] || day] = meals;
      }
    } else if (parsed.weekPlan && Array.isArray(parsed.weekPlan)) {
      for (const { day, meals } of parsed.weekPlan) {
        converted[mapDaysToPolish[day] || day] = meals.map((meal: any) => ({
          name: meal.name || '',
          description: meal.menu || '',
          ingredients: [],
          calories: meal.kcal || 0,
          glycemicIndex: meal.glycemicIndex || 0,
          time: meal.time || ''
        }));
      }
    } else {
      throw new Error('Brak poprawnego planu posiłków w odpowiedzi AI (mealPlan, week_plan, dietPlan lub weekPlan)');
    }

    setMealPlan(converted);
    setDiet(converted);
    setEditableDiet(converted);

    console.log("📤 FINAL editableDiet sent to table:", converted);
  } catch (err) {
    console.error('❌ Błąd główny:', err);
    alert('Wystąpił błąd przy generowaniu diety.');
  } finally {
    setIsGenerating(false);
  }
};

const handleSendToPatient = () => {
  alert('?? Dieta zosta�a wys�ana pacjentowi (symulacja).');
};
const [notes, setNotes] = useState<Record<string, string>>({});

const handleCalculationResult = ({ suggestedModel, ...rest }: any) => {
  setInterviewData((prev: any) => ({
    ...prev,
    ...rest,
    model: suggestedModel,
  }));
};
return (
  <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat backdrop-blur-sm py-10 px-4">
    <h1 className="text-2xl font-bold text-center mb-6">
      {tUI('doctorPanelTitle', lang)}
    </h1>

    <div className="flex flex-col w-full max-w-[1400px] mx-auto gap-6 bg-white/90 rounded-xl shadow-lg p-8 backdrop-blur-sm">

      {/* Sekcja 1: Dane pacjenta */}
      <PatientPanelSection form={form} setForm={setForm} lang={lang} />

      {/* Sekcja 2: Dane medyczne */}
      <MedicalForm onChange={handleMedicalChange} lang={lang} />

 
      {/* Sekcja 3: Wywiad pacjenta */}
      <div className="bg-white/90 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="text-xl">🧠</span> {tUI('interviewTitle', lang)}
        </h3>
        <InterviewWizard
          form={form}
          onFinish={(data) => setInterviewData(data)}
          lang={lang}
        />
      </div>


      {/* Sekcja 4: Cel diety, model i kuchnia */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-start">

  {/* 🎯 Cel diety */}
  <div className="bg-white rounded-md shadow-sm p-3 flex flex-col h-full">
    <h3 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <span className="text-xl">🎯</span> {tUI('goal', lang)}
    </h3>
    <DietGoalForm
      onChange={(goal) => setInterviewData({ ...interviewData, goal })}
      lang={lang}
    />
  </div>

  {/* 🍽️ Model diety */}
  <div className="bg-white rounded-md shadow-sm p-3 flex flex-col h-full">
    <h3 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <span className="text-xl">🍽️</span> {tUI('model', lang)}
    </h3>
    <SelectModelForm
      onChange={(model) => setInterviewData({ ...interviewData, model })}
      lang={lang}
    />
  </div>

  {/* 🌍 Kuchnia świata */}
  <div className="bg-white rounded-md shadow-sm p-3 flex flex-col h-full">
    <h3 className="text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <span className="text-xl">🌍</span> {tUI('cuisine', lang)}
    </h3>
    <SelectCuisineForm
      onChange={(cuisine) => setInterviewData({ ...interviewData, cuisine })}
      lang={lang}
    />
  </div>

</div>

              {/* 🔢 Sekcja 5: Kalkulator*/}
    <div className="bg-white/90 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span> {tUI('calculator', lang)}
      </h3>

      <CalculationBlock
        form={form}
        interview={interviewData}
        lang={lang}
        onResult={handleCalculationResult}
      />
    </div>


      {/* Sekcja 6: Przyciski akcji */}
      <div className="bg-white/90 rounded-lg shadow-md p-6 mt-2">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="text-xl">⚙️</span> {tUI('actions', lang)}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            disabled={isGenerating}
          >
            {isGenerating ? tUI('writingDiet', lang) : tUI('generate', lang)}
          </button>

          <button
            type="button"
            className="w-full bg-purple-700 text-white px-4 py-3 rounded-md font-medium hover:bg-purple-800 disabled:opacity-50"
            onClick={() => setDietApproved(true)}
            disabled={isGenerating || !confirmedDiet}
          >
            {isGenerating ? '⏳ Czekaj...' : `✅ ${tUI('approvedDiet', lang)}`}
          </button>

          <button
            type="button"
            className="w-full bg-green-700 text-white px-4 py-3 rounded-md font-medium hover:bg-green-800 disabled:opacity-50"
            onClick={() => {
              if (isGenerating) {
                alert('⏳ Dieta nie została jeszcze w pełni wygenerowana.');
                return;
              }
              if (!confirmedDiet) {
                alert('❗ Najpierw zatwierdź dietę, zanim pobierzesz PDF.');
                return;
              }
              generateDietPdf(form, bmi, confirmedDiet, dietApproved, notes);
            }}
            disabled={isGenerating || !confirmedDiet}
          >
            {isGenerating ? '⏳ Czekaj...' : `📄 ${tUI('pdf', lang)}`}
          </button>

          <button
            type="button"
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-600 disabled:opacity-50"
            onClick={handleSendToPatient}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Czekaj...' : `📤 ${tUI('sendToPatient', lang)}`}
          </button>
        </div>

        {/* Pasek ładowania */}
        {isGenerating && (
          <div className="text-sm text-gray-600 italic mt-4 animate-pulse">
            ⏳ Piszę dietę... {streamingText.length > 20 && '(czekaj, trwa generowanie)'}
          </div>
        )}
      </div>
            
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
        {JSON.stringify(Object.keys(editableDiet), null, 2)}
      </pre>

      {/* Sekcja 7: Tabela z dietą */}
      {editableDiet && Object.keys(editableDiet).length > 0 && (
        <div className="mt-6">
          <DietTable
            editableDiet={editableDiet}
            setEditableDiet={setEditableDiet}
            setConfirmedDiet={(diet) => {
              handleDietSave(Object.values(diet).flat());
            }}
            isEditable={!dietApproved}
            lang={lang}
            notes={notes}
            setNotes={setNotes}
          />
        </div>
      )}

    </div>
  </div>
);

}
export default Panel;