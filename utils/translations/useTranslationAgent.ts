import { LangKey } from "@/utils/i18n";
import { translatorAgent } from "@/agents/translationAgent"; // fallback do użycia OpenAI na backendzie

const translationCache: Record<string, Record<LangKey, string>> = {};

export async function getTranslations(text: string): Promise<Record<LangKey, string>> {
  if (translationCache[text]) return translationCache[text];

  try {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
      const base = process.env.NEXT_PUBLIC_BASE_URL || "";
      const url = `${base}/api/translate`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      translationCache[text] = json;
      return json;
    } else {
      // Backend: bez fetchowania — bezpiecznie użyj bezpośrednio agenta
      const result = await translatorAgent.run({ text });
      translationCache[text] = result as Record<LangKey, string>;
      return result;
    }
  } catch (err) {
    console.error("Translation error (fallback):", err);
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
