import React from 'react';
import { LangKey } from '../utils/translations';
import PanelCard from './PanelCard'; // ✅ upewnij się, że importujesz swój PanelCard

interface Props {
  selectedGoals: string[];
  setSelectedGoals: (goals: string[]) => void;
  lang: LangKey;
}

const goalLabels: Record<string, Record<LangKey, string>> = {
  lose: {
    pl: 'Odchudzające (redukcyjne)',
    en: 'Weight loss',
    ua: 'Схуднення',
    ru: 'Похудение',
    es: 'Pérdida de peso',
    fr: 'Perte de poids',
    de: 'Gewichtsabnahme',
    zh: '减重',
    hi: 'वजन घटाना',
    ar: 'فقدان الوزن',
    he: 'ירידה במשקל',
  },
  gain: {
    pl: 'Na masę',
    en: 'Muscle gain',
    ua: "Нарощування м'язів",
    ru: 'Набор массы',
    es: 'Aumento de masa muscular',
    fr: 'Prise de masse musculaire',
    de: 'Masseaufbau',
    zh: '增肌',
    hi: 'मांसपेशियों की वृद्धि',
    ar: 'زيادة الكتلة العضلية',
    he: 'עלייה במסת שריר',
  },
  maintain: {
    pl: 'Stabilizujące wagę',
    en: 'Weight maintenance',
    ua: 'Підтримка ваги',
    ru: 'Поддержание веса',
    es: 'Mantenimiento del peso',
    fr: 'Maintien du poids',
    de: 'Gewicht halten',
    zh: '维持体重',
    hi: 'वजन बनाए रखना',
    ar: 'الحفاظ على الوزن',
    he: 'שמירה על משקל',
  },
  detox: {
    pl: 'Detoksykacyjne / oczyszczające',
    en: 'Detox / cleansing',
    ua: 'Детокс / очищення',
    ru: 'Детокс / очищение',
    es: 'Desintoxicación / limpieza',
    fr: 'Détox / nettoyage',
    de: 'Entgiftung',
    zh: '排毒 / 清洁',
    hi: 'डिटॉक्स / सफाई',
    ar: 'إزالة السموم / تطهير',
    he: 'ניקוי רעלים',
  },
  regen: {
    pl: 'Regeneracyjne',
    en: 'Regenerative',
    ua: 'Відновлювальні',
    ru: 'Восстановительные',
    es: 'Regenerativo',
    fr: 'Régénératif',
    de: 'Regenerierend',
    zh: '恢复性',
    hi: 'पुनर्जनन',
    ar: 'تجديدي',
    he: 'משקם',
  },
  inflammatory: {
    pl: 'Przeciwzapalne',
    en: 'Anti-inflammatory',
    ua: 'Протизапальні',
    ru: 'Противовоспалительные',
    es: 'Antiinflamatorio',
    fr: 'Anti-inflammatoire',
    de: 'Entzündungshemmend',
    zh: '抗炎',
    hi: 'सूजन रोधी',
    ar: 'مضاد للالتهاب',
    he: 'נוגד דלקת',
  },
  liver: {
    pl: 'Poprawa pracy wątroby',
    en: 'Liver support',
    ua: 'Підтримка печінки',
    ru: 'Поддержка печени',
    es: 'Apoyo hepático',
    fr: 'Soutien du foie',
    de: 'Leberunterstützung',
    zh: '肝脏支持',
    hi: 'लीवर समर्थन',
    ar: 'دعم الكبد',
    he: 'תמיכה בכבד',
  },
  kidney: {
    pl: 'Poprawa pracy nerek',
    en: 'Kidney support',
    ua: 'Підтримка нирок',
    ru: 'Поддержка почек',
    es: 'Apoyo renal',
    fr: 'Soutien des reins',
    de: 'Nierenunterstützung',
    zh: '肾脏支持',
    hi: 'किडनी समर्थन',
    ar: 'دعم الكلى',
    he: 'תמיכה בכליות',
  },
  immunity: {
    pl: 'Wzmacnianie odporności',
    en: 'Immunity boost',
    ua: 'Підвищення імунітету',
    ru: 'Укрепление иммунитета',
    es: 'Refuerzo inmunológico',
    fr: 'Renforcement immunitaire',
    de: 'Immunsystem stärken',
    zh: '增强免疫力',
    hi: 'प्रतिरक्षा बढ़ाना',
    ar: 'تعزيز المناعة',
    he: 'חיזוק מערכת החיסון',
  },
  neuro: {
    pl: 'Wsparcie układu nerwowego',
    en: 'Nervous system support',
    ua: 'Підтримка нервової системи',
    ru: 'Поддержка нервной системы',
    es: 'Apoyo al sistema nervioso',
    fr: 'Soutien du système nerveux',
    de: 'Nervensystem-Unterstützung',
    zh: '神经系统支持',
    hi: 'तंत्रिका तंत्र समर्थन',
    ar: 'دعم الجهاز العصبي',
    he: 'תמיכה במערכת העצבים',
  },
  skin: {
    pl: 'Poprawa skóry, włosów i paznokci',
    en: 'Skin, hair & nails',
    ua: 'Шкіра, волосся, нігті',
    ru: 'Кожа, волосы и ногти',
    es: 'Piel, cabello y uñas',
    fr: 'Peau, cheveux et ongles',
    de: 'Haut, Haare und Nägel',
    zh: '皮肤、头发和指甲',
    hi: 'त्वचा, बाल और नाखून',
    ar: 'البشرة والشعر والأظافر',
    he: 'עור, שיער וציפורניים',
  },
  fertility: {
    pl: 'Wsparcie płodności',
    en: 'Fertility support',
    ua: 'Підтримка фертильності',
    ru: 'Поддержка фертильности',
    es: 'Apoyo a la fertilidad',
    fr: 'Soutien à la fertilité',
    de: 'Fruchtbarkeitsunterstützung',
    zh: '生育支持',
    hi: 'प्रजनन समर्थन',
    ar: 'دعم الخصوبة',
    he: 'תמיכה בפוריות',
  },
  sport: {
    pl: 'Diety sportowe',
    en: 'Sports diets',
    ua: 'Спортивні дієти',
    ru: 'Спортивные диеты',
    es: 'Dietas deportivas',
    fr: 'Régimes sportifs',
    de: 'Sporternährung',
    zh: '运动饮食',
    hi: 'खेल आहार',
    ar: 'أنظمة غذائية رياضية',
    he: 'תפריטים לספורטאים',
  },
  clinical: {
    pl: 'Diety lecznicze (kliniczne)',
    en: 'Therapeutic (clinical) diets',
    ua: 'Лікувальні дієти',
    ru: 'Лечебные диеты',
    es: 'Dietas terapéuticas',
    fr: 'Régimes thérapeutiques',
    de: 'Therapeutische Diäten',
    zh: '治疗性饮食',
    hi: 'उपचारात्मक आहार',
    ar: 'أنظمة غذائية علاجية',
    he: 'תפריטים טיפוליים',
  },
  elimination: {
    pl: 'Diety eliminacyjne',
    en: 'Elimination diets',
    ua: 'Елімінаційні дієти',
    ru: 'Элиминационные диеты',
    es: 'Dietas de eliminación',
    fr: 'Régimes d’élimination',
    de: 'Ausschlussdiäten',
    zh: '排除饮食',
    hi: 'उन्मूलन आहार',
    ar: 'أنظمة غذائية إقصائية',
    he: 'תפריטים אלימינציים',
  },
};

export default function SelectGoalForm({ selectedGoals, setSelectedGoals, lang }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setSelectedGoals(selected);
  };

  return (
    <PanelCard title="🎯 Cele diety" className="bg-[#0d1117] text-white border border-gray-600">
      <label className="block text-sm font-medium mb-2">
        {lang === 'pl' ? 'Wybierz cele diety:' : 'Select diet goals:'}
      </label>

      <select
        multiple
        className="w-full rounded-md px-3 py-2 bg-[#1e293b] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedGoals}
        onChange={handleChange}
        size={Math.min(8, Object.keys(goalLabels).length)}
      >
        {Object.entries(goalLabels).map(([key, labels]) => (
          <option key={key} value={key}>
            {labels[lang] || labels.pl}
          </option>
        ))}
      </select>
    </PanelCard>
  );
}