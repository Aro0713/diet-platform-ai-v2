'use client';

import React, { useEffect, useState } from "react";
import PanelCard from './PanelCard';
import { tUI, LangKey } from "@/utils/i18n";
import { PatientData } from "@/types";
import { activityLevels } from '@/utils/translations/activityLevels';
import { calculationBlock } from '@/utils/translations/calculationBlock';

interface Props {
  form: PatientData;
  interview: Record<string, string>; // poprawiony typ
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

const isValid = (n: any): n is number => typeof n === "number" && !isNaN(n) && n > 0;

const tCalc = (key: keyof typeof calculationBlock, lang: LangKey): string =>
  calculationBlock[key]?.[lang] || calculationBlock[key]?.pl || `[${key}]`;
const extractMappedInterview = (interview: Record<string, string>) => {
  const result: Record<string, string> = {};

  // 🔹 Aktywność fizyczna (step2_q1 = Czy aktywny, step2_q2 = Jaka aktywność)
  result.q1 = interview.step2_q1 || '';
  result.q2 = interview.step2_q2 || '';

  // 🔹 Jakość snu – section2 → q14 (czyli step1_q14)
  result.q7 = interview.step1_q14 || '';

  // 🔹 Poziom stresu – section2 → q13 (czyli step1_q13)
  result.q8 = interview.step1_q13 || '';

  // 🔹 Liczba posiłków – step9_mealsPerDay
  result.mealsPerDay = interview.step9_mealsPerDay || '';

  return result;
};

export default function CalculationBlock({ form, interview, lang, onResult }: Props) {
  const [pal, setPal] = useState(1.6);
  const [autoPAL, setAutoPAL] = useState<number | null>(null);
  const [interpretation, setInterpretation] = useState("");

  const { weight, height, age, sex } = form;
  const mealCount = interview.mealsPerDay;

  const bmi = isValid(weight) && isValid(height) ? weight / Math.pow(height / 100, 2) : null;
  const ppm = isValid(weight) && isValid(height) && isValid(age) && sex
    ? 10 * weight + 6.25 * height - 5 * age - (sex === "female" ? 161 : 5)
    : null;
  const cpm = isValid(ppm) ? ppm * pal : null;
  const kcalMaintain = isValid(cpm) ? cpm : null;
  const kcalReduce = isValid(cpm) ? cpm * 0.8 : null;
  const kcalGain = isValid(cpm) ? cpm * 1.2 : null;
  const nmcBroca = isValid(height) ? (sex === "female" ? (height - 100) * 0.85 : height - 100) : null;
  const nmcLorentz = isValid(height)
    ? sex === "female"
      ? height - 100 - (height - 150) / 2
      : height - 100 - (height - 150) / 4
    : null;

 useEffect(() => {
  const raw = interview.q1?.toLowerCase?.() || '';

  const inferred =
    raw.includes("brak") || raw.includes("nie podejmuję") || raw.includes("0") || raw.includes("1") ? 1.3 :
    raw.includes("siedząc") || raw.includes("niska") || raw.includes("2") ? 1.4 :
    raw.includes("umiarkowan") || raw.includes("3") || raw.includes("4") ? 1.6 :
    raw.includes("aktywn") || raw.includes("5") || raw.includes("6") ? 1.75 :
    raw.includes("bardzo") || raw.includes("7") || raw.includes("8") ? 2.0 :
    1.3;

  setPal(inferred);
  setAutoPAL(inferred);
}, [interview.q1]);


 useEffect(() => {
  let hint = "";
  let suggestedModel = "";

  const mealCountNum = Number(mealCount); // 🟢 konwersja na number

  if (pal <= 1.4 && isValid(cpm) && cpm > 2600) {
    hint = tCalc('alertHighCPMLowPAL', lang);
    suggestedModel = "lowcal";
  } else if (isValid(bmi) && isValid(ppm) && bmi > 30 && ppm < 1300) {
    hint = "⚠️ Wysoki BMI i niskie PPM – możliwa niska masa mięśniowa.";
    suggestedModel = "high-protein";
  } else if (mealCountNum && mealCountNum < 3) {
    hint = "❗ Pacjent spożywa mniej niż 3 posiłki dziennie – możliwe problemy z utrzymaniem sytości.";
  } else if (interview.q8_4?.toLowerCase().includes("redukcja") && isValid(cpm) && cpm > 2700) {
    hint = "🔥 CPM wysokie przy celu redukcji – zalecany model niskokaloryczny.";
    suggestedModel = "lowcal";
  } else if (isValid(bmi) && bmi < 18.5) {
    hint = "🔺 Niedowaga – rozważ dietę wysokokaloryczną.";
    suggestedModel = "highcal";
  }

  setInterpretation(hint);

  if (typeof onResult === "function") {
    onResult({
      bmi: isValid(bmi) ? Math.round(bmi * 10) / 10 : 0,
      ppm: isValid(ppm) ? Math.round(ppm) : 0,
      cpm: isValid(cpm) ? Math.round(cpm) : 0,
      pal,
      kcalMaintain: isValid(kcalMaintain) ? Math.round(kcalMaintain) : 0,
      kcalReduce: isValid(kcalReduce) ? Math.round(kcalReduce) : 0,
      kcalGain: isValid(kcalGain) ? Math.round(kcalGain) : 0,
      nmcBroca: isValid(nmcBroca) ? Math.round(nmcBroca * 10) / 10 : 0,
      nmcLorentz: isValid(nmcLorentz) ? Math.round(nmcLorentz * 10) / 10 : 0,
      suggestedModel,
    });
  }
}, [
  bmi,
  ppm,
  cpm,
  pal,
  kcalMaintain,
  kcalReduce,
  kcalGain,
  nmcBroca,
  nmcLorentz,
  mealCount,
  lang,
  interview.q8_4
]);

  return (
 <PanelCard title={`🧮 ${tUI('calculator', lang)}`} className="h-full">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start text-sm">
      <div className="space-y-1">
        <div><span className="font-medium">{tCalc('bmi', lang)}:</span> {isValid(bmi) ? bmi.toFixed(1) : tUI('noData', lang)}</div>
        <div><span className="font-medium">{tCalc('ppm', lang)}:</span> {isValid(ppm) ? `${Math.round(ppm)} kcal` : tUI('noData', lang)}</div>
        <div className="flex items-center gap-2">
          <span className="font-medium">PAL:</span>
          <select
            value={pal}
            onChange={(e) => setPal(parseFloat(e.target.value))}
            className="border px-2 py-1 rounded bg-white text-black text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            {Object.entries(activityLevels).map(([value, label]) => (
              <option key={value} value={value}>
                {label[lang]}
              </option>
            ))}
          </select>
          {autoPAL && pal === autoPAL && (
            <span className="text-xs italic text-gray-400">(z wywiadu)</span>
          )}
        </div>
        <div><span className="font-medium">{tCalc('cpm', lang)}:</span> {isValid(cpm) ? `${Math.round(cpm)} kcal` : tUI('noData', lang)}</div>
      </div>

      <div className="space-y-1">
        <div><span className="font-medium">{tCalc('broca', lang)}:</span> {isValid(nmcBroca) ? `${nmcBroca.toFixed(1)} kg` : tUI('noData', lang)}</div>
        <div><span className="font-medium">{tCalc('lorentz', lang)}:</span> {isValid(nmcLorentz) ? `${nmcLorentz.toFixed(1)} kg` : tUI('noData', lang)}</div>
      </div>

      <div className="space-y-1 text-xs">
        <div>
          <strong>{tUI('physicalActivity', lang)}:</strong>{' '}
          {interview.q1 === 'Tak'
            ? interview.q2 || tUI('yes', lang)
            : interview.q1 || <span className="text-red-500">{tUI('noData', lang)}</span>}
        </div>

        <div>
          <strong>{tUI('sleepQuality', lang)}:</strong>{' '}
          {interview.q7
            ? interview.q7
            : <span className="text-blue-400">{tUI('noData', lang)}</span>}
        </div>

        <div>
          <strong>{tUI('stressLevel', lang)}:</strong>{' '}
          {interview.q8
            ? interview.q8
            : <span className="text-red-500">{tUI('noData', lang)}</span>}
        </div>

        <div>
          <strong>{tUI('mealCount', lang)}:</strong> {mealCount ?? tUI('noData', lang)}
        </div>
      </div>
    </div>

    {interpretation && (
      <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded dark:bg-yellow-200 dark:border-yellow-500 dark:text-black">
        {interpretation}
      </div>
    )}
  </PanelCard>
);
}
