// Next.js & React
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Komponenty
import DietEditor from '../components/DietEditor';
import MedicalForm from '../components/MedicalForm';
import InterviewForm from '../components/InterviewForm';
import SelectCuisineForm from '../components/SelectCuisineForm';
import DietGoalForm from '../components/DietGoalForm';
import SelectModelForm from '../components/SelectModelForm';
import CalculationBlock from '../components/CalculationBlock';
import ConfirmationModal from '@/components/ConfirmationModal';
import DietTable from '@/components/DietTable';

// Typy
import type { Meal, PatientData, MedicalData, ConditionWithTests } from '../types';
import type { LangKey } from '../utils/i18n';

// Utils – funkcje
import { generateDietPdf } from '../utils/generateDietPdf';
import { generateInterviewPdf } from '../utils/generateInterviewPdf';
import { validateDiet } from '../utils/validateDiet';
import { parseMealPlanPreview } from '../utils/parseMealPlanPreview';

// Utils – tłumaczenia
import { getTranslation, tUI, languageLabels } from '../utils/i18n';
import { translations } from '../utils/translations';
import { translationsUI } from '../utils/translationsUI';

// Dane zapasowe
import fallbackDiets from '../utils/fallbackDiets';


function Panel() {
  const [lang, setLang] = useState<LangKey>('pl');
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

  const handleMedicalChange = (data: any) => {
    const testResults: Record<string, string> = {};
    const selectedGroups: string[] = [];

    if (!Array.isArray(data)) return;

    for (const entry of data) {
      if (entry?.condition) {
        selectedGroups.push(entry.condition);
      }

      if (Array.isArray(entry?.tests)) {
        for (const test of entry.tests) {
          if (test?.name && typeof test.value === 'string') {
            testResults[test.name] = test.value;
          }
        }
      }
    }

    const convertedMedical: ConditionWithTests[] = selectedGroups.map((condition) => ({
      condition,
      tests: Object.entries(testResults).map(([name, value]) => ({ name, value }))
    }));

    setForm((prev) => ({
      ...prev,
      medical: convertedMedical,
      conditions: selectedGroups
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
    Monday: 'Poniedziałek',
    Tuesday: 'Wtorek',
    Wednesday: 'Środa',
    Thursday: 'Czwartek',
    Friday: 'Piątek',
    Saturday: 'Sobota',
    Sunday: 'Niedziela'
  };

  const mapDaysToPolish = (diet: Record<string, Meal[]>): Record<string, Meal[]> => {
    const translated: Record<string, Meal[]> = {};
    for (const day in diet) {
      const translatedDay = dayMap[day as keyof typeof dayMap] || day;
      translated[translatedDay] = diet[day];
    }
    return translated;
  };

  const normalizeDiet = (diet: Record<string, Meal[]>): Record<string, Meal[]> => {
    const result: Record<string, Meal[]> = {};
    const defaultMeal: Meal = {
      name: '',
      ingredients: [],
      calories: 0,
      glycemicIndex: 0,
      description: ''
    };

    for (const day in diet) {
      const dayMeals = Array.isArray(diet[day]) ? diet[day] : [];
      const expectedMeals = interviewData.mealsPerDay || dayMeals.length;
      const meals: Meal[] = [...dayMeals];

      while (meals.length < expectedMeals) {
        meals.push({ ...defaultMeal });
      }

      result[day] = meals;
    }

    return result;
  };
const getRecommendedMealsPerDay = (form: PatientData, interviewData: any): number => {
  const conditions = form.conditions || [];
  const goal = interviewData.goal || '';
  const bmi = form.weight && form.height
    ? form.weight / ((form.height / 100) ** 2)
    : null;

  // Cukrzyca, insulinooporność, wrzody, PCOS, refluks, IBS – 5 posiłków
  if (
    conditions.some(c =>
      ['diabetes', 'insulin', 'pcos', 'ibs', 'reflux', 'ulcer'].includes(c)
    )
  ) {
    return 5;
  }

  // Regeneracyjne, przyrost masy, niedowaga – 5–6
  if (goal === 'gain' || goal === 'regen' || (bmi && bmi < 18.5)) {
    return 5;
  }

  // Redukcja lub siedzący tryb życia – 3
  if (goal === 'lose' || (bmi && bmi > 30)) {
    return 3;
  }

  // Domyślnie – 4
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
    if (start === -1 || end === -1) return null;

    cleaned = cleaned.slice(start, end + 1);
    console.log('✅ Cleaned JSON:', cleaned);
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
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
        // Ignorujemy błędy parsowania częściowego
      }
    }

    // Parsowanie końcowej odpowiedzi
    let parsed = tryParseJSON(rawText);
    if (!parsed) throw new Error('Nie można sparsować odpowiedzi AI.');

    const converted: Record<string, Meal[]> = {};
    const sourcePlan = parsed.mealPlan || parsed.week_plan;

    if (sourcePlan && Array.isArray(sourcePlan)) {
      for (const entry of sourcePlan) {
        const { day, meals } = entry;
        converted[day] = meals.map((m: any) => ({
          name: '',
          description: m.description,
          ingredients: [],
          calories: 0,
          glycemicIndex: 0
        }));
      }
    } else if (parsed.dietPlan && typeof parsed.dietPlan === 'object') {
      for (const [day, mealsObj] of Object.entries(parsed.dietPlan)) {
        const meals: Meal[] = Object.entries(mealsObj as any).map(
          ([name, meal]: [string, any]) => ({
            name,
            description: meal.menu,
            ingredients: [],
            calories: 0,
            glycemicIndex: 0
          })
        );
        converted[day] = meals;
      }
    } else {
      throw new Error('Brak poprawnego planu posiłków w odpowiedzi AI (mealPlan, week_plan lub dietPlan)');
    }

    setMealPlan(converted);
    setDiet(converted);
    setEditableDiet(converted);

  } catch (err) {
    console.error('❌ Błąd główny:', err);
    alert('Wystąpił błąd przy generowaniu diety.');
  }
};

const handleSendToPatient = () => {
  alert('📤 Dieta została wysłana pacjentowi (symulacja).');
};
   return (
    <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat backdrop-blur-sm p-4">
      {/* Główna sekcja – dwie kolumny */}
      <div className="flex flex-col md:flex-row w-full max-w-[1400px] mx-auto gap-6 px-4">
        {/* Kolumna 1 – dane medyczne pacjenta */}
        <form onSubmit={handleSubmit} className="w-full md:w-1/2 space-y-4">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-sm text-gray-600">{t('subtitle')}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">{t('age')}</label>
              <input name="age" type="number" className="w-full border px-2 py-1" onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1">{t('sex')}</label>
              <select name="sex" className="w-full border px-2 py-1" onChange={handleChange} required>
                <option value="">{t('sex')}</option>
                <option value="Kobieta">{t('female')}</option>
                <option value="Mężczyzna">{t('male')}</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">{t('weight')}</label>
              <input name="weight" type="number" className="w-full border px-2 py-1" onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1">{t('height')}</label>
              <input name="height" type="number" className="w-full border px-2 py-1" onChange={handleChange} required />
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold">{tUI('medicalData', lang)}</h2>
            <MedicalForm onChange={handleMedicalChange} lang={lang} />
          </div>
        </form>
S

        {/* Kolumna 2 – wywiad pacjenta */}
        <div className="w-full md:w-1/2 max-h-[90vh] overflow-y-auto space-y-6 pr-2">
          <InterviewForm
            onChange={(data) => setInterviewData({ ...interviewData, ...data })}
            form={form}
            bmi={bmi}
            editableDiet={editableDiet}
            lang={lang}
          />

          <div className="mt-2">
            <DietGoalForm
              onChange={(goal) => setInterviewData({ ...interviewData, goal })}
              lang={lang}
            />
          </div>

          <div className="mt-4">
            <SelectModelForm
              onChange={(model) => setInterviewData({ ...interviewData, model })}
              lang={lang}
            />
          </div>

          <div className="mt-4">
            <SelectCuisineForm
              onChange={(cuisine) => setInterviewData({ ...interviewData, cuisine })}
              lang={lang}
            />
          </div>
        </div>
      </div>

      {/* Sekcja kalkulatora + przyciski i tabela */}
      <div className="w-full px-4 mt-6">
        <CalculationBlock
          form={form}
          interview={interviewData}
          lang={lang}
          onResult={({ suggestedModel, ...rest }) => {
            setInterviewData((prev: any) => ({
              ...prev,
              ...rest,
              model: suggestedModel,
            }));
          }}
        />

        <div className="w-full flex flex-wrap justify-between gap-4 px-8 mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={isGenerating}
          >
            {isGenerating ? '✍️ Piszę dietę...' : tUI('generate', lang)}
          </button>

          <button
            type="button"
            className="flex-1 bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800 disabled:opacity-50"
            onClick={() => setDietApproved(true)}
            disabled={isGenerating || !confirmedDiet}
          >
            {isGenerating ? '🔒 Czekaj...' : `✅ ${tUI('approvedDiet', lang)}`}
          </button>

          <button
            type="button"
            className="flex-1 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 disabled:opacity-50"
            onClick={() => {
              if (isGenerating) {
                alert('⏳ Dieta nie została jeszcze w pełni wygenerowana. Poczekaj na zakończenie.');
                return;
              }
              if (!confirmedDiet) {
                alert('⚠️ Najpierw zatwierdź dietę, zanim pobierzesz PDF.');
                return;
              }
              generateDietPdf(form, bmi, confirmedDiet, dietApproved);
            }}
            disabled={isGenerating || !confirmedDiet}
          >
            {isGenerating ? '🔒 Czekaj...' : `🧾 ${tUI('pdf', lang)}`}
          </button>

          <button
            type="button"
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={handleSendToPatient}
            disabled={isGenerating}
          >
            {isGenerating ? '🔒 Czekaj...' : `📤 ${tUI('sendToPatient', lang)}`}
          </button>
        </div>

        {isGenerating && (
          <div className="w-full px-8 mt-4 text-sm text-gray-600 italic animate-pulse">
            ✍️ Piszę dietę... {streamingText.length > 20 && ' (czekaj, trwa generowanie)'}
          </div>
        )}

                {diet && (
          <div className="w-full px-8 mt-10">
            <DietTable
              editableDiet={editableDiet}
              setEditableDiet={setEditableDiet}
              setConfirmedDiet={(diet) => {
                handleDietSave(Object.values(diet).flat());
              }}
              isEditable={!dietApproved}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Panel;
