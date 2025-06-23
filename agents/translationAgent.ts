import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function translateText(text: string): Promise<Record<string, string>> {
  const prompt = `
Translate the following text into 11 languages and return only valid JSON, without markdown:

{
  "pl": "...",
  "en": "...",
  "es": "...",
  "fr": "...",
  "de": "...",
  "ua": "...",
  "ru": "...",
  "zh": "...",
  "hi": "...",
  "ar": "...",
  "he": "..."
}

TEXT:
"${text}"
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a multilingual translator for a clinical nutrition app." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });

  const raw = result.choices[0].message.content || "";

  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}") + 1;
    const cleaned = raw.slice(jsonStart, jsonEnd);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("❌ Failed to parse GPT response:", raw);
    throw new Error("GPT returned invalid JSON");
  }
}

