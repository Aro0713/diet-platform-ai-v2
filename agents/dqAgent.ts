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
You are a clinical nutrition specialist.

Analyze the following diet plan and determine if it fully complies with the dietary model: "${model}".

You MUST:
- Detect forbidden ingredients (e.g. meat in vegan, sugar in ketogenic, gluten in gluten-free)
- Identify logic errors (e.g. <100 kcal meals, missing glycemicIndex or ingredients)
- Detect excessive repetition of ingredients (e.g. same food >2×)
- Assess number of meals (typical ${model} requires 3–6 per day)
- Compare total kcal (if known) to estimated CPM: ${cpm}
- Check if it matches the goal: "${goal}"

If the plan is fully valid, return only "VALID ✅".
If NOT, list all issues found and then output corrected JSON below, in this format:

ISSUES:
- ❌ [issue 1]
- ❌ [issue 2]

CORRECTED_JSON:
{ ...new JSON... }

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
