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
  // istniejące
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
    ar: 'تجديدी',
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

  // NOWE – cele kliniczne, które mapują się na modele/overlays

  glycemic: {
    pl: 'Kontrola glikemii / insulinooporność',
    en: 'Glycemic control / insulin resistance',
    de: 'Glykämiekontrolle / Insulinresistenz',
    ua: 'Контроль глікемії / інсулінорезистентність',
    ru: 'Контроль гликемии / инсулинорезистентность',
    es: 'Control glucémico / resistencia a la insulina',
    fr: 'Contrôle glycémique / résistance à l’insuline',
    zh: '血糖控制 / 胰岛素抵抗',
    hi: 'ग्लाइसेमिक नियंत्रण / इंसुलिन रेज़िस्टेंस',
    ar: 'التحكم السكري / مقاومة الإنسولين',
    he: 'שליטה גליקמית / תנגודת לאינסולין',
  },
  lipids: {
    pl: 'Poprawa profilu lipidowego',
    en: 'Lipid profile improvement',
    de: 'Verbesserung des Lipidprofils',
    ua: 'Покращення ліпідного профілю',
    ru: 'Улучшение липидного профиля',
    es: 'Mejora del perfil lipídico',
    fr: 'Amélioration du profil lipidique',
    zh: '改善血脂',
    hi: 'लिपिड प्रोफ़ाइल में सुधार',
    ar: 'تحسين دهون الدم',
    he: 'שיפור פרופיל שומנים',
  },
  bp: {
    pl: 'Kontrola ciśnienia (DASH)',
    en: 'Blood pressure control (DASH)',
    de: 'Blutdruckkontrolle (DASH)',
    ua: 'Контроль тиску (DASH)',
    ru: 'Контроль давления (DASH)',
    es: 'Control de presión arterial (DASH)',
    fr: 'Contrôle de la tension (DASH)',
    zh: '血压控制（DASH）',
    hi: 'रक्तचाप नियंत्रण (DASH)',
    ar: 'التحكم بضغط الدم (DASH)',
    he: 'שליטה בלחץ דם (DASH)',
  },
  gut: {
    pl: 'Ulga jelitowa (IBS / FODMAP)',
    en: 'Gut relief (IBS / FODMAP)',
    de: 'Darmentlastung (IBS / FODMAP)',
    ua: 'Полегшення ШКТ (IBS / FODMAP)',
    ru: 'Поддержка кишечника (IBS / FODMAP)',
    es: 'Alivio intestinal (SII / FODMAP)',
    fr: 'Soulagement intestinal (SII / FODMAP)',
    zh: '肠道缓解（IBS / FODMAP）',
    hi: 'आंतों में राहत (IBS / FODMAP)',
    ar: 'تخفيف الأمعاء (IBS / FODMAP)',
    he: 'הקלה למעי (IBS / FODMAP)',
  },
  thyroid: {
    pl: 'Wsparcie tarczycy (np. Hashimoto)',
    en: 'Thyroid support (e.g., Hashimoto)',
    de: 'Schilddrüsenunterstützung (z. B. Hashimoto)',
    ua: 'Підтримка щитоподібної залози (напр. Хашимото)',
    ru: 'Поддержка щитовидной железы (напр. Хашимото)',
    es: 'Soporte tiroideo (p. ej., Hashimoto)',
    fr: 'Soutien thyroïdien (ex. Hashimoto)',
    zh: '甲状腺支持（如桥本）',
    hi: 'थायरॉयड समर्थन (जैसे हाशिमोटो)',
    ar: 'دعم الغدة الدرقية (مثال هاشيموتو)',
    he: 'תמיכה בבלוטת התריס (למשל השימוטו)',
  },
  antiInflammatory: {
    pl: 'Działanie przeciwzapalne',
    en: 'Anti-inflammatory',
    de: 'Entzündungshemmend',
    ua: 'Протизапальна дія',
    ru: 'Противовоспалительное действие',
    es: 'Antiinflamatorio',
    fr: 'Anti-inflammatoire',
    zh: '抗炎',
    hi: 'सूजन-रोधी',
    ar: 'مضاد للالتهاب',
    he: 'נוגד דלקת',
  },
  performance: {
    pl: 'Wydolność / sport',
    en: 'Performance / sport',
    de: 'Leistungsfähigkeit / Sport',
    ua: 'Витривалість / спорт',
    ru: 'Выносливость / спорт',
    es: 'Rendimiento / deporte',
    fr: 'Performance / sport',
    zh: '运动表现',
    hi: 'प्रदर्शन / खेल',
    ar: 'الأداء / الرياضة',
    he: 'ביצועים / ספורט',
  },
  generalHealth: {
    pl: 'Zdrowie ogólne i nawyki',
    en: 'General health & habits',
    de: 'Allgemeine Gesundheit & Gewohnheiten',
    ua: 'Загальне здоров’я та звички',
    ru: 'Общее здоровье и привычки',
    es: 'Salud general y hábitos',
    fr: 'Santé générale & habitudes',
    zh: '总体健康与习惯',
    hi: 'सामान्य स्वास्थ्य और आदतें',
    ar: 'الصحة العامة والعادات',
    he: 'בריאות כללית והרגלים',
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
