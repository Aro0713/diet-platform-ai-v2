import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function validateAndFixDiet({
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
}): Promise<string> {
  const evaluationPrompt = `
You are a clinical AI diet validator and fixer.

Your task is to evaluate a 7-day diet plan and determine if it is nutritionally valid and adheres to:
- The dietary model: "${model}"
- The goal: "${goal}"
- The target energy (CPM): ${cpm} kcal

You MUST:
✔ Check if the dietary model is respected:
  - E.g. no meat for vegan, no sugar/starch for ketogenic, no gluten for gluten-free
✔ Check if the number of meals per day is between 3–6
✔ Check for missing or malformed meals (e.g. <100 kcal, missing glycemicIndex, no ingredients)
✔ Check for excessive repetition of ingredients (>2x same item)
✔ Check that each meal has:
  - time, menu, kcal, glycemicIndex
  - ingredients: product, weight, unit
  - preparation
  - nutrients: kcal, protein, fat, carbs, fiber, Ca, K, Mg, vit. C, D, B12
✔ Validate that the daily kcal total is reasonably close to CPM (${cpm})
✔ Check if the weekly plan includes:
  - all 7 days, with standard meals: Śniadanie, II śniadanie, Obiad, Kolacja
  - a weekly overview table
  - a shopping list

📋 RESPONSE FORMAT:
If everything is valid, respond with:
VALID ✅

If NOT, respond with:
ISSUES:
- ❌ [issue 1]
- ❌ [issue 2]
...

CORRECTED_JSON:
{ ...corrected dietPlan JSON... }

---

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
      { role: "user", content: evaluationPrompt }
    ],
    temperature: 0.4
  });

  return completion.choices[0].message.content ?? "Błąd: brak odpowiedzi AI.";
}
