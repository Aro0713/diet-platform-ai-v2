import Head from 'next/head'
import { useState, useEffect } from 'react'
import DietEditor from '../components/DietEditor'
import MedicalForm from '../components/MedicalForm'
import { InterviewForm } from '../components/InterviewForm';
import SelectCuisineForm from '../components/SelectCuisineForm'
import DietGoalForm from '../components/DietGoalForm'
import SelectModelForm from '../components/SelectModelForm'
import { generateDietPdf } from '../utils/generateDietPdf'
import { Meal, PatientData } from '../types'
import { validateDiet } from '../utils/validateDiet'
import fallbackDiets from '../utils/fallbackDiets'
import { useRouter } from 'next/router'
import { getTranslation, translations } from '../utils/i18n';
import { generateInterviewPdf } from '../utils/generateInterviewPdf'
import ConfirmationModal from '@/components/ConfirmationModal'
import DietTable from '@/components/DietTable'
import { MedicalData } from '../types'
import { ConditionWithTests } from '../types'
import CalculationBlock from '../components/CalculationBlock';
import { languageLabels } from '../utils/i18n';
import { tUI } from '../utils/i18n';
import type { LangKey } from '../utils/i18n';


function Panel() {
  const [lang, setLang] = useState<LangKey>('pl');

  const t = (key: keyof typeof translations): string => {
    return getTranslation(translations, key, lang);
  };

  const [diet, setDiet] = useState<Record<string, Meal[]> | null>(null)
  const [streamingText, setStreamingText] = useState('');
  const [confirmedDiet, setConfirmedDiet] = useState<Meal[] | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({})
  const [editableDiet, setEditableDiet] = useState<Record<string, Meal[]>>({})
  const [bmi, setBmi] = useState<number | null>(null)
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
  })

  const [interviewData, setInterviewData] = useState<any>({})
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [drafts, setDrafts] = useState<any[]>([])
  const [showDrafts, setShowDrafts] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [submitPending, setSubmitPending] = useState<(() => void) | null>(null)
  const [dietApproved, setDietApproved] = useState(false)

  const router = useRouter()
  
  const mapSex = (s: string): 'female' | 'male' =>
    s.toLowerCase().startsWith('k') ? 'female' : 'male';
  
  useEffect(() => {
    const savedLang = localStorage.getItem('platformLang') as LangKey;
    if (savedLang) setLang(savedLang);
  }, []);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMedicalChange = (data: any) => {
    const testResults: Record<string, string> = {}
    const selectedGroups: string[] = []

    if (!Array.isArray(data)) return

    for (const entry of data) {
      if (entry?.condition) {
        selectedGroups.push(entry.condition)
      }

      if (Array.isArray(entry?.tests)) {
        for (const test of entry.tests) {
          if (test?.name && typeof test.value === 'string') {
            testResults[test.name] = test.value
          }
        }
      }
    }

    const convertedMedical: ConditionWithTests[] = selectedGroups.map((condition) => ({
      condition,
      tests: Object.entries(testResults).map(([name, value]) => ({ name, value }))
    }))

    setForm((prev) => ({
      ...prev,
      medical: convertedMedical,
      conditions: selectedGroups
    }))
  }

  const handleDietSave = (meals: Meal[]) => {
    const errors = validateDiet(meals)
    setValidationErrors(errors)
    if (Object.keys(errors).length === 0) {
      setConfirmedDiet(meals)
      setDietApproved(true)
    }
  }

  const dayMap = {
    Monday: 'Poniedziałek',
    Tuesday: 'Wtorek',
    Wednesday: 'Środa',
    Thursday: 'Czwartek',
    Friday: 'Piątek',
    Saturday: 'Sobota',
    Sunday: 'Niedziela'
  }

  const mapDaysToPolish = (diet: Record<string, Meal[]>): Record<string, Meal[]> => {
    const translated: Record<string, Meal[]> = {}
    for (const day in diet) {
      const translatedDay = dayMap[day as keyof typeof dayMap] || day
      translated[translatedDay] = diet[day]
    }
    return translated
  }

  const normalizeDiet = (diet: Record<string, Meal[]>): Record<string, Meal[]> => {
  const result: Record<string, Meal[]> = {};
  const defaultMeal: Meal = {
    name: '',
    ingredients: [],
    calories: 0,
    glycemicIndex: 0,
    description: ''
  };

  const mealsPerDay = interviewData.mealsPerDay || 3;

  for (const day in diet) {
    const dayMeals = Array.isArray(diet[day]) ? diet[day] : [];

    const meals = [...dayMeals.slice(0, mealsPerDay)];
    while (meals.length < mealsPerDay) {
      meals.push({ ...defaultMeal });
    }

    result[day] = meals;
  }

  return result;
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
    const res = await fetch('/api/generate-diet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, interviewData, lang })
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
    }

    console.log('🔍 rawText z GPT:', rawText);

try {
  // Usuń markdown, nowe linie, spacje i niepotrzebne znaki
  let cleaned = rawText
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/\r?\n/g, '')
    .trim();

  // Znajdź pierwszą i ostatnią klamrę JSON
  const startIndex = cleaned.indexOf('{');
  const endIndex = cleaned.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Brak nawiasów JSON w odpowiedzi GPT');
  }

  // Wytnij czysty obiekt JSON
  cleaned = cleaned.slice(startIndex, endIndex + 1);
  console.log('✅ Cleaned JSON:', cleaned);

  const parsed = JSON.parse(cleaned);

  // Konwersja obiektu: { Monday: { Śniadanie: "...", ... } } → { Monday: Meal[] }
  const converted = Object.fromEntries(
    Object.entries(parsed).map(([day, mealsObj]) => {
      const meals: Meal[] = Object.entries(mealsObj as Record<string, string>).map(
        ([name, description]) => ({
          name,
          description,
          ingredients: [{ product: description, weight: 0 }],
          calories: 0,
          glycemicIndex: 0
        })
      );
      return [day, meals];
    })
  );

  const translatedDiet = mapDaysToPolish(converted);
  const normalizedDiet = normalizeDiet(translatedDiet);

  setDiet(normalizedDiet);
  setEditableDiet(normalizedDiet);
} catch (err) {
  console.error('❌ Błąd parsowania JSON:', err);
  alert('Błąd przy analizie odpowiedzi AI. Odpowiedź nie jest prawidłowym JSON-em.');
}

  } catch (err: any) {
    console.error('❌ Błąd generowania diety (frontend):', err.message || err);
    alert('Wystąpił błąd podczas generowania diety. Spróbuj ponownie.');
  } finally {
    setIsGenerating(false);
  }
};

  const handleSendToPatient = () => {
    alert('?? Dieta została wysłana pacjentowi (symulacja).')
  }

 return (
  <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat backdrop-blur-sm">
    <Head>
      <title>Diet Care Platform – Panel Lekarza</title>
    </Head>

    <ConfirmationModal
      open={showConfirmModal}
      onCancel={() => setShowConfirmModal(false)}
      missingFields={missingFields}
      onConfirm={() => {
        setShowConfirmModal(false);
        submitPending?.();
      }}
    />

    {/* Język interfejsu */}
    <div className="mb-6 p-4">
      <label className="block font-semibold mb-1">{tUI('selectLanguage', lang)}:</label>

      <select
        className="border px-2 py-1 rounded w-full max-w-xs"
        value={lang}
        onChange={(e) => {
          const selected = e.target.value as LangKey;
          setLang(selected);
          localStorage.setItem('platformLang', selected);
        }}
      >
        <option value="pl">Polski</option>
        <option value="en">English</option>
        <option value="ua">Українська</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
        <option value="ru">Русский</option>
        <option value="zh">中文</option>
        <option value="hi">हिन्दी</option>
        <option value="ar">العربية</option>
        <option value="he">עברית</option>
      </select>
    </div>

    {/* Główna sekcja – dwie kolumny */}
    <div className="flex flex-col md:flex-row w-full max-w-[1400px] mx-auto gap-6 px-4">
      {/* Kolumna 1 – dane pacjenta */}
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

        <div>
          <label className="block mb-1">{tUI('region', lang)}</label>
          <select
            name="region"
            className="w-full border px-2 py-1"
            value={form.region}
            onChange={handleChange}
            required
          >
            <option value="">{`-- ${tUI('selectRegion', lang)} --`}</option>
            <option value="Europa Środkowa">Europa Środkowa</option>
            <option value="Europa Północna">Europa Północna</option>
            <option value="Europa Południowa">Europa Południowa</option>
            <option value="Azja Wschodnia">Azja Wschodnia</option>
            <option value="Azja Południowa">Azja Południowa</option>
            <option value="Ameryka Północna">Ameryka Północna</option>
            <option value="Ameryka Południowa">Ameryka Południowa</option>
            <option value="Afryka Subsaharyjska">Afryka Subsaharyjska</option>
            <option value="Bliski Wschód">Bliski Wschód</option>
            <option value="Regiony polarne">Regiony polarne</option>
          </select>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">{tUI('medicalData', lang)}</h2>
          <MedicalForm onChange={handleMedicalChange} />
        </div>

        <div className="mt-6">
          <DietGoalForm
            onChange={(goal) => setInterviewData({ ...interviewData, goal })}
            lang={lang}
          />
        </div>

        <div className="mt-4">
          <SelectModelForm onChange={(model) => setInterviewData({ ...interviewData, model })} lang={lang} />
        </div>

        <div className="mt-4">
          <SelectCuisineForm onChange={(cuisine) => setInterviewData({ ...interviewData, cuisine })} lang={lang} />
        </div>
      </form>

      {/* Kolumna 2 – wywiad */}
      <div className="w-full md:w-1/2 max-h-[90vh] overflow-y-auto space-y-6 pr-2">
        <InterviewForm
          onChange={(data) => setInterviewData({ ...interviewData, ...data })}
          form={form}
          bmi={bmi}
          editableDiet={editableDiet}
          lang={lang}
        />
      </div>
    </div>

    {/* Sekcja kalkulatorów – pełna szerokość */}
    <div className="w-full px-4 mt-6">
  <CalculationBlock
    weight={form.weight}
    height={form.height}
    age={form.age}
    sex={mapSex(form.sex)}
    lang={lang}
    onResult={(data) => setInterviewData({ ...interviewData, ...data })}
  />
</div> 


    {/* Przyciski */}
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
        className="flex-1 bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
        onClick={() => setDietApproved(true)}
        disabled={!confirmedDiet}
      >
        ✅ {tUI('approvedDiet', lang)}
      </button>

      <button
        type="button"
        className="flex-1 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
        onClick={() => generateDietPdf(form, bmi, confirmedDiet || [], dietApproved)}
        disabled={!confirmedDiet}
      >
        🧾 {tUI('pdf', lang)}
      </button>

      <button
        type="button"
        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleSendToPatient}
      >
        📤 {tUI('sendToPatient', lang)}
      </button>
    </div>

{isGenerating && (
  <div className="w-full px-8 mt-4 text-sm text-gray-600 italic animate-pulse">
    ✍️ Piszę dietę... {streamingText.length > 20 && ' (czekaj, trwa generowanie)'}
  </div>
)}

    {/* Tabela diety */}
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
);
}
export default Panel;
