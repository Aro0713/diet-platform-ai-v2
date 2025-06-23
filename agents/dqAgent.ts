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
You are a clinical AI diet quality controller.

Your task is to validate and optionally fix a 7-day meal plan based on the following:

- Diet model: "${model}"
- Goal: "${goal}"
- Target energy requirement (CPM): ${cpm} kcal
- Patient weight: ${weightKg} kg

Analyze the plan by:
1. Checking total daily and weekly kcal vs CPM (±10% acceptable)
2. Verifying macronutrient structure per model:
   - ketogenic → high fat, low carb
   - high-protein → ≥25% protein
   - vegan → no animal products
   - low-carb → < 100g carbs/day
   - mediterranean → olive oil, fish, legumes, diversity
3. Detecting unrealistic nutrient gaps or excess
4. Checking consistent number of meals per day

Return one of the following:

✅ VALID — if all rules are met

⚠️ Issues found:
- List of specific problems (e.g. "Tuesday exceeds carbs limit for keto")

📋 CORRECTED_JSON:
- Return corrected version of the plan if possible (same structure)

Here is the plan to analyze:
${JSON.stringify(dietPlan, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a clinical diet quality controller for structured JSON plans." },
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
