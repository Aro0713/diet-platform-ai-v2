import OpenAI from "openai";
import { nutrientRequirementsMap } from "@/utils/nutrientRequirementsMap";
import { testReferenceValues } from "@/components/testReferenceValues";

// 🔹 Dozwolone typy referencji
type TestRefValue = string | { unit?: string; normalRange?: string };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Prosty (fallback) parser min–max z referencji */
function parseRange(ref: TestRefValue): { min: number; max: number; unit?: string } | null {
  if (!ref) return null;

  if (typeof ref === "string") {
    const m = ref.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    const min = parseFloat(m[1].replace(",", "."));
    const max = parseFloat(m[2].replace(",", "."));
    const after = ref.slice(m.index! + m[0].length).trim();
    const unit = after || undefined;
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

/** Mapa: badanie -> tekst referencji (do UI) */
function buildRefRangeTextMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, vRaw] of Object.entries(testReferenceValues as Record<string, TestRefValue>)) {
    const v = vRaw as TestRefValue;
    out[k] = typeof v === "string" ? v : [v.normalRange, v.unit].filter(Boolean).join(" ").trim();
  }
  return out;
}

/* ------------------------- 🔧 HELPERY (aliasy/jednostki/sygnały) ------------------------- */

// Normalizacja stringów
function norm(s: string) {
  return String(s)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9%()/\.]+/g, " ")
    .trim();
}

// Aliasowanie nazw badań (po lewej – warianty, po prawej – kanoniczny klucz z testReferenceValues)
const TEST_ALIASES_RAW: Record<string, string> = {
  "glukoza": "glucose",
  "glukoza na czczo": "glucose",
  "cukier": "glucose",
  "cholesterol calkowity": "total_cholesterol",
  "cholesterol calk": "total_cholesterol",
  "hdl": "HDL",
  "ldl": "LDL",
  "triglicerydy": "triglycerides",
  "tsh": "TSH",
  "ft3": "FT3",
  "ft4": "FT4",
  "zelazo": "iron",
  "ferrytyna": "ferritin",
  "witamina d": "vitamin_d_25oh",
  "25(oh)d": "vitamin_d_25oh",
  "kreatynina": "creatinine"
};

const TEST_ALIASES: Record<string, string> = Object.entries(TEST_ALIASES_RAW)
  .reduce((acc, [k, v]) => { acc[norm(k)] = v; return acc; }, {} as Record<string, string>);

function canonicalTestKey(raw: string): string {
  const n = norm(raw);
  return TEST_ALIASES[n] ?? raw;
}

// Parsowanie wartości i potencjalnej jednostki z wpisu pacjenta
function parseValueUnit(input: string | number): { value: number | null; unit?: string } {
  if (typeof input === "number") return { value: input, unit: undefined };
  const s = String(input).trim();
  // np. "> 7,0 mmol/L", "130 mg/dL", "58 %", "5.1"
  const m = s.match(/([<>]=?|≤|≥)?\s*(-?\d+(?:[.,]\d+)?)/);
  const value = m ? parseFloat(m[2].replace(",", ".")) : null;
  const rest = m ? s.slice(m.index! + m[0].length) : "";
  const unitMatch = rest.match(/([a-zA-Z%µ/]+(?:\/[a-zA-Z]+)?)/);
  const unit = unitMatch ? unitMatch[1] : (/%/.test(s) ? "%" : undefined);
  return { value, unit };
}

// Bardziej odporny parser referencji (≤/≥/< /> oraz min–max)
type Range = { min?: number; max?: number; unit?: string };
function parseRefRangeAdvanced(ref: TestRefValue): Range | null {
  if (!ref) return null;
  const text = typeof ref === "string" ? ref : [ref.normalRange, ref.unit].filter(Boolean).join(" ");
  const s = text.replace(",", ".");
  // min–max
  let m = s.match(/(-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)/);
  if (m) {
    const unit = s.slice(m.index! + m[0].length).match(/([a-zA-Z%µ/]+)/)?.[1];
    return { min: parseFloat(m[1]), max: parseFloat(m[2]), unit };
  }
  // ≤ max
  m = s.match(/(?:≤|<=)\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { max: parseFloat(m[1]), unit: s.match(/([a-zA-Z%µ/]+)/)?.[1] };
  // ≥ min
  m = s.match(/(?:≥|>=)\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { min: parseFloat(m[1]), unit: s.match(/([a-zA-Z%µ/]+)/)?.[1] };
  // < max
  m = s.match(/<\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { max: parseFloat(m[1]), unit: s.match(/([a-zA-Z%µ/]+)/)?.[1] };
  // > min
  m = s.match(/>\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { min: parseFloat(m[1]), unit: s.match(/([a-zA-Z%µ/]+)/)?.[1] };
  return null;
}

// Konwersje jednostek dla kluczowych badań
type UnitConv = (v: number) => number;
const UNIT_CONVERSIONS: Record<string, Record<string, UnitConv>> = {
  glucose: { "mmol/L->mg/dL": v => v * 18, "mg/dL->mmol/L": v => v / 18 },
  total_cholesterol: { "mmol/L->mg/dL": v => v * 38.67, "mg/dL->mmol/L": v => v / 38.67 },
  LDL: { "mmol/L->mg/dL": v => v * 38.67, "mg/dL->mmol/L": v => v / 38.67 },
  HDL: { "mmol/L->mg/dL": v => v * 38.67, "mg/dL->mmol/L": v => v / 38.67 },
  triglycerides: { "mmol/L->mg/dL": v => v * 88.57, "mg/dL->mmol/L": v => v / 88.57 }
};

function convertIfNeeded(testKey: string, value: number, fromUnit?: string, toUnit?: string): { value: number; note?: string } {
  if (!fromUnit || !toUnit || fromUnit === toUnit) return { value };
  const map = UNIT_CONVERSIONS[testKey];
  const path = `${fromUnit}->${toUnit}`;
  if (map && map[path]) return { value: map[path](value) };
  return { value, note: `Unit mismatch: ${fromUnit} vs ${toUnit} (no converter)` };
}

type Class = "low" | "high" | "normal" | "unknown";
function classify(value: number, range: Range): Class {
  if (range.min != null && value < range.min) return "low";
  if (range.max != null && value > range.max) return "high";
  if (range.min == null && range.max == null) return "unknown";
  return "normal";
}

// Ekstrakcja ciśnienia tętniczego z opisu (np. "180, 90", "180/90", "180 90")
function extractBloodPressures(text: string): Array<{ systolic: number; diastolic: number }> {
  const res: Array<{ systolic: number; diastolic: number }> = [];
  const s = (text || "").replace(",", "/");
  const re = /(\d{2,3})\s*[\/ ]\s*(\d{2,3})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const sys = parseInt(m[1], 10);
    const dia = parseInt(m[2], 10);
    if (!Number.isNaN(sys) && !Number.isNaN(dia)) res.push({ systolic: sys, diastolic: dia });
  }
  return res;
}

// Detekcja prostych słów-kluczy z opisu (bez mapowania zaleceń)
function extractKeywords(text: string): string[] {
  const t = norm(text || "");
  const keys = ["arytmia", "szmery", "udar", "zawal", "nadcisnienie", "insulinoopornosc", "cukrzyca", "nerki", "kreatynina", "ekg", "padaczka", "epilepsja"];
  return keys.filter(k => t.includes(k));
}

/* ------------------------- 🔧 KONIEC HELPERÓW ------------------------- */

export async function medicalLabAgent({
  testResults,
  description,
  lang,
  selectedConditions
}: {
  testResults: Record<string, string | number>;
  description: string;
  lang: string;
  selectedConditions: string[];
}): Promise<string> {
  // 1) Złącz wymagania mikro/makro dla wszystkich chorób (najbardziej restrykcyjne)
  const mergedRequirements: Record<string, { min: number; max: number }> = {};
  for (const cond of selectedConditions || []) {
    const reqs = (nutrientRequirementsMap as any)[cond] as Record<string, { min: number; max: number }> | undefined;
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

  // 2) Wykryj odchylenia (aliasy + konwersja jednostek + status per badanie)
  const abnormalities: string[] = [];
  const labStatus: Record<string, {
    displayName: string;
    value: number | null;
    unit?: string;
    refMin?: number;
    refMax?: number;
    refUnit?: string;
    class: Class;
  }> = {};
  const unmatchedTests: string[] = [];
  const unitWarnings: string[] = [];
  const refRangeText = buildRefRangeTextMap();

  for (const [testNameRaw, rawVal] of Object.entries(testResults || {})) {
    const testKey = canonicalTestKey(testNameRaw);
    const ref = (testReferenceValues as Record<string, TestRefValue | undefined>)[testKey];

    const { value: parsedValRaw, unit: valUnit } = parseValueUnit(rawVal as any);
    if (parsedValRaw == null || Number.isNaN(parsedValRaw)) {
      labStatus[testKey] = {
        displayName: String(testNameRaw),
        value: null,
        unit: valUnit,
        class: "unknown"
      };
      continue;
    }

    if (!ref) {
      unmatchedTests.push(String(testNameRaw));
      labStatus[testKey] = {
        displayName: String(testNameRaw),
        value: parsedValRaw,
        unit: valUnit,
        class: "unknown"
      };
      continue;
    }

    const range = parseRefRangeAdvanced(ref) || parseRange(ref);
    const refText = refRangeText[testKey] || "";
    const refUnit = range?.unit;

    let { value: parsedVal, note } = convertIfNeeded(testKey, parsedValRaw, valUnit, refUnit);
    if (note) unitWarnings.push(`${testNameRaw}: ${note}; ref="${refText}"`);

    const cls = range ? classify(parsedVal, range) : "unknown";
    labStatus[testKey] = {
      displayName: String(testNameRaw),
      value: parsedVal,
      unit: refUnit ?? valUnit,
      refMin: range?.min,
      refMax: range?.max,
      refUnit,
      class: cls
    };

    if (cls === "low") abnormalities.push(`${testNameRaw}: low (${parsedValRaw}${valUnit ? " " + valUnit : ""}, ref ${refText})`);
    if (cls === "high") abnormalities.push(`${testNameRaw}: high (${parsedValRaw}${valUnit ? " " + valUnit : ""}, ref ${refText})`);
  }

  // 3) Wyciągnij sygnały z opisu (np. BP i słowa-klucze)
  const bpMeasurements = extractBloodPressures(description || "");
  const keywords = extractKeywords(description || "");

  // 4) Prompt – zero twardych map; model generuje rekomendacje dla dowolnych chorób/odchyleń
  const fenceJson = "```json";
  const fenceEnd = "```";

  const prompt = `
You are a professional medical lab assistant AI working **inside a digital dietetics platform**.

INPUT DATA (structured):
- Output language: ${lang}
- Diagnosed/selected conditions: ${selectedConditions?.length ? selectedConditions.join(", ") : "None"}
- Lab test results (raw as entered): ${JSON.stringify(testResults, null, 2)}
- Parsed lab status (normalized): ${JSON.stringify(labStatus, null, 2)}
- Out-of-range findings (computed): ${abnormalities.length ? abnormalities.join("; ") : "None"}
- Reference ranges (for UI): ${JSON.stringify(refRangeText, null, 2)}
- Merged nutrient ranges to ENFORCE (hard constraints for diet generator): ${JSON.stringify(mergedRequirements, null, 2)}
- Clinical description (free text): "${description}"
- Derived signals from description:
  - Blood pressure readings: ${JSON.stringify(bpMeasurements)}
  - Keywords: ${JSON.stringify(keywords)}
- Unmatched tests (no reference found): ${JSON.stringify(unmatchedTests)}
- Unit warnings: ${JSON.stringify(unitWarnings)}

STRICT RULES:
1) If ANY "labStatus" entry has class "low" or "high", your **first sentence MUST state that abnormalities are present** in ${lang}. Never claim "all normal" in that case.
2) Keep the narrative **consistent** with "labStatus", BP readings, and listed conditions. Do not contradict them.
3) Produce **specific, clinically coherent dietary recommendations for ANY abnormality/condition** (no closed catalog):
   - **macros** (fiber/protein/carbs/fats/sodium/potassium, etc.) with clear direction (increase/decrease/moderate),
   - **micros** (vitamins/minerals/omega-3 etc.) with direction,
   - **food groups** to emphasize/limit with 2–5 concrete examples each.
   For every item include a short **rationale** and **linksTo** (e.g., ["glucose", "Nadciśnienie tętnicze"]).
4) Reflect comorbidity conflicts: if a plausible recommendation may conflict with "enforceRanges" or another condition, put it into **"conflicts"** with an explanation and **do not** add it to recommendations.
5) Deduplicate items; prefer precise terms in ${lang}. No generic advice like "eat healthy".
6) Return at least:
   - 3 macro recommendations (if relevant),
   - 4 micro recommendations across different nutrients (if relevant),
   - 3 food groups to emphasize and 3 to limit (if relevant). If not applicable, explain why in "clinicalRules.notes".
7) The JSON must follow the exact schema below.

OUTPUT FORMAT (two parts):
A) First: a concise clinical narrative in ${lang} (no headings).
B) Immediately after: a fenced JSON with this exact top-level structure:

${fenceJson}
{
  "labStatus": ${JSON.stringify(labStatus, null, 2)},
  "recommendations": {
    "macros": [
      { "name": "", "direction": "increase|decrease|moderate", "rationale": "", "linksTo": ["<testKey or condition>"], "confidence": 0.0 }
    ],
    "micros": [
      { "name": "", "direction": "increase|decrease", "rationale": "", "linksTo": ["<testKey or condition>"], "confidence": 0.0 }
    ],
    "foods": {
      "emphasize": [
        { "group": "", "examples": [], "rationale": "", "linksTo": ["<testKey or condition>"], "confidence": 0.0 }
      ],
      "limit": [
        { "group": "", "examples": [], "rationale": "", "linksTo": ["<testKey or condition>"], "confidence": 0.0 }
      ]
    }
  },
  "dietHints": { "avoid": [], "recommend": [] },
  "dqChecks": {
    "avoidIngredients": [],
    "preferModels": [],
    "avoidModels": [],
    "recommendMacros": [],
    "avoidMacros": [],
    "recommendMicros": [],
    "avoidMicros": []
  },
  "clinicalRules": {
    "hydration": { "minFluidsMlPerDay": 0, "oralRehydrationPreferred": false },
    "notes": []
  },
  "refRanges": ${JSON.stringify(refRangeText, null, 2)},
  "enforceRanges": ${JSON.stringify(mergedRequirements, null, 2)},
  "conflicts": [],
  "unmatchedTests": ${JSON.stringify(unmatchedTests)},
  "unitWarnings": ${JSON.stringify(unitWarnings)}
}
${fenceEnd}

FILLING GUIDANCE (not a fixed mapping, just expectations):
- Base all proposals on the exact abnormalities (e.g., high glucose, dyslipidemia, high creatinine) and any conditions (e.g., CKD, celiac, epilepsy, pregnancy, heart failure, thyroid disorders).
- Use explicit Polish names for foods/nutrients when ${lang} is "pl". 
- Be specific (e.g., "zwiększ błonnik rozpuszczalny" zamiast "jedz więcej błonnika", "ogranicz sód <2 g/d").
`;

  // 5) Wywołanie modelu
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  return completion.choices[0].message.content || "Brak odpowiedzi.";
}
