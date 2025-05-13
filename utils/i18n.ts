// ✅ i18n.ts – tylko typy i funkcje
import { translationsUI } from './translationsUI';

export type LangKey =
  | 'pl' | 'en' | 'es' | 'fr' | 'de'
  | 'ua' | 'ru' | 'zh' | 'hi' | 'ar' | 'he';

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

export function getTranslation<
  T extends Record<string, Record<LangKey, string>>,
  K extends keyof T
>(source: T, key: K, lang: LangKey): string {
  return source[key]?.[lang] || source[key]?.['pl'] || (key as string);
}

export function tUI(
  key: keyof typeof translationsUI,
  lang: LangKey
): string {
  return translationsUI[key]?.[lang] || translationsUI[key]?.['pl'] || key;
}
