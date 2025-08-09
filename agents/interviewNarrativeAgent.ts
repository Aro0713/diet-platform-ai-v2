import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type LangKey = "pl" | "en" | "es" | "fr" | "de" | "ua" | "ru" | "zh" | "hi" | "ar" | "he";

const languageMap: Record<LangKey | string, string> = {
  pl: "polski",
  en: "English",
  es: "español",
  fr: "français",
  de: "Deutsch",
  ua: "українська",
  ru: "русский",
  zh: "中文",
  hi: "हिन्दी",
  ar: "العربية",
  he: "עברית",
};

export async function interviewNarrativeAgent({
  interviewData,
  goal,
  recommendation,
  lang,
}: {
  interviewData: Record<string, any>;
  goal?: string;
  recommendation?: string;
  lang: LangKey | string;
}): Promise<string> {
  const selectedLang = (languageMap[lang] ?? "polski") as string;

  // Gender forms
  const isMale = String(interviewData?.sex || "").toLowerCase() === "male";
  const genderNote = isMale
    ? "The patient is male. Always use masculine grammatical forms. Do NOT mention menstruation, pregnancy, PCOS, menopause, or HRT."
    : "The patient is female. If interview data includes menstruation, pregnancy, PCOS, menopause, or HRT, you may mention them.";

  const prompt = `
You are a clinical nutrition AI assistant.

Your task:
- Read the provided structured interview data.
- Generate a single, coherent narrative text in ${selectedLang}.
- Use a clear, professional tone.
- Only include information actually present in the interview data — do not invent or speculate.
- Do not output JSON, bullet lists, code blocks, headings, or technical field names.
- Do not mention "no data" or "not provided" — simply omit missing information.
- Organize the narrative into natural paragraphs.
- Avoid repetition.

Mandatory gender rule:
${genderNote}

If present, you may include:
- dietary goal and doctor's recommendation
- dietary history, preferences, intolerances
- chronic, hormonal, digestive conditions, medications
- stress, sleep, activity level, job type
- addictions (smoking, alcohol, energy drinks, coffee)
- eating habits (snacks, sweets, processed foods, vegetables, fiber)
- number of meals and exact times
- motivation, barriers, cooking time and budget

Interview data (JSON is for your reference only — do NOT quote it or describe its structure):
${JSON.stringify(interviewData, null, 2).slice(0, 8000)}

Dietary goal: ${goal ?? ""}
Doctor's recommendation: ${recommendation ?? ""}
`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a precise, professional clinical dietitian. You only write a factual narrative based on the provided data. You never output technical data, JSON, lists, or code.",
      },
      { role: "user", content: prompt },
    ],
  });

  return resp.choices[0]?.message?.content?.trim() || "";
}
