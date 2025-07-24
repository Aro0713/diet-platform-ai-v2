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

const isMale = interviewData?.sex === 'male';
const genderNote = isMale
  ? "⚠️ Patient is male. Do NOT include anything about menstruation, pregnancy, PCOS, menopause or HTZ. Use masculine grammatical forms only."
  : "Patient is female. Analyze section 8 (menstruation, pregnancy, PCOS, menopause, HTZ). Use feminine grammatical forms.";
  
const prompt = `
Language: ${selectedLang}

You are a clinical AI assistant.

Your task is to analyze the entire structured patient interview and generate two outputs:

---

1. **Narrative Summary (in ${selectedLang})**

- Mention data from each section:
  - Goal of diet
  - Dietary history
  - Health conditions (chronic, hormonal, digestive, medications)
  - Stress, sleep, activity, job type
  - Addictions (smoking, alcohol, energy drinks)
  - Eating habits (snacks, sweets, breakfast, meat, vegetables, fiber, processed food)
  - Meal frequency and specific times (e.g., 07:00, 10:00...)
  - Motivation, barriers, time and budget for cooking

- If patient is female, analyze section 8:
  - Mention menstruation, hormonal disorders (e.g., PCOS), pregnancy, menopause, HTZ

- Use clear, professional tone. Mention explicitly if data is missing.

---

2. **Structured JSON summary** like this:

\\\`\\\`\\\`json
{
  "keyFacts": [
    "wysoki poziom stresu",
    "PCOS",
    "ciąża",
    "regularne 4 posiłki dziennie",
    "godziny posiłków: 07:00, 10:00, 15:00, 19:00"
  ],
  "mealTiming": {
    "mealsPerDay": 4,
    "preferredHours": ["07:00", "10:00", "15:00", "19:00"]
  },
  "dietHints": {
    "avoid": ["słodycze", "żywność wysoko przetworzona", "nadmiar soli"],
    "recommend": ["warzywa", "produkty pełnoziarniste", "dieta niskoglikemiczna", "fitoestrogeny"]
  },
  "dqChecks": {
    "preferModels": ["low glycemic", "pregnancy-safe", "anti-inflammatory"],
    "avoidModels": []
  }
}
\\\`\\\`\\\`

---

Patient Interview (JSON):
${JSON.stringify(interviewData, null, 2).slice(0, 5000)}

Dietary goal: ${goal}
Doctor's recommendation: ${recommendation || 'None'}

---

Rules:
- Be 100% precise.
- Do not skip any section.
- Include even partial or ambiguous answers.
- Output starts with paragraph (in ${selectedLang}), then JSON block.
- Output must be copyable into medical PDF or exported as JSON.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });

  return response.choices[0].message.content || '';
}
