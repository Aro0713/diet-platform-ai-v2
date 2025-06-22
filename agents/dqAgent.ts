import { Agent, tool } from "@openai/agents";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 👇 Zod schema definiujący wejście
const dietValidationInput = z.object({
  dietPlan: z.any(),
  model: z.string(),
  goal: z.string().optional(),
  cpm: z.number().optional(),
  weightKg: z.number().optional()
});

// 🛠️ Tool z pełnym typowaniem
export const validateDietTool = tool({
  name: "validate_diet_quality",
  description: "Validates and corrects a 7-day diet plan based on clinical nutrition rules.",
  parameters: dietValidationInput,
  async execute(input) {
    const { dietPlan, model, goal, cpm, weightKg } = input;

    const prompt = `
You are a clinical AI diet validator and fixer.

Your task is to evaluate a 7-day diet plan and determine if it is nutritionally valid and adheres to:
- The dietary model: "${model}"
- The goal: "${goal}"
- The target energy (CPM): ${cpm} kcal

You MUST:
✔ Check if the dietary model is respected:
✔ Check that daily kcal ≈ CPM
✔ Ensure 3–6 meals/day, valid macros & structure
✔ Identify malformed or repeated meals/ingredients
✔ Return issues if any, or VALID ✅

PATIENT:
Weight: ${weightKg}kg
Goal: ${goal}
Model: ${model}
CPM: ${cpm}

---

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
});

// 🧠 Agent z poprawnym typem
export const dqAgent = new Agent({
  name: "Diet Quality Agent",
  instructions: "You evaluate and fix clinical diets using nutritional guidelines.",
  tools: [validateDietTool]
});
