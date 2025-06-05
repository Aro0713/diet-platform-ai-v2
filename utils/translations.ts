import { translationsUI } from './translationsUI';

export type LangKey = 'pl' | 'en' | 'es' | 'fr' | 'de' | 'ua' | 'ru' | 'zh' | 'hi' | 'ar' | 'he';

export type TranslationKey = keyof typeof translations;

export const languageLabels: Record<LangKey, string> = {
  pl: 'Polski',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ua: 'Українська',
  ru: 'Русский',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
  he: 'עברית'
};

import { section1 } from '@/utils/translations/interview/section1';
import { section2 } from '@/utils/translations/interview/section2';
import { section3 } from '@/utils/translations/interview/section3';
import { section4 } from '@/utils/translations/interview/section4';
import { section5 } from '@/utils/translations/interview/section5';
import { section6 } from '@/utils/translations/interview/section6';
import { section7 } from '@/utils/translations/interview/section7';
import { section8 } from '@/utils/translations/interview/section8';
import { section9 } from '@/utils/translations/interview/section9';
import { section10 } from '@/utils/translations/interview/section10';


export const translations = {
  section1,
  section2,
  section3,
  section4,
  section5,
  section6,
  section7,
  section8,
  section9,
  section10
} as const;

export const getTranslation = <
  Source extends Record<string, Record<LangKey, string>>
>(
  source: Source,
  key: keyof Source,
  lang: LangKey
): string => {
  return source[key]?.[lang] ?? (key as string);
};

