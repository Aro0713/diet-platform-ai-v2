import OpenAI from "openai";
import { nutrientRequirementsMap } from "@/utils/nutrientRequirementsMap";
import { testReferenceValues } from "@/components/testReferenceValues";

// 🔹 Typ dla wartości w testReferenceValues (string lub obiekt z zakresem)
type TestRefValue = string | { unit?: string; normalRange?: string };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


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

  // 🔹 1. Wyszukiwanie zakresów mikro/makro dla wszystkich zaznaczonych chorób
  const mergedRequirements: Record<string, { min: number; max: number }> = {};
  selectedConditions.forEach(cond => {
    const reqs = nutrientRequirementsMap[cond];
    if (reqs) {
      Object.entries(reqs).forEach(([nutrient, range]) => {
        if (!mergedRequirements[nutrient]) {
          mergedRequirements[nutrient] = { ...range };
        } else {
          // Bierz najbardziej restrykcyjne zakresy
          mergedRequirements[nutrient].min = Math.max(
            mergedRequirements[nutrient].min,
            range.min
          );
          mergedRequirements[nutrient].max = Math.min(
            mergedRequirements[nutrient].max,
            range.max
          );
        }
      });
    }
  });

  // 🔹 2. Sprawdzanie odchyleń w wynikach laboratoryjnych
  const abnormalities: string[] = [];
 Object.entries(testResults).forEach(([testName, value]) => {
  const ref = testReferenceValues[testName] as TestRefValue;
  if (!ref) return;

  const numericVal = parseFloat((value || "").toString().replace(",", "."));
  const refText =
    typeof ref === "string"
      ? ref
      : `${ref.normalRange || ""} ${ref.unit || ""}`.trim();

  if (typeof ref !== "string" && ref.normalRange) {
    const match = ref.normalRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      if (!isNaN(numericVal)) {
        if (numericVal < min) abnormalities.push(`${testName}: low (${value}, ref ${refText})`);
        if (numericVal > max) abnormalities.push(`${testName}: high (${value}, ref ${refText})`);
      }
    }
  }
});

  // 🔹 3. Budowanie promptu
  const prompt = `
You are a professional medical lab assistant AI.

Patient has submitted:
- Lab test results: ${JSON.stringify(testResults, null, 2)}
- Out-of-range findings: ${abnormalities.length ? abnormalities.join("; ") : "None"}
- Medical description: "${description}"
- Diagnosed conditions: ${selectedConditions.join(", ") || "None"}
- Nutrient requirement ranges (from database): ${JSON.stringify(mergedRequirements, null, 2)}
- Language of output: ${lang}

Your tasks:
1. Analyze the lab test results and description in context of the patient's diagnosed conditions.
2. Highlight any abnormalities and explain why they matter for these conditions.
3. Link abnormalities to specific dietary risks or recommendations.
4. Give *specific* micro/macro nutrient guidance based on the provided ranges.
5. Return 2 parts:

---

**A. Clinical summary** (in ${lang})
- Mention what is out of range and why it matters.
- Mention dietary and supplementation changes with clear reasoning.
- Be concise but evidence-based.

---

**B. JSON block** (for diet engine)

\`\`\`json
{
  "risks": ["..."],
  "warnings": ["..."],
  "dietHints": {
    "avoid": ["..."],
    "recommend": ["..."]
  },
  "dqChecks": {
    "avoidIngredients": ["..."],
    "preferModels": ["..."],
    "recommendMacros": ["..."],
    "avoidMacros": ["..."],
    "recommendMicros": ["..."],
    "avoidMicros": ["..."]
  }
}
\`\`\`

Instructions:
- Always output both parts.
- Tailor advice to *all* conditions and abnormalities.
- Use only evidence-based medical and dietetic guidance.
`;

  // 🔹 4. Zapytanie do GPT
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  return completion.choices[0].message.content || "⚠️ No output";
}
