import React, { useState, useEffect } from 'react';
import { generateInterviewPdf } from '../utils/generateInterviewPdf';
import { PatientData, Meal } from '@/types';
import { LangKey, tUI } from '../utils/i18n';
import { translationsUI } from '../utils/translationsUI';

import SectionBasic from './SectionBasic';
import SectionHealth from './SectionHealth';
import SectionLifestyle from './SectionLifestyle';
import SectionFoodHabits from './SectionFoodHabits';
import SectionPreferences from './SectionPreferences';
import SectionWeightHistory from './SectionWeightHistory';
import SectionDigestion from './SectionDigestion';
import SectionMotivation from './SectionMotivation';
import SectionWomenOnly from './SectionWomenOnly';
import { MealPlanConfig } from './MealPlanConfig';
import CalculationBlock from './CalculationBlock';

interface Props {
  onChange: (data: InterviewData) => void;
  form: PatientData;
  bmi: number | null;
  editableDiet: Record<string, Meal[]>;
  lang: LangKey;
}

interface Section1BasicData { [key: string]: string; }
interface Section2HealthData { [key: string]: string; }

type Section3LifestyleData = Record<string, string>;
type Section4FoodHabitsData = Record<string, string>;
type Section5PreferencesData = Record<string, string>;
type Section6WeightHistoryData = Record<string, string>;
type Section7DigestionData = Record<string, string>;
type Section8MotivationData = Record<string, string>;
type Section9WomenOnlyData = Record<string, string>;

export interface InterviewData {
  section1: Section1BasicData;
  section2: Section2HealthData;
  section3: Section3LifestyleData;
  section4: Section4FoodHabitsData;
  section5: Section5PreferencesData;
  section6: Section6WeightHistoryData;
  section7: Section7DigestionData;
  section8: Section8MotivationData;
  section9: Section9WomenOnlyData | undefined;
  mealsPerDay: number;
  mealPlan: { name: string; time: string }[];
  model: string;
  recommendation?: string; 
}

const InterviewForm: React.FC<Props> = ({ onChange, form, bmi, editableDiet, lang }) => {
  const [data, setData] = useState<InterviewData>({
    section1: { q1_1: '', q1_2: '', q1_3: '', q1_4: '' },
    section2: { q2_1: '', q2_2: '', q2_3: '', q2_4: '' },
    section3: { q3_1: '', q3_2: '', q3_3: '', q3_4: '', q3_5: '', q3_6: '' },
    section4: { q4_1: '', q4_2: '', q4_3: '', q4_4: '', q4_5: '', q4_6: '', q4_7: '', q4_8: '', q4_9: '' },
    section5: { q5_1: '', q5_2: '', q5_3: '', q5_4: '', q5_5: '' },
    section6: { q6_1: '', q6_2: '', q6_3: '', q6_4: '', q6_5: '' },
    section7: { q7_1: '', q7_2: '', q7_3: '', q7_4: '', q7_5: '', q7_6: '', q7_7: '' },
    section8: { q8_1: '', q8_2: '', q8_3: '', q8_4: '' },
    section9: form?.sex === 'female' ? { q9_1: '', q9_2: '', q9_3: '', q9_4: '' } : undefined,
    mealsPerDay: undefined as any,
    mealPlan: [],
    model: '',
    recommendation: ''
  });

  useEffect(() => {
    if (form?.sex === 'female' && !data.section9) {
      setData(prev => ({
        ...prev,
        section9: { q9_1: '', q9_2: '', q9_3: '', q9_4: '' }
      }));
    }
  }, [form?.sex, data.section9]);

  useEffect(() => {
    const updated = { ...data };

    if (!data.mealsPerDay) {
      updated.mealsPerDay = getRecommendedMealsPerDay(form, data);
      updated.mealPlan = Array.from({ length: updated.mealsPerDay }, (_, i) => ({
        name: `Posiłek ${i + 1}`,
        time: ''
      }));
    }

    onChange(updated);
  }, [data, onChange]);

  const getRecommendedMealsPerDay = (form: PatientData, interview: InterviewData): number => {
    const conditions = form.conditions || [];
    const goal = interview.model || '';
    const bmi = form.weight && form.height ? form.weight / ((form.height / 100) ** 2) : null;

    if (conditions.some(c => ['diabetes', 'insulin', 'pcos', 'ibs', 'reflux', 'ulcer'].includes(c))) {
      return 5;
    }
    if (goal === 'gain' || goal === 'regen' || (bmi && bmi < 18.5)) {
      return 5;
    }
    if (goal === 'lose' || (bmi && bmi > 30)) {
      return 3;
    }
    return 4;
  };

  const handleFieldChange = <K extends keyof InterviewData>(
    section: K,
    key: keyof InterviewData[K],
    value: string
  ) => {
    const currentSection = data[section];
    if (typeof currentSection === 'object' && currentSection !== null && !Array.isArray(currentSection)) {
      setData(prev => ({
        ...prev,
        [section]: {
          ...currentSection,
          [key]: value
        } as InterviewData[K]
      }));
    } else {
      console.warn(`✋ Nie można zaktualizować sekcji "${String(section)}"`);
    }
  };

  const handleSection9Change = (key: keyof Section9WomenOnlyData, value: string) => {
    if (data.section9) {
      setData(prev => ({
        ...prev,
        section9: {
          ...prev.section9!,
          [key]: value
        }
      }));
    }
  };

  const t = (key: keyof typeof translationsUI): string => tUI(key, lang);

  const handleSendToPatient = () => {
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      interview: data
    };
    const history = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
    history.push(record);
    localStorage.setItem('interviewHistory', JSON.stringify(history));
    alert('📤 ' + t('sendToPatient'));
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-4 mt-6">
      <h2 className="text-xl font-bold">{t('interviewTitle')}</h2>

      <SectionBasic data={data.section1} onChange={(key, value) => handleFieldChange('section1', key, value)} lang={lang} />
      <SectionHealth data={data.section2} onChange={(key, value) => handleFieldChange('section2', key, value)} lang={lang} />
      <SectionLifestyle data={data.section3} onChange={(key, value) => handleFieldChange('section3', key, value)} lang={lang} />
      <SectionFoodHabits data={data.section4} onChange={(key, value) => handleFieldChange('section4', key, value)} lang={lang} />
      <SectionPreferences data={data.section5} onChange={(key, value) => handleFieldChange('section5', key, value)} lang={lang} />
      <SectionWeightHistory data={data.section6} onChange={(key, value) => handleFieldChange('section6', key, value)} lang={lang} />
      <SectionDigestion data={data.section7} onChange={(key, value) => handleFieldChange('section7', key, value)} lang={lang} />
      <SectionMotivation data={data.section8} onChange={(key, value) => handleFieldChange('section8', key, value)} lang={lang} />

      {form?.sex === 'female' && data.section9 && (
        <SectionWomenOnly data={data.section9} onChange={handleSection9Change} lang={lang} />
      )}

      {!data.mealsPerDay && (
        <div className="flex items-center justify-between text-sm text-gray-600 italic mb-1">
          <span className="font-semibold">
            Liczba posiłków dziennie (wymagane):
          </span>
          <span>
            💡 Sugerowana: {getRecommendedMealsPerDay(form, data)} posiłki
          </span>
        </div>
      )}

      <MealPlanConfig
        lang={lang}
        onConfigured={({ mealsPerDay, meals }) => {
          setData(prev => ({
            ...prev,
            mealsPerDay,
            mealPlan: meals
          }));
        }}
      />

      <div className="mt-4">
        <label className="block font-semibold mb-1">
          Zalecenia Lekarza / Dietetyka (opcjonalne):
        </label>
        <textarea
          value={data.recommendation || ''}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              recommendation: e.target.value
            }))
          }
          className="w-full border px-2 py-1 rounded min-h-[100px]"
          placeholder={tUI('recommendationPlaceholder', lang)}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={() => generateInterviewPdf(form, bmi, Object.values(editableDiet).flat())}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          📄 {t('pdf')}
        </button>

        <button
          onClick={handleSendToPatient}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          ✉️ {t('sendToPatient')}
        </button>
      </div>
    </div>
  );
};

export default InterviewForm;
