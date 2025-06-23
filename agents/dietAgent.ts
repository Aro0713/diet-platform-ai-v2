import { Agent, tool } from "@openai/agents";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const languageMap: Record<string, string> = {
  pl: "polski", en: "English", es: "español", fr: "français", de: "Deutsch",
  ua: "українська", ru: "русский", zh: "中文", hi: "हिन्दी", ar: "العربية", he: "עברית"
};

const culturalContextMap: Record<string, string> = {
  pl: "Polish and Central European dietary traditions",
  en: "Anglo-American dietary habits",
  es: "Mediterranean and Latin American dietary culture",
  fr: "French and Western European cuisine",
  de: "Germanic and Central European dietary preferences",
  ua: "Ukrainian and Eastern European food culture",
  ru: "Russian and Slavic food heritage",
  zh: "Chinese and East Asian culinary traditions",
  hi: "Indian dietary principles and traditional spices",
  ar: "Arabic and Middle Eastern dietary customs",
  he: "Kosher food rules and Israeli cuisine"
};

const dataSources = `
Nutrient databases:
- USDA FoodData Central (https://fdc.nal.usda.gov)
- Polish Food Composition Tables (https://ncez.pzh.gov.pl)
- Open Food Facts (https://world.openfoodfacts.org)

Clinical nutrition guidelines:
- Polish Institute of Public Health (https://ncez.pzh.gov.pl)
- USDA Recommended Dietary Allowances (https://www.nal.usda.gov)
- EFSA (https://www.efsa.europa.eu)
- ESPEN Guidelines (https://www.espen.org/guidelines)
- NICE UK (https://www.nice.org.uk)
- AND - Academy of Nutrition and Dietetics (https://www.eatrightpro.org)
- ESMO (Oncology), IASO (Obesity), IBD Standards UK
- PubMed & Cochrane Library (https://pubmed.ncbi.nlm.nih.gov, https://www.cochranelibrary.com)
`;

export const generateDietTool = tool({
  name: "generate_diet_plan",
  description: "Generates a 7-day clinical diet plan based on patient data.",
  strict: false,
  parameters: {
    type: "object",
    properties: {
      input: {
        type: "object",
        additionalProperties: true
      }
    },
    required: ["input"] as string[],
    additionalProperties: true
  } as const,
  async execute(input: any) {
    const { input: nested } = input;
    const { form, interviewData, lang = "pl", goalExplanation = "", recommendation = "" } = nested;

    const selectedLang = languageMap[lang] || "polski";
    const culturalContext = culturalContextMap[lang] || "general international dietary style";

    const bmi = form.bmi ?? (form.weight && form.height
      ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
      : null);

    const pal = form.pal ?? 1.6;
    const cpm = form.cpm ?? (form.weight && pal ? Math.round(form.weight * 24 * pal) : null);
    const mealsPerDay = interviewData.mealsPerDay ?? "not provided";

    const modelDiet = form.model?.toLowerCase();
    const cuisine = interviewData.cuisine?.toLowerCase() || "global";

    const patientData = {
      ...form,
      ...interviewData,
      bmi,
      pal,
      cpm,
      goalExplanation,
      recommendation,
      language: selectedLang,
      mealsPerDay
    };

    const prompt = `
You are a clinical dietitian AI.

Generate a 7-day structured and medically accurate diet plan in valid JSON format. The plan must:

✔ Be customized based on:
- Patient interview, test results, medical history
- Cultural context: ${culturalContext}
- Diet model: ${modelDiet}, Cuisine: ${cuisine}
- Energy targets (CPM: ${cpm}), BMI: ${bmi}, PAL: ${pal}
- Number of meals: ${mealsPerDay}, Goal: ${goalExplanation}
- Doctor's notes: ${recommendation}

✔ For EACH meal include:
- Polish name (Śniadanie, II śniadanie, Obiad, Kolacja)
- Time (e.g., 07:30)
- Dish name (menu), Ingredients list (product, weight, unit)
- Detailed cooking method (preparation)
- Nutrients: kcal, protein, fat, carbs, fiber, Ca, K, Mg, vit. C, D, B12

**Nutrients must reflect real food values based on actual ingredient weights. Use reliable scientific food composition sources (USDA, Open Food Facts, Polish IŻŻ). Do not estimate or round randomly.**

✔ For EACH day:
- Total nutritional summary for the day (JSON object)

✔ For WHOLE week:
- Table of all meals (day × meal)
- Summary of total intake
- Ingredient shopping list

Use ONLY trusted sources:
${dataSources}

Return ONLY valid JSON. Do not include markdown, comments, explanations or raw weekdays.

Your response MUST have this format:

{
  "dietPlan": {
    "Monday": { ... },
    ...
  },
  "weeklyOverview": { ... },
  "shoppingList": [ ... ]
}

Do not return top-level "Monday", "Tuesday" etc. — wrap all days inside "dietPlan".
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a clinical dietitian AI." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      stream: false
    });

    return {
      type: "text",
      content: completion.choices[0].message.content ?? "Brak odpowiedzi."
    };
  }
});

export const dietAgent = new Agent({
  name: "Diet Agent",
  instructions: "You are a helpful clinical nutritionist generating structured 7-day diets in JSON.",
  tools: [generateDietTool]
});
