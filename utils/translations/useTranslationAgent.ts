import { LangKey } from "@/utils/i18n";

const translationCache: Record<string, Record<LangKey, string>> = {};

export async function getTranslations(text: string): Promise<Record<LangKey, string>> {
  if (translationCache[text]) return translationCache[text];

  const fallback = {
    pl: text, en: text, es: text, fr: text, de: text,
    ua: text, ru: text, zh: text, hi: text, ar: text, he: text
  };

  try {
    if (typeof window !== "undefined") {
      // frontend → fetch
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
      // backend → dynamic import
      const { translatorAgent } = await import("@/agents/translationAgent");
      const result = await translatorAgent.run({ text });
      translationCache[text] = result as Record<LangKey, string>;
      return result;
    }
  } catch (err) {
    console.error("Translation fetch error:", err);
    return fallback;
  }
}

export async function getTranslation(text: string, lang: LangKey): Promise<string> {
  const all = await getTranslations(text);
  return all[lang] || text;
}
