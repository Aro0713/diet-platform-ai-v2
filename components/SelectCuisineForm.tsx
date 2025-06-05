import React from 'react';
import { LangKey, tUI } from '../utils/i18n';
import PanelCard from './PanelCard';

interface Props {
  onChange: (value: string) => void;
  lang: LangKey;
}

const cuisineLabels: Record<string, Record<LangKey, string>> = {
  mediterranean: {
    pl: 'Śródziemnomorska',
    en: 'Mediterranean',
    ua: 'Середземноморська',
    es: 'Mediterránea',
    fr: 'Méditerranéenne',
    de: 'Mittelmeer',
    ru: 'Средиземноморская',
    zh: '地中海',
    hi: 'भूमध्यसागरीय',
    ar: 'المتوسطية',
    he: 'ים תיכונית',
  },
  japanese: {
    pl: 'Japońska',
    en: 'Japanese',
    ua: 'Японська',
    es: 'Japonesa',
    fr: 'Japonaise',
    de: 'Japanisch',
    ru: 'Японская',
    zh: '日本',
    hi: 'जापानी',
    ar: 'يابانية',
    he: 'יפנית',
  },
  chinese: {
    pl: 'Chińska',
    en: 'Chinese',
    ua: 'Китайська',
    es: 'China',
    fr: 'Chinoise',
    de: 'Chinesisch',
    ru: 'Китайская',
    zh: '中国',
    hi: 'चीनी',
    ar: 'صينية',
    he: 'סינית',
  },
  thai: {
    pl: 'Tajska',
    en: 'Thai',
    ua: 'Тайська',
    ru: 'Тайская',
    es: 'Tailandesa',
    fr: 'Thaïlandaise',
    de: 'Thailändisch',
    zh: '泰国',
    hi: 'थाई',
    ar: 'تايلاندية',
    he: 'תאילנדית',
  },
  vietnamese: {
    pl: 'Wietnamska',
    en: 'Vietnamese',
    ua: 'В’єтнамська',
    ru: 'Вьетнамская',
    es: 'Vietnamita',
    fr: 'Vietnamienne',
    de: 'Vietnamesisch',
    zh: '越南',
    hi: 'वियतनामी',
    ar: 'فيتنامية',
    he: 'וייטנאמית',
  },
  indian: {
    pl: 'Indyjska',
    en: 'Indian',
    ua: 'Індійська',
    ru: 'Индийская',
    es: 'India',
    fr: 'Indienne',
    de: 'Indisch',
    zh: '印度',
    hi: 'भारतीय',
    ar: 'هندية',
    he: 'הודית',
  },
  korean: {
    pl: 'Koreańska',
    en: 'Korean',
    ua: 'Корейська',
    ru: 'Корейская',
    es: 'Coreana',
    fr: 'Coréenne',
    de: 'Koreanisch',
    zh: '韩国',
    hi: 'कोरियाई',
    ar: 'كورية',
    he: 'קוריאנית',
  },
  middleeastern: {
    pl: 'Bliskowschodnia',
    en: 'Middle Eastern',
    ua: 'Близькосхідна',
    ru: 'Ближневосточная',
    es: 'Del Medio Oriente',
    fr: 'Du Moyen-Orient',
    de: 'Nahöstlich',
    zh: '中东',
    hi: 'मध्य पूर्वी',
    ar: 'شرق أوسطية',
    he: 'מזרח תיכונית',
  },
  polish: {
    pl: 'Polska',
    en: 'Polish',
    ua: 'Польська',
    ru: 'Польская',
    es: 'Polaca',
    fr: 'Polonaise',
    de: 'Polnisch',
    zh: '波兰',
    hi: 'पोलिश',
    ar: 'بولندية',
    he: 'פולנית',
  },
  french: {
    pl: 'Francuska',
    en: 'French',
    ua: 'Французька',
    ru: 'Французская',
    es: 'Francesa',
    fr: 'Française',
    de: 'Französisch',
    zh: '法国',
    hi: 'फ्रेंच',
    ar: 'فرنسية',
    he: 'צרפתית',
  },
  italian: {
    pl: 'Włoska',
    en: 'Italian',
    ua: 'Італійська',
    ru: 'Итальянская',
    es: 'Italiana',
    fr: 'Italienne',
    de: 'Italienisch',
    zh: '意大利',
    hi: 'इतालवी',
    ar: 'إيطالية',
    he: 'איטלקית',
  },
  spanish: {
    pl: 'Hiszpańska',
    en: 'Spanish',
    ua: 'Іспанська',
    ru: 'Испанская',
    es: 'Española',
    fr: 'Espagnole',
    de: 'Spanisch',
    zh: '西班牙',
    hi: 'स्पेनिश',
    ar: 'إسبانية',
    he: 'ספרדית',
  },
  scandinavian: {
    pl: 'Skandynawska',
    en: 'Scandinavian',
    ua: 'Скандинавська',
    ru: 'Скандинавская',
    es: 'Escandinava',
    fr: 'Scandinave',
    de: 'Skandinavisch',
    zh: '斯堪的纳维亚',
    hi: 'स्कैंडिनेवियाई',
    ar: 'إسكندنافية',
    he: 'סקנדינבית',
  },
  northamerican: {
    pl: 'Północnoamerykańska',
    en: 'North American',
    ua: 'Північноамериканська',
    ru: 'Североамериканская',
    es: 'Norteamericana',
    fr: 'Nord-américaine',
    de: 'Nordamerikanisch',
    zh: '北美',
    hi: 'उत्तरी अमेरिकी',
    ar: 'أمريكية شمالية',
    he: 'צפון אמריקאית',
  },
  brazilian: {
    pl: 'Brazylijska',
    en: 'Brazilian',
    ua: 'Бразильська',
    ru: 'Бразильская',
    es: 'Brasileña',
    fr: 'Brésilienne',
    de: 'Brasilianisch',
    zh: '巴西',
    hi: 'ब्राज़ीलियाई',
    ar: 'برازيلية',
    he: 'ברזילאית',
  },
  african: {
    pl: 'Afrykańska',
    en: 'African',
    ua: 'Африканська',
    ru: 'Африканская',
    es: 'Africana',
    fr: 'Africaine',
    de: 'Afrikanisch',
    zh: '非洲',
    hi: 'अफ्रीकी',
    ar: 'أفريقية',
    he: 'אפריקאית',
  },
  arctic: {
    pl: 'Dieta arktyczna / syberyjska',
    en: 'Arctic / Siberian',
    ua: 'Арктична / Сибірська',
    ru: 'Арктическая / Сибирская',
    es: 'Ártica / Siberiana',
    fr: 'Arctique / Sibérienne',
    de: 'Arktische / Sibirische',
    zh: '北极/西伯利亚',
    hi: 'आर्कटिक / साइबेरियाई',
    ar: 'قطبية / سيبيرية',
    he: 'ארקטית / סיבירית',
  }
  
};

const cuisineTitle: Record<LangKey, string> = {
  pl: 'Kuchnia świata',
  en: 'World cuisine',
  ua: 'Кухні світу',
  es: 'Cocina del mundo',
  fr: 'Cuisine du monde',
  de: 'Weltküche',
  ru: 'Кухни мира',
  zh: '世界美食',
  hi: 'दुनिया के व्यंजन',
  ar: 'مأكولات عالمية',
  he: 'מטבח עולמי'
};

const cuisineKeys = Object.keys(cuisineLabels);

export default function SelectCuisineForm({ onChange, lang }: Props) {
  const tLabel = tUI('selectCuisine', lang);
  const tTitle = cuisineTitle[lang] || cuisineTitle.pl;

  return (
    <PanelCard title={`🌍 ${tTitle}`} className="h-full">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-black dark:text-white">
          {tLabel}
        </label>

        <select
          className="w-full rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue=""
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{`-- ${tLabel} --`}</option>
          {cuisineKeys.map((key) => (
            <option key={key} value={key}>
              {cuisineLabels[key]?.[lang] || cuisineLabels[key]?.pl || key}
            </option>
          ))}
        </select>
      </div>
    </PanelCard>
  );
}