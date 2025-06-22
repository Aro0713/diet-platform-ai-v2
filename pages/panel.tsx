// 🔁 React / Next
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import PanelCard from '@/components/PanelCard';
import { translatedTitles } from '@/utils/translatedTitles';

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
import { extractMappedInterview } from '@/utils/interviewHelpers';
import DietTable from '@/components/DietTable';
import ConfirmationModal from '@/components/ConfirmationModal';

// 📊 Typy danych
import type { Meal, PatientData, MedicalData, ConditionWithTests } from '@/types';
import type { LangKey } from '@/utils/i18n';

// 🧠 Utils – AI, walidacja, PDF
import { generateDietPdf } from '@/utils/generateDietPdf';
import { transformDietPlanToEditableFormat } from '@/utils/transformDietPlan';
import { generateInterviewPdf } from '@/utils/generateInterviewPdf';
import { validateDiet } from '@/utils/validateDiet';
import { parseMealPlanPreview } from '@/utils/parseMealPlanPreview';
import { sendToPatient } from '@/utils/sendToPatient';

// 🌍 Tłumaczenia
import { getTranslation, tUI, languageLabels } from '@/utils/i18n';
import { translations } from '@/utils/translations';
import { translationsUI } from '@/utils/translationsUI';


function Panel() {
  const [lang, setLang] = useState<LangKey>('pl');
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
const [medicalData, setMedicalData] = useState<any>(null);

const handleMedicalChange = (data: {
  selectedGroups: string[];
  selectedConditions: string[];
  testResults: { [testName: string]: string };
  medicalSummary?: string;
  structuredOutput?: any;
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

if (data.structuredOutput || data.medicalSummary) {
  setMedicalData({
    summary: data.medicalSummary ?? '',
    json: data.structuredOutput ?? null
  });
}
};

  const handleDietSave = (meals: Meal[]) => {
    const errors = validateDiet(meals);
    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      setConfirmedDiet(meals);
      setDietApproved(true);
    }
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
const tryParseJSON = (raw: string, strict = true): Record<string, any> => {
  try {
    let cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^\s*AI\s*[:\-]?\s*/gi, '')
      .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1 || start >= end) {
      console.warn('⛔ Brak nawiasów klamrowych:', cleaned.slice(0, 200));
      throw new Error('Nie można sparsować odpowiedzi AI – brak nawiasów.');
    }

    cleaned = cleaned.substring(start, end + 1);

    const opens = [...cleaned.matchAll(/{/g)].length;
    const closes = [...cleaned.matchAll(/}/g)].length;

    if (strict && opens !== closes) {
      const diff = opens - closes;
      if (diff > 0) {
        console.warn(`⚠️ Brakuje ${diff} zamykających nawiasów – uzupełniam.`);
        cleaned += '}'.repeat(diff);
      } else {
        console.warn(`⚠️ Zbyt dużo zamykających nawiasów – obcinam ${-diff}.`);
        cleaned = cleaned.slice(0, cleaned.length + diff);
      }
    }

    const parsed = JSON.parse(cleaned);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Odpowiedź nie jest obiektem JSON');
    }

    return parsed as Record<string, any>;
  } catch (err) {
    console.error('❌ JSON.parse() failed:', err);
    throw new Error('Nie można sparsować odpowiedzi AI.');
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
  setStreamingText('');
  setDietApproved(false);
  
  if (!medicalData) {
  alert('⚠️ Musisz zatwierdzić analizę wyników badań przed wygenerowaniem diety.');
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

    console.log("📦 RAW AI TEXT:", rawText);
    const parsed = tryParseJSON(rawCompleteText);
    console.log("✅ Parsed JSON:", parsed);

    if (!parsed) throw new Error('Nie można sparsować odpowiedzi AI.');

    const mapDaysToPolish: Record<string, string> = {
      Monday: 'Poniedziałek',
      Tuesday: 'Wtorek',
      Wednesday: 'Środa',
      Thursday: 'Czwartek',
      Friday: 'Piątek',
      Saturday: 'Sobota',
      Sunday: 'Niedziela',
    };

    // ✅ 1. Parser oparty na dietPlan
    if (parsed.dietPlan && typeof parsed.dietPlan === 'object') {
      const transformed = transformDietPlanToEditableFormat(parsed.dietPlan, lang);
      console.log('📤 FINAL editableDiet sent to table:', transformed);
      setMealPlan(transformed);
      setDiet(transformed);
      setEditableDiet(transformed);
      return;
    }

    // ✅ 2. Parser oparty na weekPlan
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
      console.log('📤 FINAL editableDiet sent to table:', converted);
      setMealPlan(converted);
      setDiet(converted);
      setEditableDiet(converted);
      return;
    }

    // ✅ 3. Parser oparty na mealPlan (array of days)
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
      console.log('📤 FINAL editableDiet sent to table:', converted);
      setMealPlan(converted);
      setDiet(converted);
      setEditableDiet(converted);
      return;
    }

    // ❌ brak żadnej rozpoznawalnej struktury
    throw new Error('Brak poprawnego planu posiłków w odpowiedzi AI (mealPlan, week_plan, dietPlan lub weekPlan)');
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
  <div
  className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed py-10 px-4"
  style={{
    backgroundImage: "url('/background.jpg')",
    backgroundSize: 'cover',
  }}
>


{/* Pasek z nagłówkiem i przełącznikiem */}
  <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
    <div className="flex flex-col">
  {userData && userData.name && (
    <span className="text-sm font-medium text-gray-800 dark:text-white">
      {/* Tytuł naukowy */}
      {userData.title &&
        translatedTitles[userData.title as 'dr' | 'drhab' | 'prof']?.[lang] && (
          <>{translatedTitles[userData.title as 'dr' | 'drhab' | 'prof'][lang]} </>
        )}

      {/* Imię i nazwisko */}
      {userData.name}

      {/* Rola */}
      {userData.role &&
        translationsUI[userData.role as 'doctor' | 'dietitian']?.[lang] && (
          <> – {translationsUI[userData.role as 'doctor' | 'dietitian'][lang]}</>
        )}
    </span>
    )}

    <h1 className="text-2xl font-bold text-gray-800">
      {tUI('doctorPanelTitle', lang)}
    </h1>
  </div>
  <LangAndThemeToggle />
</div>


    {/* Główna zawartość */}
    <div className="z-10 flex flex-col w-full max-w-[1400px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20 dark:text-white transition-colors">

      {/* Sekcja 1: Dane pacjenta */}
      <PanelCard>
        <PatientPanelSection form={form} setForm={setForm} lang={lang} />
      </PanelCard>

      {/* Sekcja 2: Dane medyczne */}
      <PanelCard className="z-30">
        <MedicalForm
        onChange={handleMedicalChange}
        onUpdateMedical={(summary) => {
          setMedicalData((prev: any) => ({
            ...prev,
            summary
          }));
        }}
        lang={lang}
      />
      </PanelCard>

      {/* Sekcja 3: Wywiad pacjenta */}
      <PanelCard title={`🧠 ${tUI('interviewTitle', lang)}`}>
      <InterviewWizard
        form={form}
        lang={lang}
        onFinish={(data) => {
          setInterviewData(data);
          setForm((prev) => ({
            ...prev,
            stressLevel: data.stressLevel,
            sleepQuality: data.sleepQuality,
            physicalActivity: data.physicalActivity,
            mealsPerDay: data.mealsPerDay,
          }));
        }}
      />
      </PanelCard>
    {/* Sekcja 3.1: Rekomendacje lekarza i liczba posiłków */}
    <PanelCard className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Zalecenia lekarza */}
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

          {/* Liczba posiłków */}
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

      {/* Sekcja 4: Cel diety, model i kuchnia */}
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

     {/* Sekcja 6: Przyciski akcji */}
<PanelCard title={tUI('actions', lang)} className="mt-2">
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

    {/* 🔵 Generuj dietę */}
    <button
      type="button"
      onClick={handleSubmit}
      className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
      disabled={isGenerating}
    >
      {isGenerating ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⚙️</span>
          {tUI('writingDiet', lang)}
        </span>
      ) : tUI('generate', lang)}
    </button>

  {/* 🟣 Zatwierdź dietę */}
<button
  type="button"
  className="w-full bg-purple-700 text-white px-4 py-3 rounded-md font-medium hover:bg-purple-800 disabled:opacity-50"
  onClick={() => setDietApproved(true)}
  disabled={isGenerating || !confirmedDiet}
>
  {isGenerating ? '⏳ Czekaj...' : `✅ ${tUI('approvedDiet', lang)}`}
</button>

{/* ✅ Pobierz PDF */}
<button
  type="button"
  className="w-full bg-green-700 text-white px-4 py-3 rounded-md font-medium hover:bg-green-800 disabled:opacity-50"
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
  'download' // ✅ to jest poprawny 9. argument
);

    } catch (e) {
      alert('❌ Błąd przy generowaniu PDF');
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  }}
>
  {isGenerating ? '⏳ Generowanie...' : `📄 ${tUI('pdf', lang)}`}
</button>


{/* 📤 Wyślij pacjentowi */}
<button
  type="button"
  className="w-full bg-blue-500 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-600 disabled:opacity-50"
  disabled={isGenerating || !confirmedDiet || !dietApproved || !form.email}
  onClick={async () => {
    try {
      setIsGenerating(true);
      const pdfMake = (await import('pdfmake/build/pdfmake')).default;
      const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
      pdfMake.vfs = pdfFonts.vfs;

      const { generateDietPdf } = await import('@/utils/generateDietPdf');
      const docDefinition = await generateDietPdf(
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
        }
      );

      const formattedDate = new Date().toISOString().slice(0, 10);
      const safeName = form.name?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "pacjent";
      const filename = `dieta_${safeName}_${formattedDate}.pdf`;

      pdfMake.createPdf(docDefinition).getBlob(async (blob: Blob) => {
        const success = await sendToPatient(form.email, blob, lang, filename);
        if (success) {
          alert('📤 Dieta została wysłana pacjentowi!');
        } else {
          alert('❌ Wysyłka nie powiodła się. Sprawdź adres e-mail lub połączenie.');
        }
      });
    } catch (err) {
      console.error(err);
      alert('❌ Błąd podczas wysyłania diety.');
    } finally {
      setIsGenerating(false);
    }
  }}
>
  {isGenerating ? '⏳ Wysyłanie...' : `📤 ${tUI('sendToPatient', lang)}`}
</button>

  </div>

  {/* Pasek ładowania */}
  {isGenerating && (
    <div className="text-sm text-gray-600 italic mt-4 animate-pulse">
      ⏳ Piszę dietę... {streamingText.length > 20 && '(czekaj, trwa generowanie)'}
    </div>
  )}
</PanelCard>

      {/* Sekcja 7: Tabela z dietą */}
      {editableDiet && Object.keys(editableDiet).length > 0 && (
        <PanelCard>
          <DietTable
            editableDiet={editableDiet}
            setEditableDiet={setEditableDiet}
            setConfirmedDiet={(dietByDay) => {
              const mealsWithDays = Object.entries(dietByDay).flatMap(([day, meals]) =>
                meals.map((meal) => ({ ...meal, day }))
              );
              handleDietSave(mealsWithDays);
            }}
            isEditable={!dietApproved}
            lang={lang}
            notes={notes}
            setNotes={setNotes}
          />
        </PanelCard>
      )}
    </div>
  </div>
  
);
}
export default Panel;
