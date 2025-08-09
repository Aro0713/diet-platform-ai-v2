import OpenAI from "openai";
import { nutrientRequirementsMap } from "@/utils/nutrientRequirementsMap";
import { testReferenceValues } from "@/components/testReferenceValues";

// 🔹 Dozwolone typy referencji (w components masz stringi; zostawiam unię na przyszłość)
type TestRefValue = string | { unit?: string; normalRange?: string };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Parsuje z referencji zakres liczbowy (np. "70–99 mg/dL" albo "0.4–4.0 mIU/L") */
function parseRange(ref: TestRefValue): { min: number; max: number; unit?: string } | null {
  if (!ref) return null;

  if (typeof ref === "string") {
    // wyciągnij min–max
    const m = ref.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    const min = parseFloat(m[1].replace(",", "."));
    const max = parseFloat(m[2].replace(",", "."));
    // spróbuj wyłuskać jednostkę (pierwsze słowo-znak po zakresie)
    const after = ref.slice(m.index! + m[0].length).trim();
    const unit = after || undefined; // nie zawsze trafimy dokładnie w samą jednostkę – to i tak opisowe
    return { min, max, unit };
  } else if (ref.normalRange) {
    const m = ref.normalRange.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    const min = parseFloat(m[1].replace(",", "."));
    const max = parseFloat(m[2].replace(",", "."));
    return { min, max, unit: ref.unit };
  }
  return null;
}

/** Zwraca mapę: nazwa badania -> tekst referencji (np. "70–99 mg/dL") */
function buildRefRangeTextMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, vRaw] of Object.entries(testReferenceValues)) {
  const v = vRaw as TestRefValue;
  out[k] = typeof v === "string" ? v : [v.normalRange, v.unit].filter(Boolean).join(" ");
}
  return out;
}

export async function medicalLabAgent({
  testResults,
  description,
  lang,
  selectedConditions
}: {
  testResults: Record<string, string>;
  description: string;
  lang: string;
  selectedConditions: string[];
}): Promise<string> {
  // 1) Złącz wymagania mikro/makro dla wszystkich chorób (najbardziej restrykcyjne)
  const mergedRequirements: Record<string, { min: number; max: number }> = {};
  for (const cond of selectedConditions || []) {
    const reqs = nutrientRequirementsMap[cond];
    if (!reqs) continue;
    for (const [nutrient, range] of Object.entries(reqs)) {
      if (!mergedRequirements[nutrient]) {
        mergedRequirements[nutrient] = { min: range.min, max: range.max };
      } else {
        mergedRequirements[nutrient].min = Math.max(mergedRequirements[nutrient].min, range.min);
        mergedRequirements[nutrient].max = Math.min(mergedRequirements[nutrient].max, range.max);
      }
    }
  }

  // 2) Wykryj odchylenia
  const abnormalities: string[] = [];
  const refRangeText = buildRefRangeTextMap();

  for (const [testName, rawVal] of Object.entries(testResults || {})) {
    const ref = testReferenceValues[testName] as TestRefValue | undefined;
    if (!ref) continue;

    const parsedVal = parseFloat(String(rawVal).replace(",", "."));
    if (Number.isNaN(parsedVal)) continue;

    const range = parseRange(ref);
    const refText = refRangeText[testName] || "";

    if (range) {
      if (parsedVal < range.min) abnormalities.push(`${testName}: low (${rawVal}, ref ${refText})`);
      if (parsedVal > range.max) abnormalities.push(`${testName}: high (${rawVal}, ref ${refText})`);
    }
  }

  // 3) Prompt — bez nagłówków; najpierw opis kliniczny, potem JSON w płocie
  const fenceJson = "```json";
  const fenceEnd = "```";

  const prompt = `
You are a professional medical lab assistant AI working **inside a digital dietetics platform**.

Patient provided:
- Lab test results: ${JSON.stringify(testResults, null, 2)}
- Out-of-range findings: ${abnormalities.length ? abnormalities.join("; ") : "None"}
- Medical description: "${description}"
- Diagnosed conditions: ${selectedConditions?.length ? selectedConditions.join(", ") : "None"}
- Enforce these micro/macro ranges (merged, most restrictive): ${JSON.stringify(mergedRequirements, null, 2)}
- Output language: ${lang}

Your job:
1) Write a short, clinically precise **plain text** analysis in ${lang} (no heading, no labels). 
   - Explain key abnormalities and why they matter **for the listed conditions**.
   - Provide evidence-based dietary & supplementation guidance that **the platform will apply automatically**.
   - Do **NOT** suggest visiting a dietitian or external professional; this platform handles diet creation.

2) Immediately after the text, return a **fenced JSON** block for the diet engine. 
   - Keep keys and structure stable.
   - Include the merged ranges as "enforceRanges" so the diet generator must respect them.
   - Include "refRanges" for labs so downstream agents can annotate feedback.

${fenceJson}
{
  "risks": [],                      // e.g. ["electrolyte imbalance", "malabsorption"]
  "warnings": [],                   // clinical cautions to surface in UI
  "dietHints": {
    "avoid": [],                    // food groups/ingredients to limit
    "recommend": []                 // foods/nutrients to emphasize
  },
  "dqChecks": {
    "avoidIngredients": [],
    "preferModels": [],             // e.g. ["low sodium", "fodmap"]
    "avoidModels": [],
    "recommendMacros": [],          // strings like "high fiber", "moderate protein"
    "avoidMacros": [],
    "recommendMicros": [],          // e.g. ["magnesium", "potassium", "vitamin D"]
    "avoidMicros": []
  },
  "clinicalRules": {
    "hydration": { "minFluidsMlPerDay": 0, "oralRehydrationPreferred": false },
    "notes": []                     // short clinical implementation notes for downstream agent
  },
  "refRanges": ${JSON.stringify(refRangeText, null, 2)},
  "enforceRanges": ${JSON.stringify(mergedRequirements, null, 2)}
}
${fenceEnd}

Constraints:
- First: the **plain text** analysis in ${lang}. No title lines.
- Second: the fenced JSON, exactly as shown above (you may fill arrays/values based on findings).
- Be concise, clinical, specific, and consistent with abnormalities and conditions.
`;

  // 4) Call model
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  return completion.choices[0].message.content || "Brak odpowiedzi.";
}
