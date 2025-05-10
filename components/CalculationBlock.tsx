import React, { useState, useEffect } from 'react';
import { LangKey } from '../utils/i18n';

interface Props {
  weight: number;
  height: number;
  age: number;
  sex: 'female' | 'male';
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
    goal: 'maintain' | 'reduce' | 'gain';
  }) => void;
}

const palOptions = [
  { value: 1.3, label: { pl: '1.3 – pacjent leżący w łóżku', en: '1.3 – bedridden', ua: '1.3 – лежачий' } },
  { value: 1.4, label: { pl: '1.4 – niska aktywność', en: '1.4 – low activity', ua: '1.4 – низька активність' } },
  { value: 1.6, label: { pl: '1.6 – umiarkowana aktywność', en: '1.6 – moderate', ua: '1.6 – помірна активність' } },
  { value: 1.75, label: { pl: '1.75 – aktywny tryb życia', en: '1.75 – active', ua: '1.75 – активний' } },
  { value: 2.0, label: { pl: '2.0 – bardzo aktywny', en: '2.0 – very active', ua: '2.0 – дуже активний' } }
];

const goalLabels = {
  maintain: { pl: 'Utrzymanie masy', en: 'Maintain weight', ua: 'Підтримка ваги' },
  reduce: { pl: 'Redukcja masy', en: 'Weight loss', ua: 'Схуднення' },
  gain: { pl: 'Zwiększenie masy', en: 'Weight gain', ua: 'Набір ваги' }
};

export default function CalculationBlock({ weight, height, age, sex, lang, onResult }: Props) {
  const [pal, setPal] = useState(1.6);
  const [goal, setGoal] = useState<'maintain' | 'reduce' | 'gain'>('maintain');

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

  useEffect(() => {
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
      goal
    });
  }, [weight, height, age, sex, pal, goal]);

  type LocalLang = 'pl' | 'en' | 'ua';
  const t = (dict: Record<LocalLang, string>) => dict[lang as LocalLang] ?? dict.pl;

  return (
    <div className="bg-white/80 border rounded-xl shadow-md px-8 py-6 text-sm w-full max-w-[1400px] mx-auto">
      <h3 className="text-base font-semibold text-gray-800 mb-4">⚙️ Obliczenia</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700 items-start">
        {/* Sekcja 1 – BMI, PPM, PAL, CPM */}
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
          </div>
          <div><span className="font-medium">CPM:</span> {Math.round(cpm)} kcal</div>
        </div>

        {/* Sekcja 2 – NMC */}
        <div className="space-y-1">
          <div><span className="font-medium">NMC (Broca):</span> {nmcBroca.toFixed(1)} kg</div>
          <div><span className="font-medium">NMC (Lorentz):</span> {nmcLorentz.toFixed(1)} kg</div>
        </div>

        {/* Sekcja 3 – Cel */}
        <div className="space-y-1">
          <div className="font-semibold mb-1">🎯 Cel diety</div>
          <div className="flex flex-col gap-1">
            {(['maintain', 'reduce', 'gain'] as const).map(k => (
              <label key={k} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="goal"
                  value={k}
                  checked={goal === k}
                  onChange={() => setGoal(k)}
                />
                {t(goalLabels[k])}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
