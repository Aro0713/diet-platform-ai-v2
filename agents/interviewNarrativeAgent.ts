import { Agent, tool } from '@openai/agents';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const languageMap: Record<string, string> = {
  pl: 'polski',
  en: 'English',
  es: 'español',
  fr: 'français',
  de: 'Deutsch',
  ua: 'українська',
  ru: 'русский',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
  he: 'עברית'
};

export const generateNarrativeTool = tool({
  name: 'generate_interview_narrative',
  description: 'Generates a short narrative summary based on interview data and doctor recommendations.',
  parameters: z.object({
    interviewData: z.record(z.string()),
    goal: z.string(),
    recommendation: z.string(),
    lang: z.string()
  }),
  async execute({ interviewData, goal, recommendation, lang }) {
    const selectedLang = languageMap[lang] || 'polski';

    const prompt = `
Language: ${selectedLang}

Convert the following structured patient interview data into a short, fluent narrative paragraph suitable for a PDF medical report.

Input:
- Interview data:
${JSON.stringify(interviewData, null, 2)}

- Diet goal: ${goal}
- Doctor's notes: ${recommendation}

Write only one natural paragraph in ${selectedLang}. Mention conditions, stress, sleep, activity, preferences if relevant. Avoid technical jargon.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a medical assistant writing PDF narratives for patients.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    });

    return completion.choices[0].message.content || '⚠️ Brak wygenerowanej narracji';
  }
});

export const interviewNarrativeAgent = new Agent({
  name: 'Interview Narrative Agent',
  instructions: 'Generate a medical narrative for the PDF based on patient interview.',
  tools: [generateNarrativeTool]
});
