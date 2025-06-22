import OpenAI from "openai";

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

Patient has submitted the following:
- Lab test results: ${JSON.stringify(testResults, null, 2)}
- Medical description: "${description}"
- Language of output: ${lang}

Your tasks:
1. Detect and explain abnormalities (e.g. high cholesterol, low hemoglobin, elevated glucose, etc.)
2. Summarize potential conditions and associated clinical risks.
3. Ask clarifying questions only if necessary.
4. Provide general dietary or lifestyle recommendations.
5. Then, return a structured JSON formatted exactly like this:

{
  "risks": ["..."],
  "warnings": ["..."],
  "dietHints": {
    "avoid": ["..."],
    "recommend": ["..."]
  },
  "dqChecks": {
    "avoidIngredients": ["..."],
    "preferModels": ["..."]
  }
}

Output should contain:
A. Human-readable analysis (paragraphs),
B. ✅ JSON block as described above (as code block).
Do not skip the JSON, it will be used by another agent.

Start your reply in language: ${lang}.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  return completion.choices[0].message.content || "No output";
}


