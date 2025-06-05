import { LangKey } from './i18n';

export const translatedTitles: Record<'dr' | 'drhab' | 'prof', Record<LangKey, string>> = {
  dr: {
    pl: 'dr',
    en: 'Dr.',
    ua: 'д-р',
    es: 'Dr.',
    fr: 'Dr',
    de: 'Dr.',
    ru: 'д-р',
    zh: '博士',
    hi: 'डॉ.',
    ar: 'د.',
    he: 'ד"ר'
  },
  drhab: {
    pl: 'dr hab.',
    en: 'PhD habil.',
    ua: 'д-р габ.',
    es: 'Dr. hab.',
    fr: 'Dr habil.',
    de: 'Dr. habil.',
    ru: 'д-р хаб.',
    zh: '博士（高级）',
    hi: 'डॉ. हाबिल',
    ar: 'دكتور مؤهل',
    he: 'ד"ר (הביליטציה)'
  },
  prof: {
    pl: 'prof.',
    en: 'Prof.',
    ua: 'проф.',
    es: 'Prof.',
    fr: 'Prof.',
    de: 'Prof.',
    ru: 'проф.',
    zh: '教授',
    hi: 'प्रोफेसर',
    ar: 'أ.د.',
    he: 'פרופ.'
  }
};
