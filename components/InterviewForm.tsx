import React, { useState, useEffect } from 'react';
import { generateInterviewPdf } from '../utils/generateInterviewPdf';
import { PatientData, Meal } from '@/types';
import { LangKey, translations } from '../utils/i18n';

import SectionBasic from './SectionBasic';
import SectionHealth from './SectionHealth';
import SectionLifestyle from './SectionLifestyle';
import SectionFoodHabits from './SectionFoodHabits';
import SectionPreferences from './SectionPreferences';
import SectionWeightHistory from './SectionWeightHistory';
import SectionDigestion from './SectionDigestion';
import SectionMotivation from './SectionMotivation';
import SectionWomenOnly from './SectionWomenOnly';
import { MealPlanConfig } from './MealPlanConfig'; // dodaj u góry pliku

interface Props {
  onChange: (data: InterviewData) => void;
  form: PatientData;
  bmi: number | null;
  editableDiet: Record<string, Meal[]>;
  lang: LangKey;
}

// === Typy sekcji ===
interface Section1BasicData {
  [key: string]: string;
}
interface Section2HealthData {
  [key: string]: string;
}
interface Section3LifestyleData {
  activity: string;
  sleep: string;
  stress: string;
  smoking: string;
  alcohol: string;
  caffeine: string;
}
interface Section4FoodHabitsData {
  mealsPerDay: string;
  mealTimes: string;
  waterIntake: string;
  sugarCravings: string;
  fastFoodFrequency: string;
  excludedFoods: string;
}
interface Section5PreferencesData {
  likedFoods: string;
  dislikedFoods: string;
  intolerances: string;
  allergies: string;
  supplements: string;
  medications: string;
}
interface Section6WeightHistoryData {
  currentWeight: string;
  height: string;
  weightChange: string;
  weightProblems: string;
  weightLossAttempts: string;
}
interface Section7DigestionData {
  digestion: string;
  bloating: string;
  constipation: string;
  diarrhea: string;
  heartburn: string;
  other: string;
}
interface Section8MotivationData {
  motivation: string;
  barriers: string;
  supportSystem: string;
  expectations: string;
}
interface Section9WomenOnlyData {
  menstrualCycle: string;
  hormonalIssues: string;
  pregnancy: string;
  breastfeeding: string;
  contraception: string;
}

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
}


export const InterviewForm = ({ onChange, form, bmi, editableDiet, lang }: Props) => {
  const [data, setData] = useState<InterviewData>({
    section1: { '1.1': '', '1.2': '', '1.3': '', '1.4': '' },
    section2: { '2.1': '', '2.2': '', '2.3': '', '2.4': '' },
    section3: {
      activity: '',
      sleep: '',
      stress: '',
      smoking: '',
      alcohol: '',
      caffeine: ''
    },
    section4: {
      mealsPerDay: '',
      mealTimes: '',
      waterIntake: '',
      sugarCravings: '',
      fastFoodFrequency: '',
      excludedFoods: ''
    },
    section5: {
      likedFoods: '',
      dislikedFoods: '',
      intolerances: '',
      allergies: '',
      supplements: '',
      medications: ''
    },
    section6: {
      currentWeight: '',
      height: '',
      weightChange: '',
      weightProblems: '',
      weightLossAttempts: ''
    },
    section7: {
      digestion: '',
      bloating: '',
      constipation: '',
      diarrhea: '',
      heartburn: '',
      other: ''
    },
    section8: {
      motivation: '',
      barriers: '',
      supportSystem: '',
      expectations: ''
    },
    section9: form?.sex === 'female'
      ? {
          menstrualCycle: '',
          hormonalIssues: '',
          pregnancy: '',
          breastfeeding: '',
          contraception: ''
        }
         : undefined,
  mealsPerDay: 3,
  mealPlan: [
    { name: 'Śniadanie', time: '' },
    { name: 'Obiad', time: '' },
    { name: 'Kolacja', time: '' }
  ]
});

  useEffect(() => {
    if (form?.sex === 'female' && !data.section9) {
      setData(prev => ({
        ...prev,
        section9: {
          menstrualCycle: '',
          hormonalIssues: '',
          pregnancy: '',
          breastfeeding: '',
          contraception: ''
        }
      }));
    }
  }, [form?.sex, data.section9]);

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
    console.warn(`✋ Nie można zaktualizować sekcji "${String(section)}", bo nie jest to obiekt.`);
  }
};


  const handleSection9Change = (
    key: keyof Section9WomenOnlyData,
    value: string
  ) => {
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

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const t = (key: keyof typeof translations): string =>
    translations[key]?.[lang] || translations[key]?.pl || key;

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

      <SectionBasic
        data={data.section1}
        onChange={(key, value) => handleFieldChange('section1', key, value)}
        lang={lang}
      />
      <SectionHealth
        data={data.section2}
        onChange={(key, value) => handleFieldChange('section2', key, value)}
        lang={lang}
      />
      <SectionLifestyle
        data={data.section3}
        onChange={(key, value) => handleFieldChange('section3', key, value)}
        lang={lang}
      />
      <SectionFoodHabits
        data={data.section4}
        onChange={(key, value) => handleFieldChange('section4', key, value)}
        lang={lang}
      />
      <SectionPreferences
        data={data.section5}
        onChange={(key, value) => handleFieldChange('section5', key, value)}
        lang={lang}
      />
      <SectionWeightHistory
        data={data.section6}
        onChange={(key, value) => handleFieldChange('section6', key, value)}
        lang={lang}
      />
      <SectionDigestion
        data={data.section7}
        onChange={(key, value) => handleFieldChange('section7', key, value)}
        lang={lang}
      />
      <SectionMotivation
        data={data.section8}
        onChange={(key, value) => handleFieldChange('section8', key, value)}
        lang={lang}
      />
      {form?.sex === 'female' && data.section9 && (
        <SectionWomenOnly
          data={data.section9}
          onChange={handleSection9Change}
          lang={lang}
        />
      )}

<MealPlanConfig
  onConfigured={({ mealsPerDay, meals }) => {
    setData((prev) => ({
      ...prev,
      mealsPerDay,
      mealPlan: meals
    }));
  }}
/>

<div className="flex gap-4 pt-4">
  <button
    onClick={() =>
      generateInterviewPdf(form, bmi, Object.values(editableDiet).flat())
    }
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