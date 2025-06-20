import { LangKey } from "@/utils/i18n";

const translationCache: Record<string, Record<LangKey, string>> = {};

export async function getTranslations(text: string): Promise<Record<LangKey, string>> {
  if (translationCache[text]) return translationCache[text];

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    translationCache[text] = json;
    return json;
  } catch (err) {
    console.error("Translation fetch error:", err);
    return {
      pl: text, en: text, es: text, fr: text, de: text,
      ua: text, ru: text, zh: text, hi: text, ar: text, he: text
    };
  }
}

export async function getTranslation(text: string, lang: LangKey): Promise<string> {
  const all = await getTranslations(text);
  return all[lang] || text;
}
