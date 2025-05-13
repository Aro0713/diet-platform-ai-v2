import React from 'react';
import { LangKey } from '../utils/i18n';
import { tUI } from '../utils/i18n';

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

const cuisineKeys = Object.keys(cuisineLabels);

export default function SelectCuisineForm({ onChange, lang }: Props) {
  return (
    <div className="mt-4">
      <label className="block font-semibold mb-1">
        {tUI('selectCuisine', lang)}
      </label>
      <select
        className="w-full border px-2 py-1"
        defaultValue=""
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{`-- ${tUI('selectCuisine', lang)} --`}</option>
        {cuisineKeys.map((key) => (
          <option key={key} value={key}>
            {cuisineLabels[key]?.[lang] || cuisineLabels[key]?.pl || key}
          </option>
        ))}
      </select>
    </div>
  );
}