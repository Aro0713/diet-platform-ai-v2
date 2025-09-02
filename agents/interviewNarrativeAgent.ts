// agents/interviewNarrativeAgent.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type LangKey = "pl" | "en" | "es" | "fr" | "de" | "ua" | "ru" | "zh" | "hi" | "ar" | "he";

const languageMap: Record<LangKey | string, string> = {
  pl: "polski",
  en: "English",
  es: "español",
  fr: "français",
  de: "Deutsch",
  ua: "українська",
  ru: "русский",
  zh: "中文",
  hi: "हिन्दी",
  ar: "العربية",
  he: "עברית",
};

function prune(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) {
    const arr = obj.map(prune).filter(v =>
      v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "")
    );
    return arr.length ? arr : undefined;
  }
  if (typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const pv = prune(v);
      if (
        pv !== undefined &&
        !(typeof pv === "string" && pv.trim() === "") &&
        !(Array.isArray(pv) && pv.length === 0)
      ) out[k] = pv;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return obj;
}

function serializeForPrompt(obj: any, limit = 30000): string { // ↑ z 8000 na 30000
  try {
    const cleaned = prune(obj) ?? {};
    const json = JSON.stringify(cleaned, null, 2);
    return json.length > limit ? json.slice(0, limit) : json;
  } catch {
    return String(obj ?? "");
  }
}

export async function interviewNarrativeAgent({
  interviewData,
  goal,
  recommendation,
  lang,
}: {
  interviewData: Record<string, any>;
  goal?: string;
  recommendation?: string;
  lang: LangKey | string;
}): Promise<string> {
  const selectedLang = (languageMap[lang] ?? "polski") as string;

  const prompt = `
You are a clinical nutrition AI assistant.

Write a single coherent narrative in ${selectedLang}.
Address the user directly in respectful second person singular (e.g., in Polish: "Zgłaszasz", "Deklarujesz", "Spożywasz"; in English: "You ...").
Do NOT refer to the user as "the patient" / "pacjent" / "pacjentka". Do not mention gender.

Use a clear, professional but friendly tone.
Base every sentence strictly on the provided data; do NOT invent, infer, generalize, or speculate.
Do NOT output JSON, bullet lists, code blocks, headings, or technical field names.
Do not mention missing data; simply omit it.
Organize the narrative into natural paragraphs and avoid repetition.

STRICT RULES (very important):
- State a diagnosis only if there is an explicit diagnosis/conditions field.
  If a condition appears only in recommendations/notes/free-text, describe it as an instruction/recommendation, NOT as a diagnosis.
- Do NOT add habits or traits that are not in the data (e.g., motivation, avoiding sweets or processed foods).
- Copy exact times and counts (e.g., meal times, number of meals) as provided.
- If foods are listed as problematic/undesired, present them as such; do not reframe them.
- NEVER mention BMI unless a dedicated BMI field exists; do not infer BMI from any other fields.
- Do not assert smoking or alcohol habits unless explicit fields provide that information.
- If a numeric range is present but the metric is not explicitly named in the data, either omit it or report only as a "range: {min}–{max}" without naming the metric.

KNOWN FIELD SEMANTICS (map keys to meaning; follow strictly, omit if missing):

# Section 1 — Basic information and purpose of the visit  (prefix: step0_)
- step0_q1           → user's expectation/goal (enum: Weight loss | Improved test results | Support in disease | Muscle mass gain | Nutritional education | Weight maintenance | Other). Report exactly as stated.
- step0_q1_other     → goal free-text used only if q1 = "Other". Use verbatim.
- step0_q2           → has been on a diet before (radio Yes/No/I don’t know). If "Yes", you may mention prior dieting in one neutral sentence.
- step0_q3           → if q2 = "Yes": which diet and results (free-text). Report as provided; do not evaluate or generalize.
- step0_q4           → currently following any diet/plan (radio Yes/No/I don’t know).
- step0_q4_details   → if q4 = "Yes": description of the current diet/plan (free-text). Treat strictly as instruction/plan, NOT as a diagnosis.

# Section 2 — Health status  (prefix: step1_)
- step1_q1           → chronic diseases present? (radio Yes/No/I don’t know).
- step1_q2           → which chronic diseases (select: Diabetes | Hypertension | Thyroid | PCOS | Other). Use only if q1 = "Yes". List exactly.
- step1_q2_other     → other chronic diseases (free-text) used only if q2 = "Other". Append verbatim.
- step1_q3           → diet-related diseases diagnosed? (radio Yes/No/I don’t know).
- step1_q4           → which diet-related diseases (select: Insulin resistance | Hypercholesterolemia | Other). Use only if q3 = "Yes".
- step1_q4_other     → other diet-related (free-text) if q4 = "Other". Append verbatim.
- step1_q5           → gastrointestinal issues present? (radio Yes/No/I don’t know).
- step1_q6           → which GI issues (select: Bloating | Constipation | Diarrhea | Reflux | Other). Use only if q5 = "Yes".
- step1_q6_other     → other GI issues (free-text) if q6 = "Other". Append verbatim.
- step1_q7           → food allergies or intolerances present? (radio Yes/No/I don’t know).
- step1_q8           → which allergies/intolerances (free-text). Use only if q7 = "Yes". Report exactly; do NOT convert into clinical diagnosis unless a dedicated diagnosis field exists.
- step1_q9           → medications used regularly? (radio Yes/No/I don’t know).
- step1_q10          → which medications (free-text). Use only if q9 = "Yes".
- step1_q11          → uses dietary supplements? (radio Yes/No/I don’t know).
- step1_q12          → which supplements (free-text CSV or text). Use only if q11 = "Yes". Report exactly.
- step1_q13          → stress level (enum: Low | Medium | High | Very high). Report exactly.
- step1_q14          → sleep quality (enum: Very poor (frequent waking) | Average (interrupted sleep) | Good | Very good (sleeping like a baby 💤)). Report exactly.

# Section 3 — Lifestyle  (prefix: step2_)
- step2_q1           → engages in physical activity? (radio Yes/No/I don’t know).
- step2_q2           → type of physical activity (free-text). Use only if q1 = "Yes". Report as provided.
- step2_q3           → work affects health? (radio Yes/No/I don’t know).
- step2_q4           → job type (free-text). Use only if q3 = "Yes". Report as provided.
- step2_q5           → smokes cigarettes? (radio Yes/No/Occasionally). Report exactly; do not infer quantities.
- step2_q6           → consumes alcohol? (radio Yes/No/Occasionally). Report exactly; do not infer amounts/frequency.
- step2_q7           → drinks coffee or tea? (radio Yes/No/Occasionally).
- step2_q7_details   → cups of coffee per day (enum: 1 | 2 | 3 | 4 | 5 or more). Use only if q7 = "Yes".
- step2_q7b_details  → cups of tea per day (enum: 1 | 2 | 3 | 4 | 5 or more). Use only if q7 = "Yes".
- step2_q8           → drinks energy drinks? (radio Yes/No/Occasionally).
- step2_q8_details   → which energy drinks (free-text). Use only if q8 = "Yes".

# Section 4 — Eating habits  (prefix: step3_)
- step3_q1           → eats meals regularly? (radio Yes/No/I don’t know).
- step3_q2           → usual eating times (text; often CSV times). If recognizable times, copy exactly (e.g., "09:00, 11:00, …"); you may state the count ("You eat X meals per day at: …"). Use only if q1 = "Yes".
- step3_q3           → snacks between meals? (radio Yes/No/Sometimes).
- step3_q4           → eats breakfast regularly? (radio Yes/No/Rarely).
- step3_q5           → often eats sweets or fast food? (radio Yes/No/Sometimes).
- step3_q6           → drinks ≥1.5–2 L water daily? (radio Yes/No/I don’t know) — exclude coffee/tea/juices.
- step3_q7           → consumes dairy regularly? (radio Yes/No/Rarely).
- step3_q8           → eats meat regularly? (radio Yes/No/Rarely).
- step3_q9           → eats fish regularly? (radio Yes/No/Rarely).
- step3_q10a         → eats vegetables regularly? (radio Yes/No/Rarely).
- step3_q10b         → eats fruit regularly? (radio Yes/No/Rarely).
- step3_q11          → consumes healthy fats (e.g., olive oil, nuts, avocado)? (radio Yes/No/Rarely).
- step3_q12          → often eats processed food? (radio Yes/No/Sometimes).
- step3_q13          → how often cooks at home? (enum: I always cook at home | I often cook, sometimes eat out/order | I often eat out/order | I never cook).

# Section 5 — Food preferences and intolerances  (prefix: step4_)
- step4_q1           → foods liked the most (free-text). Report as provided.
- step4_q2           → foods disliked or intolerant to (free-text; may be CSV). Report exactly; present as problematic/undesired, do not reframe as recommended.
- step4_q3           → appetite during the day (enum: Normal | Increased appetite | Decreased appetite | No appetite in the morning | Sudden hunger attacks | Lack of appetite under stress | Other). Report exactly; if "Other", use verbatim wording if present elsewhere.

# Section 6 — Weight history  (prefix: step5_)
- step5_q1_min       → lowest weight in recent years (text/number with user’s original unit). Report verbatim; do NOT reinterpret as blood pressure or BMI.
- step5_q1_max       → highest weight in recent years (text/number with user’s original unit). Report verbatim.
- step5_q2           → weight fluctuates frequently? (radio Yes/No/I don’t know).
- step5_q3           → weight affected mood/social relationships? (radio Yes/No).

# Section 7 — Digestive and intestinal issues  (prefix: step6_)
- step6_q1           → frequently experiences bloating? (radio Yes/No/I don’t know). Write as a second-person statement (e.g., "You frequently experience bloating: Yes/No/I don’t know").
- step6_q2           → frequently experiences constipation? (radio Yes/No/I don’t know).
- step6_q3           → frequently experiences diarrhea? (radio Yes/No/I don’t know).
- step6_q4           → frequently experiences acid reflux? (radio Yes/No/I don’t know).
- step6_q4_details   → reflux frequency/situations (free-text). Use only if q4 = "Yes".
- step6_q5           → abdominal pain after meals? (radio Yes/No/I don’t know).
- step6_q6           → bowel movements per day (enum: 0 – I have constipation issues | 1 | 2 | 3 | 4 or more). Report exactly.
- step6_q7           → diagnosed with intestinal diseases (IBS, SIBO, celiac)? (radio Yes/No).
- step6_q7_list      → which intestinal conditions (multi-select: IBS | SIBO | Celiac disease | Other). Use only if q7 = "Yes". If "Other" text exists elsewhere, add verbatim.

# Section 8 — Women – additional questions  (prefix: step7_)
- step7_q1           → menstrual cycles regular? (radio Yes/No). If present, report neutrally as second-person; do not mention gender explicitly, just "You report…".
- step7_q2           → any hormonal disorders (e.g., PCOS, endometriosis)? (radio Yes/No).
- step7_q2_list      → which hormonal conditions (multi-select as given). Use only if q2 = "Yes".
- step7_q2_list_other→ other hormonal condition (free-text). Use only if q2_list includes "Other".
- step7_q3           → currently pregnant or breastfeeding? (radio: Yes, I’m pregnant | Yes, I’m breastfeeding | No).
- step7_q4           → uses hormonal contraception? (radio Yes/No).
- step7_q5           → perimenopause/menopause phase? (radio Yes/No).
- step7_q5_htz       → uses HRT? (radio: I use HRT | I do not use HRT). Use only if q5 = "Yes".

# Section 9 — Motivation and Possibilities  (prefix: step8_)
- step8_q1           → motivation to change habits (scale 1–10). Report as "Your motivation (1–10): {value}".
- step8_q2           → barriers to following the diet? (radio Yes/No).
- step8_q3           → which barriers (select: Lack of time | Shift work | Lack of cooking skills | Other). Use only if q2 = "Yes". List exactly.
- step8_q3_other     → other barrier (free-text). Use only if q3 includes "Other".
- step8_q4           → time per day you can spend on meal preparation (enum: 0.5 h … 10 h). **Interpret strictly as cooking time, not exercise.**
- step8_q5           → budget limitations? (radio Yes/No).
- step8_q6           → budget type (enum: Daily | Monthly). Use only if q5 = "Yes".
- step8_q7           → approximate amount (free-text, keep user’s unit/currency). Use only if q5 = "Yes".

# Section 10 — Other  (prefix: step9_)
- step9_q1           → any other important details? (radio Yes/No).
- step9_q1_details   → additional information (free-text). Use only if q1 = "Yes". Report verbatim; mark clearly as a user-provided note.

VALUE NORMALIZATION (apply before writing):
- Booleans: treat "Yes/No/I don’t know" or localized equivalents as categorical; report exactly (do not convert to probabilities).
- CSV/text lists: split by comma, trim spaces, drop empty items, preserve original order.
- Times (step3_q2): accept HH:MM; keep leading zeros and order exactly as provided; you may state the count of meals.
- Ranges and numbers: if a min/max pair appears (e.g., historical weights), reproduce numbers with the user’s original units; do NOT guess the metric if it is not stated.
- Units and currency: keep user’s originals (e.g., "2 h", "150 USD"); do not convert unless the value already contains a unit.
- Whitespace: trim trailing commas/spaces; do not alter words.
- Missing or empty values: omit entirely (do not mention "not provided").
- NEVER infer BMI, blood pressure, smoking or alcohol habits, diagnoses, or symptom frequency unless an explicit field states it.

DEPENDENCIES (enforce strictly):
- Use any *_other, *_details, or list fields only if the parent question’s condition is satisfied (per "dependsOn" in the section definitions). Otherwise, ignore those fields even if present.
- Do not escalate instructions/comments into diagnoses. A diagnosis must come from a dedicated diagnosis/conditions field; otherwise present it as the user’s statement or recommendation/instruction.
- Where labels contain the placeholder "sex", write neutrally in second person ("You…") without mentioning gender.

Interview data (for your reference only — do NOT quote or describe its structure):
${serializeForPrompt(interviewData)}

Dietary goal: ${goal ?? ""}
Doctor's recommendation: ${recommendation ?? ""}
`.trim();

const messages = [
  {
    role: "system" as const,
    content:
      "You are a precise, professional clinical dietitian. You write directly to the user in respectful second person. You base every sentence strictly on the provided data. You never output lists, JSON, or code.",
  },
  { role: "user" as const, content: prompt },
];

const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    messages,
    stream: true,
  });

  let out = "";
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) out += delta;
  }
  return out.trim();
}

export default interviewNarrativeAgent;
