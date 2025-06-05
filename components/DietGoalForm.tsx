import React, { useState } from 'react';
import PanelCard from './PanelCard';
import { LangKey, tUI } from '../utils/i18n';

interface Props {
  onChange: (value: string) => void;
  lang: LangKey;
}

const goalOptions: {
  label: Record<LangKey, string>;
  title: Record<LangKey, string>;
  groups: Record<string, Record<LangKey, string>>;
} = {
  label: {
    pl: 'Wybierz cel diety:',
    en: 'Select a diet goal:',
    de: 'Wähle ein Diätziel:',
    ua: 'Оберіть ціль дієти',
    ru: 'Выберите цель диеты:',
    es: 'Selecciona un objetivo dietético:',
    fr: 'Choisissez un objectif diététique :',
    zh: '选择饮食目标：',
    hi: 'आहार लक्ष्य चुनें:',
    ar: 'اختر هدف النظام الغذائي:',
    he: 'בחר מטרה תזונתית:',
  },
  title: {
    pl: 'Cel diety',
    en: 'Diet goal',
    de: 'Diätziel',
    ua: 'Ціль дієти',
    ru: 'Цель диеты',
    es: 'Objetivo dietético',
    fr: 'Objectif diététique',
    zh: '饮食目标',
    hi: 'आहार लक्ष्य',
    ar: 'هدف النظام الغذائي',
    he: 'מטרת תזונה',
  },
  groups: {
    lose: {
      pl: 'Odchudzające (redukcyjne)',
      en: 'Weight loss',
      de: 'Gewichtsabnahme',
      ua: 'Схуднення',
      ru: 'Похудение',
      es: 'Pérdida de peso',
      fr: 'Perte de poids',
      zh: '减重',
      hi: 'वजन घटाना',
      ar: 'فقدان الوزن',
      he: 'ירידה במשקל',
    },
    gain: {
      pl: 'Na masę',
      en: 'Muscle gain',
      de: 'Masseaufbau',
      ua: "Нарощування м'язів",
      ru: 'Набор массы',
      es: 'Aumento de masa muscular',
      fr: 'Prise de masse musculaire',
      zh: '增肌',
      hi: 'मांसपेशियों की वृद्धि',
      ar: 'زيادة الكتلة العضلية',
      he: 'עלייה במסת שריר',
    },
    maintain: {
      pl: 'Stabilizujące wagę',
      en: 'Weight maintenance',
      de: 'Gewicht halten',
      ua: 'Підтримка ваги',
      ru: 'Поддержание веса',
      es: 'Mantenimiento del peso',
      fr: 'Maintien du poids',
      zh: '维持体重',
      hi: 'वजन बनाए रखना',
      ar: 'الحفاظ على الوزن',
      he: 'שמירה על משקל',
    },
    detox: {
      pl: 'Detoksykacyjne / oczyszczające',
      en: 'Detox / cleansing',
      de: 'Entgiftung',
      ua: 'Детокс / очищення',
      ru: 'Детокс / очищение',
      es: 'Desintoxicación / limpieza',
      fr: 'Détox / nettoyage',
      zh: '排毒 / 清洁',
      hi: 'डिटॉक्स / सफाई',
      ar: 'إزالة السموم / تطهير',
      he: 'ניקוי רעלים',
    },
    regen: {
      pl: 'Regeneracyjne',
      en: 'Regenerative',
      de: 'Regenerierend',
      ua: 'Відновлювальні',
      ru: 'Восстановительные',
      es: 'Regenerativo',
      fr: 'Régénératif',
      zh: '恢复性',
      hi: 'पुनर्जनन',
      ar: 'تجديدي',
      he: 'משקם',
    },
    liver: {
      pl: 'Poprawa pracy wątroby',
      en: 'Liver support',
      de: 'Leberunterstützung',
      ua: 'Підтримка печінки',
      ru: 'Поддержка печени',
      es: 'Apoyo hepático',
      fr: 'Soutien du foie',
      zh: '肝脏支持',
      hi: 'लीवर समर्थन',
      ar: 'دعم الكبد',
      he: 'תמיכה בכבד',
    },
    kidney: {
      pl: 'Poprawa pracy nerek',
      en: 'Kidney support',
      de: 'Nierenunterstützung',
      ua: 'Підтримка нирок',
      ru: 'Поддержка почек',
      es: 'Apoyo renal',
      fr: 'Soutien des reins',
      zh: '肾脏支持',
      hi: 'किडनी समर्थन',
      ar: 'دعم الكلى',
      he: 'תמיכה בכליות',
    },
  },
};

export default function DietGoalForm({ onChange, lang }: Props) {
  const [selected, setSelected] = useState('');

  const tTitle = goalOptions.title[lang] || goalOptions.title.pl;
  const tLabel = goalOptions.label[lang] || goalOptions.label.pl;

  return (
    <PanelCard title={`🎯 ${tTitle}`} className="h-full">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-black dark:text-white">{tLabel}</label>
        <select
          className="w-full rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            onChange(e.target.value);
          }}
        >
          <option value="">{`-- ${tLabel} --`}</option>
          {Object.entries(goalOptions.groups).map(([key, labels]) => (
            <option key={key} value={key}>
              {labels[lang] || labels.pl}
            </option>
          ))}
        </select>
      </div>
    </PanelCard>
  );
}
