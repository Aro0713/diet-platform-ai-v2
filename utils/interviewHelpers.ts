import { LangKey } from '@/utils/i18n';

/**
 * Konwertuje surową sekcję tłumaczeń (np. section1) do formatu rozpoznawanego przez InterviewWizard.
 * Obsługuje:
 * – *_options → przekształca na opcje select/radio,
 * – *_dependsOn → zamienia na zależności typu { dependsOn: { question, value } },
 * – pomija *_dependsOn jako osobne pytania,
 * – dodaje puste wartości dla bazowych kluczy jeśli są tylko options.
 */
export function convertSectionFormat(
  section: Record<string, Record<LangKey, string | string[]>>
): Record<LangKey, Record<string, string | string[] | { dependsOn?: { question: string; value: string } }>> {
  const result = {
    pl: {},
    en: {},
    es: {},
    fr: {},
    de: {},
    ua: {},
    ru: {},
    zh: {},
    hi: {},
    ar: {},
    he: {},
  } as Record<LangKey, Record<string, any>>;

  for (const key in section) {
    const translations = section[key];

    for (const lang in translations) {
      const langKey = lang as LangKey;
      if (!result[langKey]) result[langKey] = {};

      if (key.endsWith('_dependsOn')) continue;

      const value = translations[langKey];
      const isOptionsKey = key.endsWith('_options');
      const baseKey = isOptionsKey ? key.replace('_options', '') : key;
      const dependsKey = `${key}_dependsOn`;
      const dependsRaw = section[dependsKey]?.[langKey];

      if (typeof dependsRaw === 'string' && dependsRaw.includes('|')) {
        const [depQ, depVal] = dependsRaw.split('|');
        result[langKey][key] = {
          label: value,
          dependsOn: {
            question: depQ,
            value: depVal,
          },
        };

        if (isOptionsKey && !result[langKey][baseKey]) {
          result[langKey][baseKey] = '';
        }
      } else {
        result[langKey][key] = value;

        if (isOptionsKey && !result[langKey][baseKey]) {
          result[langKey][baseKey] = '';
        }
      }
    }
  }

  return result;
}

/**
 * Mapowanie "Inne" → w danym języku
 */
export const otherOptionByLang: Record<LangKey, string> = {
  pl: 'Inne',
  en: 'Other',
  es: 'Otro',
  fr: 'Autre',
  de: 'Anderes',
  ua: 'Інше',
  ru: 'Другое',
  zh: '其他',
  hi: 'अन्य',
  ar: 'أخرى',
  he: 'אחר',
};

/**
 * Lista wszystkich tłumaczeń słowa "Inne" — używana do wykrywania odpowiedzi w InterviewWizard
 */
export const OTHER_OPTIONS = Object.values(otherOptionByLang);

/**
 * Automatycznie dopisuje "Inne" do końca każdej tablicy opcji w danej sekcji
 */
export function withOtherOption(
  section: Record<LangKey, Record<string, string | string[]>>
): Record<LangKey, Record<string, string | string[]>> {
  const modified = {} as Record<LangKey, Record<string, string | string[]>>;

  for (const lang of Object.keys(section) as LangKey[]) {
    const entries = section[lang];
    const langOther = otherOptionByLang[lang];

    const updated = Object.entries(entries).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        const alreadyIncluded = value.some(
          (v) => v.trim().toLowerCase() === langOther.toLowerCase()
        );
        acc[key] = alreadyIncluded ? value : [...value, langOther];
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string | string[]>);

    modified[lang] = updated;
  }

  return modified;
}

/**
 * Wyciąga kluczowe dane z wywiadu do kalkulatora (PAL, sen, stres, posiłki)
 */
export const extractMappedInterview = (interview: Record<string, string>) => {
  const result: Record<string, string> = {};

  result.q1 = interview.step2_q1 || '';
  result.q2 = interview.step2_q2 || '';
  result.q7 = interview.step1_q14 || '';
  result.q8 = interview.step1_q13 || '';
  result.mealsPerDay = interview.step9_mealsPerDay || '';

  return result;
};
