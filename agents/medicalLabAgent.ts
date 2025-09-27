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
function buildRefRangeTextMapForTests(testKeys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const seen = new Set<string>();
  for (const rawKey of testKeys) {
    const { test } = splitFieldKey(rawKey);
    const key = canonicalTestKey(test);
    if (seen.has(key)) continue;
    const v = (testReferenceValues as any)[key] as TestRefValue | undefined;
    if (!v) continue;
    out[key] = typeof v === "string" ? v : [v.normalRange, v.unit].filter(Boolean).join(" ").trim();
    seen.add(key);
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
  "witamina d": "Witamina D3 [25(OH)D]",
  "witamina d3": "Witamina D3 [25(OH)D]",
  "vitamin d": "Witamina D3 [25(OH)D]",
  "vitamin d3": "Witamina D3 [25(OH)D]",
  "25(oh)d": "Witamina D3 [25(OH)D]",
  "25 oh d": "Witamina D3 [25(OH)D]",
  "25-hydroksywitamina d": "Witamina D3 [25(OH)D]",
  "25-hydroxy vitamin d": "Witamina D3 [25(OH)D]",
  "kreatynina": "creatinine"
};

const TEST_ALIASES: Record<string, string> = Object.entries(TEST_ALIASES_RAW)
  .reduce((acc, [k, v]) => { acc[norm(k)] = v; return acc; }, {} as Record<string, string>);

function canonicalTestKey(raw: string): string {
  const n = norm(raw);
  const aliased = TEST_ALIASES[n] ?? raw;
  // preferuj dokładnie taki klucz, jaki istnieje w testReferenceValues
  if ((testReferenceValues as any)[aliased] !== undefined) return aliased;
  if ((testReferenceValues as any)[raw] !== undefined) return raw;
  return aliased;
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
// 🔁 ZAMIANA: cały obiekt UNIT_CONVERSIONS
type UnitConv = (v: number) => number;
const UNIT_CONVERSIONS: Record<string, Record<string, UnitConv>> = {
  /* === Glukoza === */
  "Glukoza": { "mmol/L->mg/dL": v => v * 18, "mg/dL->mmol/L": v => v / 18 },
  glucose:   { "mmol/L->mg/dL": v => v * 18, "mg/dL->mmol/L": v => v / 18 },

  /* === Lipidy (cholesterol) === */
  "Cholesterol całkowity": { "mmol/L->mg/dL": v => v * 38.67, "mg/dL->mmol/L": v => v / 38.67 },
  total_cholesterol:       { "mmol/L->mg/dL": v => v * 38.67, "mg/dL->mmol/L": v => v / 38.67 },
  LDL:                     { "mmol/L->mg/dL": v => v * 38.67, "mg/dL->mmol/L": v => v / 38.67 },
  HDL:                     { "mmol/L->mg/dL": v => v * 38.67, "mg/dL->mmol/L": v => v / 38.67 },

  /* === Triglicerydy === */
  "Trójglicerydy":   { "mmol/L->mg/dL": v => v * 88.57, "mg/dL->mmol/L": v => v / 88.57 },
  trojglicerydy:     { "mmol/L->mg/dL": v => v * 88.57, "mg/dL->mmol/L": v => v / 88.57 }, // znormalizowane bez diakrytyków
  triglycerides:     { "mmol/L->mg/dL": v => v * 88.57, "mg/dL->mmol/L": v => v / 88.57 },

  /* === Witamina D3 [25(OH)D] === */
  "Witamina D3 [25(OH)D]": { "nmol/L->ng/mL": v => v / 2.5, "ng/mL->nmol/L": v => v * 2.5 },
  vitamin_d_25oh:          { "nmol/L->ng/mL": v => v / 2.5, "ng/mL->nmol/L": v => v * 2.5 },

  /* === Kreatynina === */
  "Kreatynina": {
    "µmol/L->mg/dL": v => v / 88.4, "umol/L->mg/dL": v => v / 88.4,
    "mg/dL->µmol/L": v => v * 88.4, "mg/dL->umol/L": v => v * 88.4
  },
  creatinine: {
    "µmol/L->mg/dL": v => v / 88.4, "umol/L->mg/dL": v => v / 88.4,
    "mg/dL->µmol/L": v => v * 88.4, "mg/dL->umol/L": v => v * 88.4
  },

  /* === Bilirubina === */
  "Bilirubina": {
    "µmol/L->mg/dL": v => v / 17.104, "umol/L->mg/dL": v => v / 17.104,
    "mg/dL->µmol/L": v => v * 17.104, "mg/dL->umol/L": v => v * 17.104
  },

  /* === Żelazo (Fe) === */
  "Żelazo": {
    "µmol/L->µg/dL": v => v * 5.5845, "umol/L->µg/dL": v => v * 5.5845,
    "µg/dL->µmol/L": v => v * 0.179,   "ug/dL->µmol/L": v => v * 0.179,
    "µg/dL->umol/L": v => v * 0.179,   "ug/dL->umol/L": v => v * 0.179
  },
  iron: {
    "µmol/L->µg/dL": v => v * 5.5845, "umol/L->µg/dL": v => v * 5.5845,
    "µg/dL->µmol/L": v => v * 0.179,   "ug/dL->µmol/L": v => v * 0.179,
    "µg/dL->umol/L": v => v * 0.179,   "ug/dL->umol/L": v => v * 0.179
  },

  /* === Wapń / Magnez / Fosfor === */
  "Wapń":  { "mmol/L->mg/dL": v => v * 4.0,   "mg/dL->mmol/L": v => v * 0.2495 },
  "Magnez (Mg)": { "mmol/L->mg/dL": v => v * 2.43,  "mg/dL->mmol/L": v => v * 0.4114 },
  "Fosfor": { "mmol/L->mg/dL": v => v * 3.097, "mg/dL->mmol/L": v => v * 0.3229 },

  /* === CRP (często mg/L ↔ mg/dL) === */
  CRP: { "mg/dL->mg/L": v => v * 10, "mg/L->mg/dL": v => v / 10 },

  /* === B12 i folian (często miana molowe) === */
  "Witamina B12": { "pg/mL->pmol/L": v => v * 0.7378, "pmol/L->pg/mL": v => v * 1.355 },
  "Kwas foliowy": { "ng/mL->nmol/L": v => v * 2.266,  "nmol/L->ng/mL": v => v / 2.266 }
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
// 🔧 Gdy pole ma postać "Choroba__Test", zwróć samą nazwę testu
function splitFieldKey(k: string): { condition?: string; test: string } {
  const parts = String(k).split("__");
  if (parts.length >= 2) return { condition: parts[0], test: parts.slice(1).join("__") };
  return { test: String(k) };
}
// ─────────────────────────────────────────────────────────────────────────────
// Generic expansion of inline measurements + narrative guard
// Parsuje ciągi typu: "Na 147 mmol/L, K 3.2 mmol/L", "LDL 165 mg/dL; HDL 38 mg/dL"
// Działa dla DOWOLNYCH badań, jeśli ich nazwy (lub aliasy) są w testReferenceValues/TEST_ALIASES.
// ─────────────────────────────────────────────────────────────────────────────

const NARRATIVE_KEYS = ["pomiar cisnienia", "holter rr", "ekg", "usg", "opis choroby"];

/** Czy klucz wygląda na opis narracyjny (chyba że w wartościach znajdziemy znane etykiety testów) */
function isNarrativeKey(key: string) {
  const nk = norm(key);
  return NARRATIVE_KEYS.some(s => nk.includes(s));
}

/** Rozszerz wpisy, jeśli w tekście znajdziemy segmenty "etykieta wartość [jedn.]" odpowiadające znanym testom */
function expandGenericPairs(raw: Record<string, string | number>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (typeof v === "number") { out[k] = v; continue; }

    const s = String(v ?? "");
    // segmenty oddzielone ; lub przecinkiem poprzedzającym etykietę (np. ", LDL 160")
    const segments = s.split(/;+/).flatMap(seg => seg.split(/,(?=\s*[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])/));
    let expanded = 0;

    for (const segRaw of segments) {
      const seg = segRaw.trim();
      // Wzorzec: [etykieta] [:=]? [porównanie?] [liczba] [jednostka?]
      const m = seg.match(/^\s*([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9\-\.\(\)\/\[\] %]+?)\s*[:=]?\s*(?:[<>]=?|≤|≥)?\s*(-?\d+(?:[.,]\d+)?)\s*([A-Za-z%µ\/\.\^\d]+)?\s*$/);
      if (!m) continue;

      const label = m[1].trim();
      const num   = m[2].replace(",", ".");
      const unit  = m[3]?.trim();

      // Mapuj etykietę na kanoniczny klucz znany w testReferenceValues
      const canon = canonicalTestKey(label);
      if ((testReferenceValues as any)[canon] !== undefined) {
        out[canon] = unit ? `${num} ${unit}` : num;
        expanded++;
      }
    }

    // Jeśli nie udało się nic rozbić — zostaw oryginalny wpis
    if (expanded === 0) out[k] = v;
  }
  return out;
}

/** Gdy klucz jest narracyjny i NIE znaleziono żadnych znanych etykiet w wartości — nie parsujemy tam liczb */
function isProbablyNarrative(key: string, val: string | number): boolean {
  if (!isNarrativeKey(key)) return false;
  if (typeof val !== "string") return true;
  const s = String(val);
  const segments = s.split(/;+/).flatMap(seg => seg.split(/,(?=\s*[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż])/));
  for (const segRaw of segments) {
    const seg = segRaw.trim();
    const m = seg.match(/^\s*([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9\-\.\(\)\/\[\] %]+?)\s*[:=]?/);
    const label = m?.[1]?.trim();
    if (label) {
      const canon = canonicalTestKey(label);
      if ((testReferenceValues as any)[canon] !== undefined) return false; // jednak zawiera znane testy → nie traktuj jako narracyjne
    }
  }
  return true;
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

// 2) Wykryj odchylenia (obsługa kluczy "Choroba__Test" + aliasy + konwersja)
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

const expandedResults = expandGenericPairs(testResults || {});
const refRangesUsed: Record<string, string> =
  buildRefRangeTextMapForTests(Object.keys(expandedResults));


for (const [fieldKey, rawVal] of Object.entries(expandedResults)) {
  if (isProbablyNarrative(fieldKey, rawVal)) {
    labStatus[fieldKey] = { displayName: fieldKey, value: null, unit: undefined, class: "unknown" };
    continue;
  }

  // 1) wyciągnij SAMĄ nazwę testu z "Choroba__Test"
  const { test: testNameOnly } = splitFieldKey(fieldKey);

  // 2) alias/normalizacja + próba użycia DOKŁADNIE takiego klucza jak w testReferenceValues
  const aliasKey = canonicalTestKey(testNameOnly); // np. "Glukoza" -> "Glukoza" (PL) lub "glucose" (EN)
  const exactRefExists = (testReferenceValues as any)[testNameOnly] !== undefined;
  const testKeyRef = exactRefExists ? testNameOnly : aliasKey; // klucz do referencji
  const ref = (testReferenceValues as Record<string, TestRefValue | undefined>)[testKeyRef];

  // 3) parsowanie wartości i jednostki podanej przez pacjenta
  const { value: parsedValRaw, unit: valUnit } = parseValueUnit(rawVal as any);
  if (parsedValRaw == null || Number.isNaN(parsedValRaw)) {
    labStatus[testKeyRef] = {
      displayName: testNameOnly,
      value: null,
      unit: valUnit,
      class: "unknown"
    };
    continue;
  }

  if (!ref) {
    // brak referencji po samej nazwie testu → raportuj
    unmatchedTests.push(String(testNameOnly));
    labStatus[testKeyRef] = {
      displayName: testNameOnly,
      value: parsedValRaw,
      unit: valUnit,
      class: "unknown"
    };
    continue;
  }

  const range = parseRefRangeAdvanced(ref) || parseRange(ref);
  const refRangesUsed: Record<string, string> =  buildRefRangeTextMapForTests(Object.keys(testResults || {}));
  const refUnit = range?.unit;
  const refText: string =
  (refRangesUsed as Record<string, string>)[testKeyRef] ??
  (typeof ref === "string"
    ? ref
    : [ref?.normalRange, ref?.unit].filter(Boolean).join(" ").trim()) ??
  "";

// 4) konwersja jednostek — użyj klucza konwersji, który istnieje (alias EN lub PL)
//    + normalizacja zapisu jednostek (mg/dl -> mg/dL, mmol/l -> mmol/L itd.)
const UNIT_ALIASES: Record<string, string> = {
  "mg/dl": "mg/dL",
  "mmol/l": "mmol/L",
  "µmol/l": "µmol/L",
  "umol/l": "umol/L",
  "ng/ml": "ng/mL",
  "pg/ml": "pg/mL",
  "iu/ml": "IU/mL",
  "miu/l": "mIU/L",
  "µg/dl": "µg/dL",
  "ug/dl": "µg/dL",
  "nmol/l": "nmol/L",
  "pmol/l": "pmol/L",
  "mg/l": "mg/L"
};
const canonUnit = (u?: string) => (u ? (UNIT_ALIASES[u] ?? u) : undefined);

const fromU = canonUnit(valUnit);
const toU   = canonUnit(refUnit);

// wybierz klucz konwersji, który faktycznie istnieje w mapie
const convKey =
  (UNIT_CONVERSIONS as any)[aliasKey]
    ? aliasKey
    : ((UNIT_CONVERSIONS as any)[testKeyRef] ? testKeyRef : aliasKey);

let { value: convertedVal, note } = convertIfNeeded(convKey, parsedValRaw, fromU, toU);
if (note) unitWarnings.push(`${testNameOnly}: ${note}; ref="${refText}"`);

// zawężenie typu range (może być null)
const cls: Class = range ? classify(convertedVal, range as Range) : "unknown";

labStatus[testKeyRef] = {
  displayName: testNameOnly,
  value: convertedVal,
  unit: toU ?? fromU,
  refMin: range?.min,
  refMax: range?.max,
  refUnit: toU,
  class: cls
};

// komunikaty o odchyleniach pokazujemy po konwersji (w jednostce referencyjnej, jeśli jest)
const shownVal = `${convertedVal}${(toU ?? fromU) ? " " + (toU ?? fromU) : ""}`;
if (cls === "low")  abnormalities.push(`${testNameOnly}: low (${shownVal}, ref ${refText})`);
if (cls === "high") abnormalities.push(`${testNameOnly}: high (${shownVal}, ref ${refText})`);

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
- Lab test results (raw as entered): ${JSON.stringify(testResults)}
- Parsed lab status (normalized, slim): ${JSON.stringify(labStatus)}
- Out-of-range findings (computed): ${abnormalities.length ? abnormalities.join("; ") : "None"}
- Reference ranges (for UI): ${JSON.stringify(refRangesUsed)}
- Merged nutrient ranges to ENFORCE (hard constraints for diet generator): ${JSON.stringify(mergedRequirements)}
- Clinical description (free text): "${description}"
- Derived signals:
  - Blood pressure readings: ${JSON.stringify(bpMeasurements)}
  - Keywords: ${JSON.stringify(keywords)}
- Unmatched tests: ${JSON.stringify(unmatchedTests)}
- Unit warnings: ${JSON.stringify(unitWarnings)}

STRICT RULES:
1) If ANY "labStatus" item is "low" or "high", the first sentence of the clinical summary MUST explicitly state that abnormalities are present in ${lang}.
2) Be fully consistent with labStatus/BP/selectedConditions; do not invent new diagnoses.
3) Recommendations must be specific (macros/micros/foods with rationale + linksTo).
4) If a plausible recommendation conflicts with other conditions or enforceRanges, put it into "conflicts" and do NOT add it to recommendations.
5) No generic advice like "eat healthy"; deduplicate similar items.
6) Output language is ${lang} for ALL narrative text and headings.
7) Do NOT include any text outside the specified two-part format.
8) Do not print any labels like "A)" or "B)"; never number the sections.
9) Do not wrap the four section headings in quotes; print them as plain lines exactly as shown below.

OUTPUT FORMAT (two parts):

First output PLAIN TEXT in ${lang} with EXACTLY these four headings (no quotes, no numbering, no extra labels):
Clinical Summary (expert, concise)
Conclusions & Priorities
Recommendations (advice card – summary)
Further Diagnostics / Follow-Up (Checklist)

Put the content for each heading directly below it as short paragraphs or bullet points.

Immediately after the text, output ONE fenced JSON block (${fenceJson} … ${fenceEnd}), matching EXACTLY the schema below. Do not print any other labels before or after the JSON.

${fenceJson}
{
  "sections": {
    "clinicalSummary": "",
    "conclusionsPriorities": [],
    "recommendationsCard": [],
    "followUpChecklist": []
  },
  "labStatus": ${JSON.stringify(labStatus)},
  "recommendations": {
    "macros": [
      { "name": "", "direction": "increase|decrease|moderate", "rationale": "", "linksTo": ["<testKey or condition>"], "confidence": 0 }
    ],
    "micros": [
      { "name": "", "direction": "increase|decrease", "rationale": "", "linksTo": ["<testKey or condition>"], "confidence": 0 }
    ],
    "foods": {
      "emphasize": [
        { "group": "", "examples": [], "rationale": "", "linksTo": ["<testKey or condition>"], "confidence": 0 }
      ],
      "limit": [
        { "group": "", "examples": [], "rationale": "", "linksTo": ["<testKey or condition>"], "confidence": 0 }
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
  "clinicalRules": { "hydration": { "minFluidsMlPerDay": 0, "oralRehydrationPreferred": false }, "notes": [] },
  "refRanges": ${JSON.stringify(refRangesUsed)},
  "enforceRanges": ${JSON.stringify(mergedRequirements)},
  "conflicts": [],
  "unmatchedTests": ${JSON.stringify(unmatchedTests)},
  "unitWarnings": ${JSON.stringify(unitWarnings)}
}
${fenceEnd}
`;


const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  temperature: 0.1,
  max_tokens: 1200,
  messages: [
    { role: "system", content: "You are a clinical assistant. Return TWO parts: 1) narrative text in target language; 2) ONE fenced JSON block that matches the required schema." },
    { role: "user", content: prompt }
  ]
});


  return completion.choices[0].message.content || "Brak odpowiedzi.";
}
