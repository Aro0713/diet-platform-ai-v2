import { LangKey } from '@/utils/i18n';

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

type InterviewAnswers = Record<string, string>;

/**
 * Generuje przyjazny opis narracyjny wywiadu dla PDF
 */
export function generateInterviewNarrative(
  answers: InterviewAnswers,
  lang: LangKey,
  sex: 'female' | 'male'
): string {
  const sections = [
    section1, section2, section3, section4, section5,
    section6, section7,
    ...(sex === 'female' ? [section8] : []),
    section9, section10
  ];

  const result: string[] = [];

  for (const section of sections) {
    const data = section[lang];
    const sectionKeys = Object.keys(data).filter(k => k.startsWith('q'));
    const sectionTitle = data.title;
    const sectionResult: string[] = [];

    for (const key of sectionKeys) {
      const question = data[key] as {
        label: string;
        type: 'radio' | 'select' | 'text';
        dependsOn?: { question: string; value: string };
      };

      const value = answers[key];
      if (!value || !question) continue;

      // Sprawdź warunki zależne
      if (question.dependsOn) {
        const depVal = answers[question.dependsOn.question];
        if (depVal !== question.dependsOn.value) continue;
      }

      const label = question.label.replace(/sex/g, sex === 'female' ? (lang === 'pl' ? 'Pani' : 'she') : (lang === 'pl' ? 'Pan' : 'he'));

      if (question.type === 'radio' || question.type === 'select') {
        sectionResult.push(`${label}: ${value}`);
      } else if (question.type === 'text') {
        sectionResult.push(`${label}: ${value}`);
      }
    }

    if (sectionResult.length) {
      result.push(`${sectionTitle}:
${sectionResult.map(r => `- ${r}`).join('\n')}`);
    }
  }

  return result.join('\n\n');
}
