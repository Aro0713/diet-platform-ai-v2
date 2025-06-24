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

  // 🔍 Wyodrębnij JSON z odpowiedzi (między ```json ... ```)
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  let parsed: any = {};

  if (jsonMatch && jsonMatch[1]) {
    try {
      parsed = JSON.parse(jsonMatch[1]);
    } catch (err) {
      console.error('❌ Błąd parsowania JSON z medicalLabAgent:', err);
    }
  }

  return {
    summary: content,
    json: parsed
  };
}
