import React, { useState, useMemo } from 'react';
import { getInterviewTranslation, type LangKey, tUI } from '@/utils/i18n';

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
import { OTHER_OPTIONS } from '@/utils/interviewHelpers';
import PanelCard from './PanelCard';

interface Question {
  noInput?: any;
  name: string;
  label: string;
  type: 'text' | 'radio' | 'select';
  options?: string[];
  dependsOn?: {
    question: string;
    value: string;
  };
}

interface Step {
  title: string;
  questions: Question[];
}

type InterviewAnswers = Record<string, string>;

interface Props {
  onFinish: (data: InterviewAnswers) => void;
  form: {
    sex: 'female' | 'male';
  };
  lang: LangKey;
}

const getSexString = (sex: 'female' | 'male' | undefined, lang: LangKey): string => {
  const forms: Record<LangKey, { female: string; male: string; default: string }> = {
    pl: { female: 'Pani', male: 'Pana', default: 'pacjenta' },
    en: { female: 'Ms.', male: 'Mr.', default: 'patient' },
    ua: { female: 'пані', male: 'пане', default: 'пацієнта' },
    es: { female: 'señora', male: 'señor', default: 'paciente' },
    fr: { female: 'Madame', male: 'Monsieur', default: 'patient' },
    de: { female: 'Frau', male: 'Herr', default: 'Patienten' },
    ru: { female: 'госпожа', male: 'господин', default: 'пациента' },
    zh: { female: '女士', male: '先生', default: '患者' },
    hi: { female: 'महिला', male: 'पुरुष', default: 'मरीज' },
    ar: { female: 'سيدة', male: 'سيد', default: 'مريض' },
    he: { female: 'גברת', male: 'אדון', default: 'מטופל' }
  };
  const entry = forms[lang] || forms['en'];
  if (sex === 'female') return entry.female;
  if (sex === 'male') return entry.male;
  return entry.default;
};

const shouldRenderQuestion = (q: Question, answers: InterviewAnswers): boolean => {
  if (!q.dependsOn) return true;
  const match = Object.entries(answers).find(([key]) => key.endsWith(`_${q.dependsOn!.question}`));
  if (!match) return false;
  const answerValue = match[1];
  if (Array.isArray(answerValue)) {
    return answerValue.includes(q.dependsOn.value);
  }
  return answerValue === q.dependsOn.value;
};

function convertSectionFormat(section: Record<string, any>): { title: string; questions: Question[] } {
  const { title } = section;
  const questions: Question[] = Object.entries(section)
    .filter(([key]) => key.startsWith('q'))
    .map(([key, value]) => {
      if (typeof value === 'object' && value.label && ['radio', 'select', 'text'].includes(value.type)) {
        return {
          name: key,
          label: value.label,
          type: value.type,
          options: value.options || [],
          dependsOn: value.dependsOn
        };
      }
      return null;
    })
    .filter(Boolean) as Question[];
  return { title, questions };
}

const buildStep = (section: Record<LangKey, Record<string, any>>, lang: LangKey, form: { sex: 'female' | 'male' }): Step => {
  const raw = section[lang] || section['pl'];
  const parsed: Record<string, any> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      parsed[key] = value.replace('sex', getSexString(form?.sex, lang));
    } else if (Array.isArray(value)) {
      parsed[key] = value;
    } else if (typeof value === 'object' && 'label' in value) {
      parsed[key] = {
        ...value,
        label: value.label.replace('sex', getSexString(form?.sex, lang))
      };
    } else {
      parsed[key] = value;
    }
  }
  return convertSectionFormat(parsed);
};

export default function InterviewWizard({ onFinish, form, lang }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [allAnswers, setAllAnswers] = useState<InterviewAnswers>({});

  const steps: Step[] = useMemo(() => {
    const baseSteps = [
      buildStep(section1, lang, form),
      buildStep(section2, lang, form),
      buildStep(section3, lang, form),
      buildStep(section4, lang, form),
      buildStep(section5, lang, form),
      buildStep(section6, lang, form),
      buildStep(section7, lang, form),
    ];

    if (form.sex === 'female') {
      baseSteps.push(buildStep(section8, lang, form));
    }

    baseSteps.push(buildStep(section9, lang, form));
    baseSteps.push(buildStep(section10, lang, form));

    return baseSteps;
  }, [lang, form.sex]);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const next = () => setCurrentStep((prev) => prev + 1);
  const back = () => setCurrentStep((prev) => prev - 1);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

const handleChange = (name: string, value: string) => {
  setAllAnswers((prev) => ({ ...prev, [name]: value }));
};

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onFinish(allAnswers);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('❌ Błąd zapisu wywiadu:', e);
      alert('Błąd zapisu wywiadu. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelCard className="z-10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 dark:text-white transition-colors min-h-[550px]">
      <div className="bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-900 dark:border-blue-400 dark:text-white p-4 rounded text-sm mb-6 space-y-2">
        <p><strong>{tUI('interviewNoticeTitle', lang)}</strong> {tUI('interviewNotice1', lang)}</p>
        <p>{tUI('interviewNotice2', lang)}</p>
        <p><em>{tUI('interviewNotice3', lang)}</em></p>
      </div>

      <h2 className="text-xl font-semibold">
        🧠 {tUI('step', lang)} {currentStep + 1}: {step.title}
      </h2>

      {step.questions.map((q) => {
      const scopedName = `step${currentStep}_${q.name}`;
      const answer = allAnswers[scopedName] || '';
      const visible = shouldRenderQuestion(q, allAnswers);
      const isConditionalText =
      q.type === 'radio' &&
      q.options?.includes('Tak') &&
      q.label.toLowerCase().includes('jeśli tak');

        if (!visible) return null;

        return (
          <div key={scopedName} className="mb-4">
            {q.label && <label className="block mb-1 font-medium">{q.label}</label>}

            {!q.noInput && (
              <>
                {q.type === 'radio' && q.options ? (
                  <>
                    <div className="flex gap-4 flex-wrap">
                      {q.options.map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                          type="radio"
                          name={scopedName}
                          value={option}
                          checked={answer === option}
                          onChange={() => handleChange(scopedName, option)}
                          className="accent-black dark:accent-white"
                        />
                          {option}
                        </label>
                      ))}
                    </div>

                    {isConditionalText && answer === 'Tak' && (
                      <input
                        type="text"
                        maxLength={300}
                        className="mt-2 w-full border rounded-md px-2 py-1 text-sm leading-5 
                          bg-white text-black border-gray-300 placeholder:text-gray-500
                          dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
                        placeholder={tUI('pleaseSpecify', lang)}
                        value={allAnswers[`${scopedName}_details`] || ''}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(
                            /[^\u0000-\u007F\p{L}\p{N}\p{P}\p{Zs}]/gu, ''
                          );
                          handleChange(scopedName, cleaned);

                        }}
                      />
                    )}
                  </>
                ) : q.type === 'select' && q.options ? (
                  <>
                    <select
                      className="w-full border rounded-md p-2 
                        bg-white text-black border-gray-300 placeholder:text-gray-500
                        dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
                      value={answer}
                      onChange={(e) => handleChange(scopedName, e.target.value)}
                    >
                      <option value="">-- {tUI('selectOption', lang)} --</option>
                      {q.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>

                    {OTHER_OPTIONS.includes(answer) &&
                      !step.questions.some(
                        (qSub) =>
                          qSub.dependsOn?.question === q.name &&
                          qSub.dependsOn?.value === answer
                      ) && (
                        <input
                          type="text"
                          maxLength={300}
                          className="mt-2 w-full border rounded-md px-2 py-1 text-sm leading-5 
                            bg-white text-black border-gray-300 placeholder:text-gray-500
                            dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
                          placeholder={tUI('pleaseSpecify', lang)}
                          value={allAnswers[`${scopedName}_other`] || ''}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(
                              /[^\u0000-\u007F\p{L}\p{N}\p{P}\p{Zs}]/gu, ''
                            );
                            handleChange(`${scopedName}_other`, cleaned);
                          }}
                        />
                      )}
                  </>
                ) : (
                  <input
                    type="text"
                    maxLength={300}
                    className="w-full border rounded-md px-2 py-1 text-sm leading-5 
                      bg-white text-black border-gray-300 placeholder:text-gray-500
                      dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
                    value={answer}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(
                        /[^\u0000-\u007F\p{L}\p{N}\p{P}\p{Zs}]/gu, ''
                      );
                      handleChange(scopedName, cleaned);
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      })}

      <div className="flex justify-between mt-6">
        {currentStep > 0 && (
          <button
            className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-2 px-4 rounded"
            onClick={back}
          >
            ⬅️ {tUI('back', lang)}
          </button>
        )}

        {isLastStep ? (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="ml-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {saving ? 'Zapisywanie...' : saved ? 'Zapisano ✓' : `✅ ${tUI('saveInterview', lang)}`}
          </button>
        ) : (
          <button
            className="ml-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
            onClick={next}
          >
            {tUI('next', lang)} ➡️
          </button>
        )}
      </div>
    </PanelCard>
  );
}


