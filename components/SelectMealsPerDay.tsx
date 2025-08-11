import React from 'react';
import { LangKey, tUI } from '../utils/i18n';
import PanelCard from './PanelCard';

interface Props {
  value: number;
  onChange: (value: number) => void;
  lang: LangKey;
}

const mealsPerDayTitle: Record<LangKey, string> = {
  pl: 'Liczba posiłków dziennie',
  en: 'Number of meals per day',
  ua: 'Кількість прийомів їжі на день',
  es: 'Número de comidas por día',
  fr: 'Nombre de repas par jour',
  de: 'Anzahl der Mahlzeiten pro Tag',
  ru: 'Количество приёмов пищи в день',
  zh: '每日餐次',
  hi: 'प्रति दिन भोजन की संख्या',
  ar: 'عدد الوجبات يومياً',
  he: 'מספר הארוחות ביום',
};

const options = [2, 3, 4, 5, 6];

export default function SelectMealsPerDayForm({ value, onChange, lang }: Props) {
  const label = tUI('selectMealsPerDay', lang); // analogicznie do selectCuisine
  const title = mealsPerDayTitle[lang] || mealsPerDayTitle.pl;

  return (
    <PanelCard title={`🍽️ ${title}`} className="h-full">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-black dark:text-white">
          {label}
        </label>

        <select
          className="w-full rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          <option value={0}>{`-- ${label} --`}</option>
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </PanelCard>
  );
}
