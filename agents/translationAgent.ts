import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function translateText(text: string): Promise<Record<string, string>> {
  const prompt = `
Translate the following text into 11 languages and return raw JSON:
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
\"${text}\"
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a multilingual translator for a clinical nutrition app." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });

  return JSON.parse(result.choices[0].message.content ?? "{}");
}
