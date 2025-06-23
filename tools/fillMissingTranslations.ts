import { LangKey, languageLabels } from "../utils/i18n";
import { translationsUI } from "../utils/translationsUI";
import { medicalUI } from "../utils/translations/translationsConditions";
import { translatorAgent } from '../agents/translationAgent';

// 🧠 Języki do pokrycia
const LANGS: LangKey[] = [
  "pl", "en", "es", "fr", "de",
  "ua", "ru", "zh", "hi", "ar", "he"
];

// 🔁 Sprawdza brakujące tłumaczenia dla źródła
async function processSource(
  label: string,
  source: Record<string, Record<LangKey, string>>
) {
  console.log(`\n🔍 Sprawdzam brakujące tłumaczenia w: ${label}`);

  const missingEntries: Record<string, LangKey[]> = {};

  for (const key in source) {
    const entry = source[key];
    const missing = LANGS.filter((lang) => !entry[lang]);
    if (missing.length > 0) {
      missingEntries[key] = missing;
    }
  }

  const totalMissing = Object.keys(missingEntries).length;
  if (totalMissing === 0) {
    console.log(`✅ ${label} — kompletne tłumaczenia`);
    return;
  }

  console.log(`❗ Znaleziono ${totalMissing} kluczy z brakami. Uzupełniam...`);

  for (const key of Object.keys(missingEntries)) {
    const base = source[key].pl || source[key].en || Object.values(source[key])[0];
    if (!base) {
      console.warn(`⚠️ Pomijam pusty klucz: ${key}`);
      continue;
    }

    try {
      const result = await translatorAgent.run({ text: base });

      for (const lang of missingEntries[key]) {
        source[key][lang] = result[lang] || base;
      }

      console.log(`✅ ${key} → uzupełniono: ${missingEntries[key].join(", ")}`);
    } catch (err) {
      console.error(`❌ Błąd tłumaczenia dla "${key}":`, err);
    }
  }

  console.log(`\n📝 Uzupełnione tłumaczenia dla "${label}". Możesz teraz zaktualizować plik ręcznie.`);
}

// 🚀 Start
(async () => {
  await processSource("translationsUI", translationsUI);
  await processSource("medicalUI", medicalUI);
})();
