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
}): Promise<{
  summary: string;
  json: {
    risks?: string[];
    warnings?: string[];
    dietHints?: {
      avoid?: string[];
      recommend?: string[];
    };
    dqChecks?: {
      avoidIngredients?: string[];
      preferModels?: string[];
    };
  };
}> {
  const prompt = `
You are a professional medical lab assistant AI.

Patient has submitted:
- Lab test results: ${JSON.stringify(testResults, null, 2)}
- Medical description: "${description}"
- Language of output: ${lang}

Your tasks:
1. Detect abnormalities.
2. Summarize clinical risks.
3. Suggest dietary/lifestyle recommendations.
4. Output human-readable summary followed by a JSON block:

{
  "risks": [...],
  "warnings": [...],
  "dietHints": { "avoid": [...], "recommend": [...] },
  "dqChecks": { "avoidIngredients": [...], "preferModels": [...] }
}

Output in language: ${lang}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  });

  const content = completion.choices[0].message.content || '';

  let parsed: any = {};
  const jsonRegex = /```json\s*([\s\S]*?)```/;
  const jsonMatch = content.match(jsonRegex);

  if (jsonMatch && jsonMatch[1]) {
    let rawJson = jsonMatch[1].trim();

    try {
      // Od-escape'uj jeśli to string z escapami
      if (rawJson.startsWith('"')) {
        rawJson = JSON.parse(rawJson); // JSON string → raw JSON text
      }
      parsed = JSON.parse(rawJson);    // raw JSON text → obiekt
    } catch (err) {
      console.error('❌ Błąd parsowania JSON z medicalLabAgent:', err);
    }
  }

  return {
    summary: content,
    json: parsed
  };
}

