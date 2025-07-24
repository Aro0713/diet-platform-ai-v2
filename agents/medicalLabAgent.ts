import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function medicalLabAgent({
  testResults,
  description,
  lang
}: {
  testResults: Record<string, string>;
  description: string;
  lang: string;
}): Promise<string> {
  
 const prompt = `
You are a professional medical lab assistant AI.

Patient has submitted:
- Lab test results: ${JSON.stringify(testResults, null, 2)}
- Medical description: "${description}"
- Language of output: ${lang}

Your tasks:
1. Analyze the lab test results and clinical description.
2. Detect abnormalities (too high/low values).
3. Identify risks (e.g. cardiovascular, renal, metabolic).
4. Based on findings, generate precise dietary and supplement guidance:

Return 2 parts:

---

**A. Clinical summary** (in ${lang})
- Write clearly what is out of range and why it matters.
- Mention what dietary changes are needed and why (e.g. lower sodium due to hypertension risk).

---

**B. JSON block** (used by diet engine)

\`\`\`json
{
  "risks": ["hyperlipidemia", "elevated LDL", "low vitamin D"],
  "warnings": ["risk of cardiovascular disease", "risk of metabolic syndrome"],
  "dietHints": {
    "avoid": ["trans fats", "added sugar", "red meat"],
    "recommend": ["fiber", "omega-3", "leafy greens"]
  },
  "dqChecks": {
    "avoidIngredients": ["salt", "sugar", "butter"],
    "preferModels": ["low fat", "anti-inflammatory"],
    "recommendMacros": ["high fiber", "moderate protein"],
    "avoidMacros": ["high saturated fat", "high sodium"],
    "recommendMicros": ["magnesium", "vitamin D", "potassium"],
    "avoidMicros": ["sodium", "cholesterol"]
  }
}
\`\`\`

---

Instructions:
- Always return both paragraph + JSON.
- Use clinical terminology.
- Return only evidence-based advice.
- Output must be structured and consistent.

Language of output: ${lang}
`;


  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  });

  return completion.choices[0].message.content || '⚠️ No output';
}

