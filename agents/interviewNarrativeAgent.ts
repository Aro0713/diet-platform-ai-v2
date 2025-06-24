import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function interviewNarrativeAgent({
  interviewData,
  goal,
  recommendation,
  lang
}: {
  interviewData: Record<string, any>;
  goal?: string;
  recommendation?: string;
  lang: string;
}): Promise<string> {
  const languageMap: Record<string, string> = {
    pl: 'polski', en: 'English', es: 'español', fr: 'français', de: 'Deutsch',
    ua: 'українська', ru: 'русский', zh: '中文', hi: 'हिन्दी', ar: 'العربية', he: 'עברית'
  };

  const selectedLang = languageMap[lang] || 'polski';

  const prompt = `
Language: ${selectedLang}

You are a clinical AI assistant.

Convert the following structured patient interview into:
A. A short paragraph (human-readable, suitable for a medical PDF)
B. A structured JSON block summarizing key dietary hints, patient priorities, and clinical concerns.

Input data:
${JSON.stringify(interviewData, null, 2).slice(0, 2500)}

Goal: ${goal}
Recommendation: ${recommendation}

Output:
1. One short paragraph (language: ${selectedLang})
2. Then a JSON block like:

\`\`\`json
{
  "keyFacts": ["insulinooporność", "słaby sen", "niska aktywność"],
  "dietHints": {
    "avoid": ["cukry proste", "przetworzona żywność"],
    "recommend": ["warzywa", "produkty pełnoziarniste"]
  },
  "dqChecks": {
    "preferModels": ["low-glycemic", "mediterranean"]
  }
}
\`\`\`
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });

  return response.choices[0].message.content || '';
}
