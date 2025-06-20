import { LangKey } from '@/utils/i18n';

/**
 * Konwertuje surową sekcję tłumaczeń (np. section1) do formatu rozpoznawanego przez InterviewWizard.
 */
export function convertSectionFormat(
  section: Record<string, Record<LangKey, string | string[]>>
): Record<LangKey, Record<string, string | string[] | { dependsOn?: { question: string; value: string } }>> {
  const result = {
    pl: {}, en: {}, es: {}, fr: {}, de: {}, ua: {}, ru: {}, zh: {}, hi: {}, ar: {}, he: {},
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
  pl: 'Inne', en: 'Other', es: 'Otro', fr: 'Autre', de: 'Anderes',
  ua: 'Інше', ru: 'Другое', zh: '其他', hi: 'अन्य', ar: 'أخرى', he: 'אחר',
};

/**
 * Lista wszystkich tłumaczeń słowa "Inne"
 */
export const OTHER_OPTIONS = Object.values(otherOptionByLang);

/**
 * Automatycznie dodaje "Inne" do listy opcji
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

/**
 * 🔄 Konwertuje dane z InterviewWizard (stepX_qY) do:
 * - structuredInterview: sectionX.qY → do PDF, alergii, analiz
 * - narrativeInput: qY → do generateInterviewNarrative
 */
export function convertInterviewAnswers(answers: Record<string, string>) {
  const stepData: Record<string, Record<string, string>> = {};
  const narrativeData: Record<string, string> = {};

  for (const [key, value] of Object.entries(answers)) {
    const match = key.match(/^step(\d+)_q(\d+)/);
    if (match) {
      const step = parseInt(match[1]) + 1; // step0 = section1
      const question = `q${match[2]}`;

      if (!stepData[`section${step}`]) stepData[`section${step}`] = {};
      stepData[`section${step}`][question] = value;
      narrativeData[question] = value;
    }
  }

  return {
    structuredInterview: stepData,
    narrativeInput: narrativeData
  };
}
