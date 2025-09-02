// agents/interviewNarrativeAgent.ts
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

function prune(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) {
    const arr = obj.map(prune).filter(v =>
      v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "")
    );
    return arr.length ? arr : undefined;
  }
  if (typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const pv = prune(v);
      if (
        pv !== undefined &&
        !(typeof pv === "string" && pv.trim() === "") &&
        !(Array.isArray(pv) && pv.length === 0)
      ) out[k] = pv;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return obj;
}

function serializeForPrompt(obj: any, limit = 30000): string { // ↑ z 8000 na 30000
  try {
    const cleaned = prune(obj) ?? {};
    const json = JSON.stringify(cleaned, null, 2);
    return json.length > limit ? json.slice(0, limit) : json;
  } catch {
    return String(obj ?? "");
  }
}

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

  const prompt = `
You are a clinical nutrition AI assistant.

Write a single coherent narrative in ${selectedLang}.
Address the user directly in respectful second person singular (e.g., in Polish: "Zgłaszasz", "Deklarujesz", "Spożywasz"; in English: "You ...").
Do NOT refer to the user as "the patient" / "pacjent" / "pacjentka". Do not mention gender.

Use a clear, professional but friendly tone.
Base every sentence strictly on the provided data; do NOT invent, infer, generalize, or speculate.
Do NOT output JSON, bullet lists, code blocks, headings, or technical field names.
Do not mention missing data; simply omit it.
Organize the narrative into natural paragraphs and avoid repetition.

STRICT RULES (very important):
- State a diagnosis only if there is an explicit diagnosis/conditions field.
  If a condition appears only in recommendations/notes/free-text, describe it as an instruction/recommendation, NOT as a diagnosis.
- Do NOT add habits or traits that are not in the data (e.g., motivation, avoiding sweets or processed foods).
- Copy exact times and counts (e.g., meal times, number of meals) as provided.
- If foods are listed as problematic/undesired, present them as such; do not reframe them.
- Keep it concise, factual, and directly grounded in the provided data.

Interview data (for your reference only — do NOT quote or describe its structure):
${serializeForPrompt(interviewData)}

Dietary goal: ${goal ?? ""}
Doctor's recommendation: ${recommendation ?? ""}
`.trim();

const messages = [
  {
    role: "system" as const,
    content:
      "You are a precise, professional clinical dietitian. You write directly to the user in respectful second person. You base every sentence strictly on the provided data. You never output lists, JSON, or code.",
  },
  { role: "user" as const, content: prompt },
];

const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages,
    stream: true,
  });

  let out = "";
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) out += delta;
  }
  return out.trim();
}

export default interviewNarrativeAgent;
