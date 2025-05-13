import React, { useState } from 'react';
import SelectDietGoalForm from './SelectDietGoalForm';
import { LangKey } from '../utils/translations';

interface Props {
  onChange: (value: string) => void;
  lang: LangKey;
}

const goalTranslations = {
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
  const [selectedGroup, setSelectedGroup] = useState<keyof typeof goalTranslations.groups | ''>('');

  const t = (): string =>
    goalTranslations.label[lang] || goalTranslations.label.pl;

  const tGoal = (key: keyof typeof goalTranslations.groups): string =>
    goalTranslations.groups[key][lang] || goalTranslations.groups[key].pl || key;

  const translatedGoals: Record<string, string> = Object.keys(goalTranslations.groups).reduce(
    (acc, key) => {
      const goalKey = key as keyof typeof goalTranslations.groups;
      acc[key] = tGoal(goalKey);
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div className="bg-white p-4 rounded shadow mt-6 space-y-4">
      <label className="block font-semibold mb-1">
        {t()}
      </label>

      <SelectDietGoalForm
        selectedGoals={[selectedGroup]}
        setSelectedGoals={(groups) => {
          const selected = groups[0] as keyof typeof goalTranslations.groups;
          setSelectedGroup(selected);
          onChange(selected);
        }}
        groupedDietGoals={translatedGoals}
        placeholder="--"
      />
    </div>
  );
}