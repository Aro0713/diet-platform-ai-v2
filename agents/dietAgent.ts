import { Agent, tool } from "@openai/agents";
import OpenAI from "openai";
import { interviewNarrativeAgent } from "@/agents/interviewNarrativeAgent";
import { medicalLabAgent } from "@/agents/medicalLabAgent";
import { nutrientRequirementsMap, type NutrientRequirements } from "@/utils/nutrientRequirementsMap";
import type { Ingredient } from "@/utils/nutrition/calculateMealMacros";
import type { Meal } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });



const languageMap: Record<string, string> = {
  pl: "polski", en: "English", es: "español", fr: "français", de: "Deutsch",
  ua: "українська", ru: "русский", zh: "中文", hi: "हिन्दी", ar: "العربية", he: "עברית"
};

const cuisineContextMap: Record<string, string> = {
  "Polska": "Polish culinary traditions: soups, fermented foods, root vegetables",
  "Włoska": "Italian style: pasta, olive oil, tomatoes, basil, Mediterranean balance",
  "Japońska": "Japanese cuisine: rice, miso, seaweed, tofu, umami minimalism",
  "Chińska": "Chinese culinary principles: stir-fry, ginger, garlic, soy-based sauces",
  "Tajska": "Thai cuisine: coconut milk, chili, lemongrass, coriander",
  "Wietnamska": "Vietnamese: fresh herbs, rice noodles, fish sauce, light soups",
  "Indyjska": "Indian: rich spices, lentils, curries, turmeric, ghee",
  "Koreańska": "Korean: fermented vegetables, gochujang, rice dishes, barbecue",
  "Bliskowschodnia": "Middle Eastern: legumes, olive oil, tahini, flatbreads, spices",
  "Francuska": "French: sauces, butter, herbs de Provence, refined technique",
  "Hiszpańska": "Spanish: olive oil, garlic, paprika, tapas, seafood",
  "Skandynawska": "Scandinavian: rye, fish, root vegetables, dairy",
  "Północnoamerykańska": "North American: diverse, fusion, whole grains, lean proteins",
  "Brazylijska": "Brazilian: rice and beans, tropical fruits, cassava",
  "Afrykańska": "African: grains like millet, legumes, stews, bold spices",
  "Dieta arktyczna / syberyjska": "Arctic/Siberian: fish, berries, root vegetables, minimal spices"
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
const dayNames: Record<string, string[]> = {
  pl: ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  fr: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
  es: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  ua: ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"],
  ru: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
  zh: ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
  ar: ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
  hi: ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"],
  he: ["יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת", "יום ראשון"]
};
const dietModelMap: Record<string, {
  macros: { protein: string; fat: string; carbs: string };
  notes?: string[];
}> = {
  "easily digestible": {
    macros: { protein: "15–20%", fat: "20–30%", carbs: "50–60%" }
  },
  "fodmap": {
    macros: { protein: "20–25%", fat: "30–35%", carbs: "40–50%" },
    notes: [
      "Use only Low FODMAP ingredients.",
      "Allowed vegetables: carrot, cucumber, zucchini, eggplant, hokkaido pumpkin, arugula, small amount of tomato.",
      "Allowed fruits: unripe banana, kiwi, strawberries, grapes, orange.",
      "Allowed dairy: lactose-free products and hard cheeses.",
      "Allowed carbs: rice, oats, quinoa, potatoes, gluten-free bread (without fructans)."
    ]
  },
  "vegan": {
    macros: { protein: "15–20%", fat: "25–35%", carbs: "45–60%" }
  },
  "vegetarian": {
    macros: { protein: "15–20%", fat: "25–35%", carbs: "45–60%" }
  },
  "ketogenic": {
    macros: { protein: "15–25%", fat: "70–80%", carbs: "5–10%" }
  },
  "mediterranean": {
    macros: { protein: "15–20%", fat: "30–40%", carbs: "40–55%" }
  },
  "paleo": {
    macros: { protein: "20–35%", fat: "35–50%", carbs: "20–40%" }
  },
  "low carb": {
    macros: { protein: "25–35%", fat: "40–60%", carbs: "10–30%" }
  },
  "low fat": {
    macros: { protein: "15–25%", fat: "15–25%", carbs: "50–65%" }
  },
  "high protein": {
    macros: { protein: "25–35%", fat: "25–35%", carbs: "30–45%" }
  },
  "renal": {
    macros: { protein: "10–12%", fat: "30–35%", carbs: "50–60%" }
  },
  "liver": {
    macros: { protein: "15–20%", fat: "20–30%", carbs: "50–60%" }
  },
  "anti-inflammatory": {
    macros: { protein: "15–25%", fat: "30–40%", carbs: "35–50%" }
  },
  "autoimmune": {
    macros: { protein: "20–30%", fat: "30–45%", carbs: "25–45%" },
    notes: ["Interview data is **required** for autoimmune diets."]
  },
  "intermittent fasting": {
    macros: { protein: "variable", fat: "variable", carbs: "variable" },
    notes: ["Eating window: 8 hours", "Fasting window: 16 hours"]
  },
  "low sugar": {
    macros: { protein: "20–30%", fat: "30–40%", carbs: "35–50%" }
  },
  "low sodium": {
    macros: { protein: "15–20%", fat: "25–30%", carbs: "50–60%" }
  },
  "very low sodium": {
    macros: { protein: "15–20%", fat: "25–30%", carbs: "50–60%" },
    notes: ["Sodium < 1500 mg per day (~3.75g of salt)"]
  },
  "diabetes": {
    macros: { protein: "15–20%", fat: "25–35%", carbs: "40–50%" },
    notes: ["Use only low glycemic index products."]
  },
  "insulin resistance": {
    macros: { protein: "20–30%", fat: "30–40%", carbs: "30–40%" },
    notes: ["Use low glycemic index ingredients."]
  },
  "hypertension": {
    macros: { protein: "15–20%", fat: "25–35%", carbs: "45–55%" },
    notes: ["Use low glycemic index and low sodium products."]
  },
  "gluten free": {
    macros: { protein: "15–20%", fat: "30–40%", carbs: "40–55%" },
    notes: [
      "Use only naturally gluten-free grains: rice, corn, buckwheat, quinoa, amaranth, millet, sorghum, potato, tapioca.",
      "All vegetables and fruits are allowed.",
      "Avoid gluten contamination."
    ]
  }
};
const modelMap: Record<string, string> = {
  "Dieta w insulinooporności": "insulin resistance",
  "Dieta cukrzycowa": "diabetes",
  "Dieta DASH": "hypertension",
  "Dieta bezglutenowa": "gluten free",
  "Dieta FODMAP (przy IBS)": "fodmap",
  "Dieta wegańska": "vegan",
  "Dieta wegetariańska": "vegetarian",
  "Dieta ketogeniczna": "ketogenic",
  "Dieta śródziemnomorska": "mediterranean",
  "Dieta paleolityczna": "paleo",
  "Dieta niskowęglowodanowa": "low carb",
  "Dieta wysokobiałkowa": "high protein",
  "Dieta nerkowa": "renal",
  "Dieta wątrobowa": "liver",
  "Dieta przeciwzapalna": "anti-inflammatory",
  "Dieta autoimmunologiczna": "autoimmune",
  "Post przerywany": "intermittent fasting",
  "Dieta niskotłuszczowa": "low fat",
  "Dieta niskocukrowa": "low sugar",
  "Dieta niskosodowa": "low sodium",
  "Dieta MIND (dla mózgu)": "mind",
  "Dieta eliminacyjna": "elimination",
  "Dieta przy insulinooporności i PCOS": "pcos",
  "Dieta lekkostrawna": "easily digestible"
};

const goalMap: Record<string, string> = {
  "Odchudzające (redukujące)": "weight loss",
  "Na masę": "muscle gain",
  "Stabilizujące wagę": "weight maintenance",
  "Detoksykacyjne / oczyszczające": "detox",
  "Regeneracyjne": "regeneration",
  "Poprawa pracy wątroby": "liver support",
  "Poprawa pracy nerek": "kidney support"
};

const cuisineMap: Record<string, string> = {
  "Polska": "Polish",
  "Włoska": "Italian",
  "Japońska": "Japanese",
  "Chińska": "Chinese",
  "Tajska": "Thai",
  "Wietnamska": "Vietnamese",
  "Indyjska": "Indian",
  "Koreańska": "Korean",
  "Bliskowschodnia": "Middle Eastern",
  "Francuska": "French",
  "Hiszpańska": "Spanish",
  "Skandynawska": "Scandinavian",
  "Północnoamerykańska": "North American",
  "Brazylijska": "Brazilian",
  "Afrykańska": "African",
  "Dieta arktyczna / syberyjska": "Arctic/Siberian"
};

export async function generateDiet(input: any): Promise<any> {
  const {
    form,
    interviewData,
    testResults,
    medicalDescription,
    lang = "pl"
  } = input;
  
  const hasMedicalData = Boolean(testResults || medicalDescription);
  const modelKey = modelMap[form.model] || form.model?.toLowerCase();
  const goalExplanation = goalMap[interviewData.goal] || interviewData.goal;
  const cuisine = cuisineMap[interviewData.cuisine] || "global";
  const cuisineContext = cuisineContextMap[interviewData.cuisine] || "general healthy cooking style";
  const selectedLang = languageMap[lang] || "polski";
  const daysInLang = dayNames[lang] || dayNames['pl'];
  const daysList = daysInLang.map(d => `- ${d}`).join('\n');

  const bmi = form.bmi ?? (form.weight && form.height
    ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
    : null);
  const pal = form.pal ?? 1.6;
  const cpm = form.cpm ?? (form.weight && pal ? Math.round(form.weight * 24 * pal) : null);
  const mealsPerDay = interviewData.mealsPerDay ?? "not provided";

  const narrative = await interviewNarrativeAgent({ interviewData, goal: interviewData.goal, recommendation: interviewData.recommendation, lang });
  const medical = await medicalLabAgent({ testResults, description: medicalDescription, lang });

  const modelDefinition = dietModelMap[modelKey || ""] || {};
  const modelMacroStr = modelDefinition.macros
    ? Object.entries(modelDefinition.macros).map(([k, v]) => `- ${k}: ${v}`).join('\n')
    : "No macronutrient guidance found for this model.";

  const modelNotes = modelDefinition.notes?.join('\n') || "";

  const modelDetails = `
⚙️ Diet Model Requirements (${modelKey || "N/A"}):
${modelMacroStr}
${modelNotes ? `\n📌 Notes:\n${modelNotes}` : ""}
`;

  const nutrientRequirements = nutrientRequirementsMap[form.model] || null;
  const nutrientRequirementsText = nutrientRequirements
    ? Object.entries(nutrientRequirements)
        .map(([k, v]) => `- ${k}: ${v.min} – ${v.max}`)
        .join('\n')
    : "⚠️ No specific micronutrient ranges found for this model.";

  const jsonFormatPreview = daysInLang.map(day => `    \"${day}\": { ... }`).join(',\n');

  const prompt = `
You are a clinical dietitian AI.

${modelDetails}

Generate a complete 7-day diet plan. DO NOT stop after 1 or 2 days.

You MUST include:
- All 7 days in the target language (${lang}):
${daysList}
- The number of meals per day must be:
  - If mealsPerDay is provided: use exactly that number → ${mealsPerDay}
  - If not provided: intelligently determine the best number of meals (between 2–6)

- Use meal names localized to language "${lang}".
- You MUST include full nutritional data for every meal.
- Each meal must include:

  - "mealName": string
  - "time": string (e.g. "07:00")
  - "ingredients": array of:
      { "name": "string", "quantity": number in grams }

  - "macros": {
      "kcal": number,
      "protein": number,
      "fat": number,
      "carbs": number,
      "fiber": number,
      "sodium": number,
      "potassium": number,
      "calcium": number,
      "magnesium": number,
      "iron": number,
      "zinc": number,
      "vitaminD": number,
      "vitaminB12": number,
      "vitaminC": number,
      "vitaminA": number,
      "vitaminE": number,
      "vitaminK": number
    }

⚠️ All numeric values must be per whole meal, not per 100g. Use realistic values and round to 1 decimal point.
⚠️ Do not skip any nutrient field. All macros, micros and vitamins must be present and realistic.

Base the plan on:
✔ Patient profile from interview:
${narrative}

✔ Required nutrient ranges:
${nutrientRequirementsText}

${hasMedicalData ? `✔ Clinical risks and suggestions:\n${medical}` : "ℹ️ No clinical risks provided."}
${hasMedicalData ? `✔ Adjust for patient diseases: ${form.conditions?.join(", ") || "unknown"}` : ""}

✔ Diet model: ${modelKey}, Cuisine: ${cuisine}
✔ CPM: ${cpm}, BMI: ${bmi}, PAL: ${pal}
✔ Goal: ${goalExplanation}
✔ Doctor's recommendation: ${interviewData.recommendation}
✔ Allergies: ${form.allergies || "none"}

Use ONLY trusted sources:
${dataSources}

Return JSON:
{
  "dietPlan": {
${jsonFormatPreview}
  },
  "weeklyOverview": { ... },
  "shoppingList": [ ... ],
  "nutritionalSummary": {
    "macros": { "protein": ..., "fat": ..., "carbs": ... },
    "micros": { "sodium": ..., "magnesium": ..., "vitamin D": ... }
  }
}
`;

const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a clinical dietitian AI." },
    { role: "user", content: prompt }
  ],
  temperature: 0.7,
  stream: true
});

// 📥 Zbieranie treści z chunków
let fullContent = "";
for await (const chunk of completion) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) fullContent += delta;
}

let parsed;
try {
  const match = fullContent.match(/({[\s\S]+})/);
  if (!match) throw new Error("Brak JSON w odpowiedzi GPT.");
  parsed = JSON.parse(match[1]);

  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed); // optional double-parse
  }
} catch (err) {
  console.error("❌ JSON parse error →", fullContent);
  throw new Error("GPT response is not valid JSON.");
}


let rawDietPlan = null;

if (parsed?.CORRECTED_JSON?.dietPlan) {
  rawDietPlan = parsed.CORRECTED_JSON.dietPlan;
} else if (parsed?.CORRECTED_JSON && !parsed?.dietPlan) {
  rawDietPlan = parsed.CORRECTED_JSON;
} else if (parsed?.dietPlan) {
  rawDietPlan = parsed.dietPlan;
}

if (
  !rawDietPlan ||
  typeof rawDietPlan !== "object" ||
  Object.keys(rawDietPlan).length === 0 ||
  Object.values(rawDietPlan).every(v => !v || typeof v !== "object")
) {
  console.error("❌ Nie znaleziono prawidłowego dietPlan:", parsed);
  throw new Error("❌ JSON nie zawiera pola 'dietPlan'.");
}


try {
  const result = await import("@/agents/dqAgent").then(m =>
    m.dqAgent.run({
      dietPlan: rawDietPlan,
      model: modelKey,
      goal: goalExplanation,
      cpm,
      weightKg: form.weight ?? null,
      conditions: form.conditions ?? [],
      dqChecks: form?.medical_data?.dqChecks ?? {}
    })
  );

  if (!result || !result.plan) {
    console.error("❌ dqAgent.run zwrócił pusty wynik:", result);
    throw new Error("Brak poprawionej diety z dqAgent.");
  }

  parsed.correctedDietPlan = result.plan;
} catch (err) {
  console.warn("⚠️ dqAgent błąd:", err);
}

}

export const generateDietTool = tool({
  name: "generate_diet_plan",
  description: "Generates a 7-day clinical diet plan based on patient data and AI-driven insights.",
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
    const {
      form,
      interviewData,
      testResults,
      medicalDescription,
      lang = "pl"
    } = nested;

    const modelKey = modelMap[form.model] || (typeof form.model === "string" ? form.model.toLowerCase() : "");
    const goalExplanation = goalMap[interviewData.goal] || interviewData.goal;
    const cuisine = cuisineMap[interviewData.cuisine] || "global";
    const cuisineContext = cuisineContextMap[interviewData.cuisine] || "general healthy cooking style";
    const selectedLang = languageMap[lang] || "polski";
    const daysInLang = dayNames[lang] || dayNames['pl'];
    const daysList = daysInLang.map(d => `- ${d}`).join('\n');
    const hasMedicalData = Boolean(testResults || medicalDescription);

    function getNutrientRequirements(form: any): NutrientRequirements | null {
      const primary = nutrientRequirementsMap[form.model] || null;
      // Możesz tu później dodać logiczne łączenie z chorobami
      return primary;
    }

    const bmi = form.bmi ?? (form.weight && form.height
      ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
      : null);

    const pal = form.pal ?? 1.6;
    const cpm = form.cpm ?? (form.weight && pal ? Math.round(form.weight * 24 * pal) : null);
    const mealsPerDay = interviewData.mealsPerDay ?? "not provided";

    // 🔗 Pobranie danych z agentów wspierających
    const narrative = await interviewNarrativeAgent({ interviewData, goal: interviewData.goal, recommendation: interviewData.recommendation, lang });
    const medical = await medicalLabAgent({ testResults, description: medicalDescription, lang });

    const modelDefinition = dietModelMap[modelKey || ""] || {};
    const modelMacroStr = modelDefinition.macros
      ? Object.entries(modelDefinition.macros).map(([k, v]) => `- ${k}: ${v}`).join('\n')
      : "No macronutrient guidance found for this model.";

    const modelNotes = modelDefinition.notes?.join('\n') || "";

    const modelDetails = `
    ⚙️ Diet Model Requirements (${modelKey || "N/A"}):
    ${modelMacroStr}
    ${modelNotes ? `\n📌 Notes:\n${modelNotes}` : ""}
    `;
    const nutrientRequirements = getNutrientRequirements(form);
    const nutrientRequirementsText = nutrientRequirements
      ? Object.entries(nutrientRequirements)
          .map(([k, v]) => `- ${k}: ${v.min} – ${v.max}`)
          .join('\n')
      : "⚠️ No specific micronutrient ranges found for this model.";

  const jsonFormatPreview = `"Monday": { "breakfast": { ... }, ... }, ...`;

    const prompt = `
You are a clinical dietitian AI.

${modelDetails}

Generate a complete 7-day diet plan. DO NOT stop after 1 or 2 days.

You MUST include:
- All 7 days in the target language (${lang}):
${daysList}
- The number of meals per day must be:
  - If mealsPerDay is provided: use exactly that number → ${mealsPerDay}
  - If not provided: intelligently determine the best number of meals (between 2–6)

- Use meal names localized to language "${lang}".

⚠️ Each meal must include:
- "mealName": string
- "time": string (e.g. "07:00")
- "ingredients": array of:
    { "name": string, "quantity": number in grams }

- "macros": object with:
    {
      "kcal": number,
      "protein": number,
      "fat": number,
      "carbs": number,
      "fiber": number,
      "sodium": number,
      "potassium": number,
      "calcium": number,
      "magnesium": number,
      "iron": number,
      "zinc": number,
      "vitaminD": number,
      "vitaminB12": number,
      "vitaminC": number,
      "vitaminA": number,
      "vitaminE": number,
      "vitaminK": number
    }

Example:
{
  "mealName": "Jajecznica z pomidorami",
  "time": "07:00",
  "ingredients": [
    { "name": "Jajko", "quantity": 120 },
    { "name": "Pomidor", "quantity": 100 },
    { "name": "Olej rzepakowy", "quantity": 5 }
  ],
  "macros": {
    "kcal": 320,
    "protein": 18.5,
    "fat": 25.2,
    "carbs": 6.1,
    "fiber": 1.1,
    "sodium": 420,
    "potassium": 440,
    "calcium": 65,
    "magnesium": 22,
    "iron": 1.2,
    "zinc": 0.9,
    "vitaminD": 2.1,
    "vitaminB12": 0.6,
    "vitaminC": 3.8,
    "vitaminA": 210,
    "vitaminE": 3.2,
    "vitaminK": 32
  }
}

⚠️ All numeric values must be per entire meal (not per 100g) and must be rounded to 1 decimal place.
⚠️ Do NOT skip any field — all fields above must be filled with realistic values.

Base the plan on:
✔ Patient profile from interview:
${narrative}

✔ Required nutrient ranges:
${nutrientRequirementsText}

✔ Clinical risks and suggestions:
${medical}

✔ Diet model: ${modelKey}, Cuisine: ${cuisine}
✔ CPM: ${cpm}, BMI: ${bmi}, PAL: ${pal}
✔ Goal: ${goalExplanation}
✔ Doctor's recommendation: ${interviewData.recommendation}
✔ Allergies: ${form.allergies || "none"}

Use ONLY trusted sources:
${dataSources}

Return JSON:
{
  "dietPlan": {
${jsonFormatPreview}
  },
  "weeklyOverview": { ... },
  "shoppingList": [ ... ],
  "nutritionalSummary": {
    "macros": { "protein": ..., "fat": ..., "carbs": ... },
    "micros": { "sodium": ..., "magnesium": ..., "vitaminD": ... }
  }
}
`;

try {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a clinical dietitian AI." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    stream: true
  });

  // 📥 Zbieranie treści z chunków
  let fullContent = "";
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) fullContent += delta;
  }

 // 🔍 Spróbuj sparsować JSON z odpowiedzi GPT
let parsed;
try {
  const cleanContent = fullContent
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleanContent.indexOf("{");
  const lastBrace = cleanContent.lastIndexOf("}") + 1;

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Nie znaleziono nawiasów JSON.");
  }

  const jsonString = cleanContent.slice(firstBrace, lastBrace);

  parsed = JSON.parse(jsonString);

  // 🧪 Dodatkowe zabezpieczenie dla stringified JSON
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      console.warn("⚠️ Podwójne parsowanie nie powiodło się – kontynuuję z pojedynczym.");
    }
  }

} catch (err) {
  console.error("❌ Nie można sparsować JSON ze streamu:\n", fullContent);
  return {
    type: "text",
    content: "❌ GPT zwrócił niepoprawny JSON — nie można sparsować."
  };
}

  // ✅ Wybór najlepszego dietPlan
 function isValidDietPlan(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  const days = Object.keys(obj);
  return days.length >= 5 && Object.values(obj).every(
    v => typeof v === "object" && v !== null
  );
}

let rawDietPlan = null;

if (isValidDietPlan(parsed?.dietPlan)) {
  rawDietPlan = parsed.dietPlan;
} else if (isValidDietPlan(parsed?.CORRECTED_JSON?.dietPlan)) {
  rawDietPlan = parsed.CORRECTED_JSON.dietPlan;
} else if (isValidDietPlan(parsed?.CORRECTED_JSON)) {
  rawDietPlan = parsed.CORRECTED_JSON;
}

  if (
    !rawDietPlan ||
    typeof rawDietPlan !== "object" ||
    Object.keys(rawDietPlan).length === 0 ||
    Object.values(rawDietPlan).every(v => !v || typeof v !== "object")
  ) {
    console.error("❌ Nie znaleziono prawidłowego dietPlan:", parsed);
    return {
      type: "text",
      content: "❌ JSON nie zawiera pola 'dietPlan'."
    };
  }
// 🧠 Walidacja i poprawa przez dqAgent – bez parsowania
try {
  const { plan } = await import("@/agents/dqAgent").then(m =>
    m.dqAgent.run({
      dietPlan: rawDietPlan,
      model: modelKey,
      goal: goalExplanation,
      cpm,
      weightKg: form.weight ?? null,
      conditions: hasMedicalData ? form.conditions ?? [] : []
    })
  );

  if (plan) {
    parsed.correctedDietPlan = plan;
  }
} catch (err) {
  console.warn("⚠️ dqAgent błąd:", err);
}


  // ✅ Zwróć poprawioną lub oryginalną wersję
return {
  type: "json",
  content: parsed
};

} catch (error: any) {
  return {
    type: "text",
    content: `❌ Błąd generowania diety: ${error.message || "Nieznany błąd"}`
  };
}

}
});

export const dietAgent = new Agent({
  name: "Diet Agent",
  instructions: "You are a helpful clinical nutritionist generating structured 7-day diets in JSON.",
  tools: [generateDietTool]
});
