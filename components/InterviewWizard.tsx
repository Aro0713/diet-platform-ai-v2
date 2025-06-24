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
import { convertInterviewAnswers } from '@/utils/interviewHelpers';
import { generateInterviewPdf } from '@/utils/generateInterviewPdf';

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

const shouldRenderQuestion = (
  q: Question,
  answers: InterviewAnswers,
  currentStep: number
): boolean => {
  if (!q.dependsOn) return true;

  const dependencyKey = `step${currentStep}_${q.dependsOn.question}`;
  const answerValue = answers[dependencyKey];

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

      baseSteps.push(
      form.sex === 'female'
        ? buildStep(section8, lang, form)
        : { title: '', questions: [] }
    );

    baseSteps.push(buildStep(section9, lang, form));
    baseSteps.push(buildStep(section10, lang, form));

    return baseSteps;
  }, [lang, form.sex]);

    if (!steps.length || currentStep >= steps.length) {
      return (
        <PanelCard className="p-10 text-red-600">
          ⚠️ Błąd: nieprawidłowy krok wywiadu. Sprawdź dane wejściowe (płeć, język, sekcje).
        </PanelCard>
      );
    }

const step = steps[currentStep] || { title: '', questions: [] };
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
    await onFinish({ ...allAnswers, narrativeText });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  } catch (e) {
    console.error('❌ Błąd zapisu wywiadu:', e);
    alert('Błąd zapisu wywiadu. Spróbuj ponownie.');
  } finally {
    setSaving(false);
  }
};
const [generatingPdf, setGeneratingPdf] = useState(false);
const [narrativeText, setNarrativeText] = useState('');
const [narrativeGenerating, setNarrativeGenerating] = useState(false);

const handleGeneratePdfOnly = async () => {
  try {
    setGeneratingPdf(true);

 const response = await fetch('/api/interviewNarrativeAgent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    interviewData: allAnswers,
    goal: '',
    recommendation: '',
    lang
  })
});

let narrativeText = '⚠️ Brak odpowiedzi AI';

if (!response.ok) {
  console.error(`❌ Agent failed: HTTP ${response.status}`);
} else {
  try {
    const json = await response.json();
    narrativeText = json.narrativeText || narrativeText;
  } catch (err) {
    console.error('❌ JSON.parse() failed:', err);
  }
};

    await generateInterviewPdf({
      lang,
      sex: form.sex,
      interview: allAnswers,
      narrativeText
    });
  } catch (err) {
    console.error('❌ Błąd generowania PDF:', err);
    alert('Błąd podczas generowania PDF z wywiadu.');
  } finally {
    setGeneratingPdf(false);
  }
};
const handleGenerateNarrative = async () => {
  setNarrativeGenerating(true);
  try {
    const payload = {
      interviewData: allAnswers,
      goal: '',
      recommendation: '',
      lang
    };

    console.log('📤 Wysyłam do agent interviewNarrative:', payload);

    const response = await fetch('/api/interview-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const fullResult = await response.text();
    console.log('📩 Pełna odpowiedź od AI:', fullResult);

    if (!fullResult.trim()) {
      alert('⚠️ Pusta odpowiedź z AI. Spróbuj ponownie.');
      return;
    }

    const jsonMatch = fullResult.match(/```json\s*([\s\S]*?)```/);
    let parsed: Record<string, any> | null = null;

    if (jsonMatch && jsonMatch[1]) {
      let rawJson = jsonMatch[1].trim();
      try {
        parsed = JSON.parse(rawJson);
      } catch (e1) {
        try {
          const unescaped = JSON.parse(rawJson);
          parsed = JSON.parse(unescaped);
        } catch (e2) {
          console.error('❌ Podwójne parsowanie JSON zawiodło:', e2);
        }
      }
    }

    const summary = fullResult.split("```json")[0].trim();

    setNarrativeText(summary);
    setAllAnswers((prev: any) => ({
      ...prev,
      narrativeJson: parsed || null
    }));

  } catch (err) {
    console.error('❌ Błąd wywołania AI:', err);
    alert('Błąd połączenia z AI.');
  } finally {
    setNarrativeGenerating(false);
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
      const visible = shouldRenderQuestion(q, allAnswers, currentStep);
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
<div className="mt-6 flex flex-col gap-6">
  <div className="flex justify-between items-center flex-wrap gap-4">
    {currentStep > 0 && (
      <button
        className="bg-gray-300 hover:brightness-90 text-black font-semibold px-5 py-2.5 rounded-xl"
        onClick={back}
      >
        ⬅️ {tUI('back', lang)}
      </button>
    )}

    {isLastStep ? (
      <div className="flex gap-4 justify-end flex-wrap ml-auto">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="bg-green-500 hover:brightness-90 text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
        >
          {saving ? 'Zapisywanie...' : saved ? 'Zapisano ✓' : `✅ ${tUI('saveInterview', lang)}`}
        </button>

        <button
          onClick={handleGeneratePdfOnly}
          disabled={generatingPdf}
          className="bg-purple-600 hover:brightness-90 text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
        >
          {generatingPdf ? 'Generuję PDF...' : `🧾 ${tUI('generateInterviewPdf', lang)}`}
        </button>
      </div>
    ) : (
      <button
        className="ml-auto bg-blue-500 hover:brightness-90 text-white font-semibold px-5 py-2.5 rounded-xl"
        onClick={next}
      >
        {tUI('next', lang)} ➡️
      </button>
    )}
  </div>

  {isLastStep && (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">
        🧠 {tUI('interviewNarrativeLabel', lang) || 'Narracyjny opis pacjenta'}
      </label>

      <textarea
        className="w-full border rounded-xl px-4 py-3 text-sm leading-6
          bg-white text-black border-gray-300 placeholder:text-gray-500
          dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
        rows={6}
        value={narrativeText}
        onChange={(e) => setNarrativeText(e.target.value)}
        placeholder="Opis wygenerowany przez AI pojawi się tutaj..."
      />

      <button
        type="button"
        onClick={handleGenerateNarrative}
        disabled={narrativeGenerating}
        className="bg-blue-500 hover:brightness-90 text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
      >
        {narrativeGenerating
          ? tUI('generatingNarrativePending', lang)
          : tUI('generateNarrativeButton', lang)}
      </button>
    </div>
  )}
</div>
  </PanelCard>
  );
}


