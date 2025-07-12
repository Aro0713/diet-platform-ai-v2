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

// 🔁 Do formularzy rejestracji, UI itd.
export function getTranslation(
  source: Record<string, Record<LangKey, string>>,
  key: string,
  lang: LangKey
): string {
  if (!source || !source[key]) return key;
  return source[key][lang] || source[key]['pl'] || key;
}

// 🔁 Do tłumaczeń wywiadu (InterviewWizard, section1–10)
export function getInterviewTranslation<T extends string | string[]>(
  source: Record<LangKey, Record<string, T>>,
  key: string,
  lang: LangKey
): T {
  if (!source || !source[lang] || !(key in source[lang])) return key as T;
  return source[lang][key];
}

// 🔒 UI tłumaczenia systemowe
export function tUI(
  key: keyof typeof translationsUI,
  lang: LangKey,
  vars?: Record<string, string>
): string {
  const entry = translationsUI[key];
  if (!entry) {
    console.warn(`🔍 Brak tłumaczenia UI dla klucza: "${key}"`);
    return key;
  }

  let template = entry[lang] || entry['pl'] || key;

  if (vars) {
    for (const [varKey, varValue] of Object.entries(vars)) {
      template = template.replace(new RegExp(`{${varKey}}`, 'g'), varValue);
    }
  }

  return template;
}


// 🧠 Uniwersalne sprawdzenie braków w wielu źródłach
type SourceGroup = {
  name: string;
  source: Record<string, Record<LangKey, string>>;
};

export function checkMissingInSources(sources: SourceGroup[]): void {
  const langs = Object.keys(languageLabels) as LangKey[];

  for (const { name, source } of sources) {
    const missing = Object.entries(source)
      .filter(([_, values]) => langs.some((lang) => !values[lang]))
      .map(([key]) => key);

    if (missing.length > 0) {
      console.warn(`❗ Braki w "${name}":`, missing);
    } else {
      console.log(`✅ "${name}" — kompletne tłumaczenia`);
    }
  }
}

// 🔁 Wywołanie w trybie dev (np. w _app.tsx lub tu od razu)
import { translationsRegister } from '@/components/utils/translations/register';
import { medicalUI } from '@/utils/translations/translationsConditions';

if (process.env.NODE_ENV === 'development') {
  checkMissingInSources([
    { name: 'translationsUI', source: translationsUI },
    { name: 'translationsRegister', source: translationsRegister },
    { name: 'medicalUI', source: medicalUI }
  ]);
}
