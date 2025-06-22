import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dqAgent = {
  run: async ({
    dietPlan,
    model,
    goal,
    cpm,
    weightKg
  }: {
    dietPlan: any;
    model: string;
    goal?: string;
    cpm?: number;
    weightKg?: number;
  }) => {
    const prompt = `
You are a clinical AI diet validator and fixer.

Evaluate the 7-day plan:
- Model: "${model}"
- Goal: "${goal}"
- Target CPM: ${cpm} kcal
- Weight: ${weightKg}kg

Return either:
✅ VALID ✅
or
📋 CORRECTED_JSON: {...}
or
⚠️ Issues found

DIET:
${JSON.stringify(dietPlan, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a clinical AI diet validator and fixer." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    });

    return {
      type: "text",
      content: completion.choices[0].message.content ?? "⚠️ No response."
    };
  }
};
