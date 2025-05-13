import React, { useState, useEffect } from 'react';
import { LangKey } from '../utils/i18n';
import { PatientData, InterviewData } from '../types';
type LocalLang = LangKey;

interface Props {
  form: PatientData;
  interview: InterviewData;
  lang: LangKey;
  onResult: (data: {
    bmi: number;
    ppm: number;
    cpm: number;
    pal: number;
    kcalMaintain: number;
    kcalReduce: number;
    kcalGain: number;
    nmcBroca: number;
    nmcLorentz: number;
    suggestedModel: string;
  }) => void;
}

const palOptions = [
  {
    value: 1.3,
    label: {
      pl: '1.3 – pacjent leżący w łóżku',
      en: '1.3 – bedridden',
      es: '1.3 – postrado en cama',
      fr: '1.3 – alité',
      de: '1.3 – bettlägerig',
      ua: '1.3 – лежачий',
      ru: '1.3 – прикован к постели',
      zh: '1.3 – 卧床不起',
      hi: '1.3 – बिस्तर पर निर्भर',
      ar: '1.3 – طريح الفراش',
      he: '1.3 – מרותק למיטה'
    }
  },
  {
    value: 1.4,
    label: {
      pl: '1.4 – niska aktywność',
      en: '1.4 – low activity',
      es: '1.4 – actividad baja',
      fr: '1.4 – faible activité',
      de: '1.4 – geringe Aktivität',
      ua: '1.4 – низька активність',
      ru: '1.4 – низкая активность',
      zh: '1.4 – 低活动量',
      hi: '1.4 – कम सक्रियता',
      ar: '1.4 – نشاط منخفض',
      he: '1.4 – פעילות נמוכה'
    }
  },
  {
    value: 1.6,
    label: {
      pl: '1.6 – umiarkowana aktywność',
      en: '1.6 – moderate activity',
      es: '1.6 – actividad moderada',
      fr: '1.6 – activité modérée',
      de: '1.6 – mäßige Aktivität',
      ua: '1.6 – помірна активність',
      ru: '1.6 – умеренная активность',
      zh: '1.6 – 中等活动量',
      hi: '1.6 – मध्यम सक्रियता',
      ar: '1.6 – نشاط معتدل',
      he: '1.6 – פעילות מתונה'
    }
  },
  {
    value: 1.75,
    label: {
      pl: '1.75 – aktywny tryb życia',
      en: '1.75 – active lifestyle',
      es: '1.75 – estilo de vida activo',
      fr: '1.75 – mode de vie actif',
      de: '1.75 – aktiver Lebensstil',
      ua: '1.75 – активний спосіб життя',
      ru: '1.75 – активный образ жизни',
      zh: '1.75 – 活跃生活方式',
      hi: '1.75 – सक्रिय जीवनशैली',
      ar: '1.75 – نمط حياة نشط',
      he: '1.75 – אורח חיים פעיל'
    }
  },
  {
    value: 2.0,
    label: {
      pl: '2.0 – bardzo aktywny',
      en: '2.0 – very active',
      es: '2.0 – muy activo',
      fr: '2.0 – très actif',
      de: '2.0 – sehr aktiv',
      ua: '2.0 – дуже активний',
      ru: '2.0 – очень активный',
      zh: '2.0 – 高活动量',
      hi: '2.0 – बहुत सक्रिय',
      ar: '2.0 – نشيط جدًا',
      he: '2.0 – פעיל מאוד'
    }
  }
];

const activityToPAL: Record<string, number> = {
  'leżący': 1.3,
  'siedząca': 1.4,
  'umiarkowana': 1.6,
  'aktywny': 1.75,
  'bardzo aktywny': 2.0
};

const inferPALFromInterview = (section3: Record<string, string>): number => {
  const all = Object.values(section3).join(' ').toLowerCase();

  if (all.includes('bardzo aktywny') || all.includes('codzienna aktywność') || all.includes('intensywny')) return 2.0;
  if (all.includes('aktywny') || all.includes('ćwiczenia') || all.includes('3 razy')) return 1.75;
  if (all.includes('umiarkowana') || all.includes('rekreacja')) return 1.6;
  if (all.includes('siedząca') || all.includes('biuro') || all.includes('mało')) return 1.4;
  return 1.3; // domyślnie
};

export default function CalculationBlock({ form, interview, lang, onResult }: Props) {
  const [pal, setPal] = useState(1.6);
  const [autoPAL, setAutoPAL] = useState<number | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const mealCount = interview.mealsPerDay;

  const { weight, height, age, sex } = form;
  const bmi = weight / Math.pow(height / 100, 2);
  const ppm = 10 * weight + 6.25 * height - 5 * age - (sex === 'female' ? 161 : 5);
  const cpm = ppm * pal;
  const kcalMaintain = cpm;
  const kcalReduce = cpm * 0.8;
  const kcalGain = cpm * 1.2;
  const nmcBroca = sex === 'female' ? (height - 100) * 0.85 : height - 100;
  const nmcLorentz = sex === 'female'
    ? height - 100 - (height - 150) / 2
    : height - 100 - (height - 150) / 4;

  // Automatyczne przypisanie PAL na podstawie wywiadu
  useEffect(() => {
    if (interview.section3) {
      const inferred = inferPALFromInterview(interview.section3);
      setPal(inferred);
      setAutoPAL(inferred);
    }
  }, [interview.section3]);

  useEffect(() => {
    let hint = '';
    let suggestedModel = '';

    if (pal <= 1.4 && cpm > 2600) {
      hint = '⚠️ Wysokie CPM przy niskiej aktywności – rozważ redukcję kalorii.';
      suggestedModel = 'lowcal';
    } else if (bmi > 30 && ppm < 1300) {
      hint = '⚠️ Wysoki BMI i niskie PPM – możliwa niska masa mięśniowa. Warto rozważyć zwiększenie białka i aktywności.';
      suggestedModel = 'high-protein';
    } else if (mealCount && mealCount < 3) {
      hint = '❗ Pacjent spożywa mniej niż 3 posiłki dziennie – może to obniżać skuteczność diety.';
    } else if (interview.section8?.q8_4?.toLowerCase().includes('redukcja') && cpm > 2700) {
      hint = '🔥 CPM wysokie przy celu redukcji – zalecany model o obniżonej kaloryczności.';
      suggestedModel = 'lowcal';
    } else if (bmi < 18.5) {
      hint = '🔺 Niedowaga – rozważ dietę wysokokaloryczną z dodatkiem zdrowych tłuszczów.';
      suggestedModel = 'highcal';
    }

    setInterpretation(hint);

    onResult({
      bmi: Math.round(bmi * 10) / 10,
      ppm: Math.round(ppm),
      cpm: Math.round(cpm),
      pal,
      kcalMaintain: Math.round(kcalMaintain),
      kcalReduce: Math.round(kcalReduce),
      kcalGain: Math.round(kcalGain),
      nmcBroca: Math.round(nmcBroca * 10) / 10,
      nmcLorentz: Math.round(nmcLorentz * 10) / 10,
      suggestedModel
    });
  }, [bmi, ppm, cpm, pal, kcalMaintain, kcalReduce, kcalGain, nmcBroca, nmcLorentz, onResult]);

  const t = (dict: Record<LocalLang, string>) => dict[lang as LocalLang] ?? dict.pl;

  const physicalActivity = interview.section3?.q3_1 || '';
  const sleepQuality = interview.section3?.q3_2 || '';
  const stressLevel = interview.section3?.q3_3 || '';

  return (
    <div className="bg-white/80 border rounded-xl shadow-md px-8 py-6 text-sm w-full max-w-[1400px] mx-auto">
      <h3 className="text-base font-semibold text-gray-800 mb-4">⚙️ Obliczenia</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700 items-start">
        <div className="space-y-1">
          <div><span className="font-medium">BMI:</span> {isNaN(bmi) ? '-' : bmi.toFixed(1)}</div>
          <div><span className="font-medium">PPM:</span> {Math.round(ppm)} kcal</div>
          <div className="flex items-center gap-2">
            <span className="font-medium">PAL:</span>
            <select
              value={pal}
              onChange={(e) => setPal(parseFloat(e.target.value))}
              className="border px-2 py-1 rounded bg-white text-sm"
            >
              {palOptions.map(p => (
                <option key={p.value} value={p.value}>{t(p.label)}</option>
              ))}
            </select>
            {autoPAL && pal === autoPAL && (
              <span className="text-xs italic text-gray-500">
                (z wywiadu)
              </span>
            )}
          </div>
          <div><span className="font-medium">CPM:</span> {Math.round(cpm)} kcal</div>
        </div>

        <div className="space-y-1">
          <div><span className="font-medium">NMC (Broca):</span> {nmcBroca.toFixed(1)} kg</div>
          <div><span className="font-medium">NMC (Lorentz):</span> {nmcLorentz.toFixed(1)} kg</div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="font-semibold mb-1">📋 Dane z wywiadu</div>
          <div><strong>Aktywność fizyczna:</strong> {physicalActivity}</div>
          <div><strong>Sen:</strong> {sleepQuality}</div>
          <div><strong>Stres:</strong> {stressLevel}</div>
          <div><strong>Liczba posiłków:</strong> {mealCount}</div>
        </div>
      </div>

      {interpretation && (
        <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded">
          {interpretation}
        </div>
      )}
    </div>
  );
}
