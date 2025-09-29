import { Agent, tool } from "@openai/agents";
import OpenAI from "openai";
import { nutrientRequirementsMap, type NutrientRequirements } from "@/utils/nutrientRequirementsMap";
import type { Meal } from "@/types";

type MealLoose = Meal & { mealName?: string; name?: string; title?: string };

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
  },
    "mind": {
    macros: { protein: "15–25%", fat: "25–35%", carbs: "45–55%" }
  },
  "elimination": {
    macros: { protein: "15–25%", fat: "25–35%", carbs: "45–55%" },
    notes: ["Eliminate suspected triggers for 14–28 days; reintroduce stepwise."]
  },
  "pcos": {
    macros: { protein: "20–30%", fat: "30–40%", carbs: "30–40%" },
    notes: ["Low glycemic load; prioritize fiber and unsaturated fats."]
  },

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
/* UNUSED: composeContext + GeneratedContext (commented out to avoid dead code)
type GeneratedContext = {
  modelKey: string;
  goalExplanation: string;
  cuisine: string;
  cuisineContext: string;
  selectedLang: string;
  daysInLang: string[];
  daysList: string;
  bmi: number | null;
  pal: number;
  cpm: number | null;
  iv: ReturnType<typeof extractInterview>;
  md: ReturnType<typeof extractMedical>;
  pc: PatientConstraints;
  mergedRanges: NutrientRequirements | null;
  modelDefinition: (typeof dietModelMap)[string] | {};
  modelMacroStr: string;
  modelNotes: string;
  sodiumLimit: number | null;
  allowedIngredients: string[];
};

function composeContext(form: any, interviewData: any, lang: string): GeneratedContext {
  const modelRaw = interviewData?.model ?? form?.model ?? "";
  const modelKey = modelMap[modelRaw] || normalize(modelRaw);
  const goalExplanation = goalMap[interviewData?.goal] || interviewData?.goal;

  const cuisine = cuisineMap[interviewData?.cuisine] || "global";
  const cuisineContext = cuisineContextMap[interviewData?.cuisine] || "general healthy cooking style";
  const selectedLang = languageMap[lang] || "polski";
  const daysInLang = dayNames[lang] || dayNames['pl'];
  const daysList = daysInLang.map(d => `- ${d}`).join('\n');

  const bmi = form?.bmi ?? (form?.weight && form?.height
    ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
    : null);

  const pal = form?.pal ?? 1.6;
  const cpm = form?.cpm ?? (form?.weight && pal ? Math.round(form.weight * 24 * pal) : null);

  const iv = extractInterview(form, interviewData);
  const md = extractMedical(form);

  const pc = buildPatientConstraints(form, interviewData, md, lang, modelKey);
  const mergedRanges = mergeNutrientRequirements(form);

  const modelDefinition = dietModelMap[modelKey || ""] || {};
  const modelMacroStr = (modelDefinition as any).macros
    ? Object.entries((modelDefinition as any).macros).map(([k, v]) => `- ${k}: ${v}`).join('\n')
    : "No macronutrient guidance found for this model.";
  const modelNotes = (modelDefinition as any).notes?.join('\n') || "";

  const conditionsText = [
    ...(Array.isArray(form?.conditions) ? form.conditions : []),
    ...(Array.isArray(form?.conditionGroups) ? form.conditionGroups : [])
  ].join(" | ");
  const sodiumLimit = (
    modelKey === "very low sodium" ? 1500 :
    (modelKey === "low sodium" || /nadciśn|hypertens/i.test(conditionsText)) ? 2000 :
    null
  );

  const allowedIngredients = buildAllowedIngredients(pc.preferred, pc.forbidden, pc.cuisine);

  return {
    modelKey, goalExplanation, cuisine, cuisineContext, selectedLang, daysInLang, daysList,
    bmi, pal, cpm, iv, md, pc, mergedRanges, modelDefinition, modelMacroStr, modelNotes,
    sodiumLimit, allowedIngredients
  };
}

*/
 // ———————————————————————————————————————————
 // HELPERS: normalizacja, alergeny, set, zakresy, sód
 // ———————————————————————————————————————————

// 1) Rodziny alergenów (UE big-14 + kilka częstych)
const ALLERGEN_FAMILIES: Record<string, string[]> = {
  milk: ["milk","lactose","whey","casein","yogurt","kefir","cheese","butter","cream","ghee"],
  egg: ["egg","albumin","ovalbumin","ovomucoid","lysozyme"],
  peanut: ["peanut","groundnut","monkey nut","arachis"],
  tree_nut: ["almond","hazelnut","walnut","cashew","pecan","pistachio","brazil nut","macadamia","pine nut","chestnut","coconut"],
  gluten: ["wheat","barley","rye","spelt","kamut","farro","bulgur","malt"],
  soy: ["soy","soybean","soya","tofu","tempeh","edamame","soy lecithin","soy sauce","tvp"],
  fish: ["salmon","tuna","cod","herring","mackerel","sardine"],
  shellfish: ["shrimp","prawn","crab","lobster","langoustine"],
  mollusc: ["mussel","clam","oyster","scallop","squid","octopus","snail"],
  sesame: ["sesame","tahini"],
  mustard: ["mustard","mustard seed"],
  celery: ["celery","celeriac"],
  lupin: ["lupin","lupine"],
  sulphites: ["sulphite","sulfite","e220","e221","e222","e223","e224","e226","e227","e228"],
  // częste „dodatkowe” (opcjonalnie)
  buckwheat: ["buckwheat","kasha"],
  corn: ["corn","maize","polenta"],
};

// 2) Normalizacja tekstu
function normalize(str: string): string {
  return String(str || "").toLowerCase().trim();
}

// 3) Rozwijanie alergii (tekst → rodziny + surowe tokeny)
function expandAllergens(allergyText: string): string[] {
  const txt = normalize(allergyText);
  if (!txt) return [];
  const tokens = txt.replace(/[;,.]/g, " ").split(/\s+/).filter(Boolean);
  const expanded = new Set<string>();

  for (const [familyKey, members] of Object.entries(ALLERGEN_FAMILIES)) {
    // jeśli tekst zawiera nazwę rodziny (np. "nut", "milk", "gluten" itp.)
    if (tokens.some(t => familyKey.includes(t) || t.includes(familyKey))) {
      members.forEach(m => expanded.add(normalize(m)));
      expanded.add(normalize(familyKey));
    }
  }
  // mapowanie najczęstszych PL nazw rodzin na EN
  const pl2enFamilies: Record<string, string> = {
    "mleko": "milk", "laktoza": "milk",
    "jaja": "egg", "jajo": "egg",
    "orzech": "tree_nut", "orzechy": "tree_nut", "arachidowe": "peanut",
    "gluten": "gluten", "pszenica": "gluten", "żyto": "gluten", "jęczmień": "gluten",
    "soja": "soy",
    "ryba": "fish", "ryby": "fish",
    "skorupiaki": "shellfish", "owoce morza": "shellfish",
    "małże": "mollusc", "mollusk": "mollusc",
    "sezam": "sesame",
    "gorczyca": "mustard",
    "seler": "celery",
    "łubin": "lupin",
    "siarczyny": "sulphites"
  };
  for (const t of tokens) {
    const fam = pl2enFamilies[normalize(t)];
    if (fam && ALLERGEN_FAMILIES[fam]) {
      ALLERGEN_FAMILIES[fam].forEach(m => expanded.add(normalize(m)));
      expanded.add(normalize(fam));
    }
  }

  // dodaj też surowe tokeny
  tokens.forEach(t => expanded.add(normalize(t)));

  return [...expanded];
}


// 4) Szybka pomocnicza do Set<string>
function toSet(arr: any): Set<string> {
  return new Set(
    (Array.isArray(arr) ? arr : [])
      .filter(Boolean)
      .map((x: any) => normalize(x))
  );
}

// 5) Łączenie zakresów żywieniowych z modelu + chorób
function mergeNutrientRequirements(form: any): NutrientRequirements | null {
  const packs: NutrientRequirements[] = [];

 const pushIf = (key: any) => {
  const raw = typeof key === "string" ? key : "";
  const candidates = [
    raw,
    (modelMap as any)?.[raw] ?? raw,
    normalize(raw)
  ];
  for (const cand of candidates) {
    const pack = (nutrientRequirementsMap as any)?.[cand];
    if (pack) { packs.push(pack); return; }
  }
};

  // model
  if (form?.model) pushIf(form.model);

  // choroby
  for (const c of (form?.conditions || [])) pushIf(c);
  for (const g of (form?.conditionGroups || [])) pushIf(g);

  if (!packs.length) return null;

  const merged: any = {};
  for (const pack of packs) {
    for (const [k, v] of Object.entries(pack)) {
      const cur = merged[k] || { min: -Infinity, max: Infinity };
      const vv: any = v || {};
      merged[k] = {
        min: Math.max(cur.min, vv.min ?? -Infinity),
        max: Math.min(cur.max, vv.max ?? Infinity),
      };
    }
  }
  return merged;
}

// 6) Limit sodu wg modelu/chorób
function computeSodiumLimit(modelKey: string, conditionsText: string): number | null {
  if (modelKey === "very low sodium") return 1500;
  if (modelKey === "low sodium" || /nadciśn|hypertens/i.test(conditionsText)) return 2000;
  return null;
}
// ——— ENFORCE & ALLOWED ———
function enforceMealsPerDay(plan: Record<string, Record<string, Meal>>, mealsPerDay: number | null) {
  if (!mealsPerDay || mealsPerDay < 2 || mealsPerDay > 6) return;
  for (const day of Object.keys(plan)) {
    const entries = Object.entries(plan[day]);
    if (entries.length === mealsPerDay) continue;
    if (entries.length > mealsPerDay) {
      plan[day] = Object.fromEntries(entries.slice(0, mealsPerDay));
    } else {
      const lastLoose = entries[entries.length - 1]?.[1] as MealLoose | undefined;
while (Object.keys(plan[day]).length < mealsPerDay && lastLoose) {
  const idx = Object.keys(plan[day]).length + 1;
  const base =
    (lastLoose.mealName ?? lastLoose.name ?? lastLoose.title ?? "Snack") + " (light)";

  // Tworzymy kopię, dopisujemy różne aliasy nazwy – UI weźmie co potrzebuje
  plan[day][`snack_${idx}`] = {
    ...(lastLoose as any),
    mealName: base,
    name: base,
    title: base
  } as unknown as Meal;
}

    }
  }
}

function sanitizeIngredients(ings: any[], forbidden: Set<string>) {
  const out: any[] = [];
  for (const i of ings || []) {
    const name = normalize(i.product ?? i.name ?? "");
    if (!name) continue;
    const isForbidden = forbidden.has(name) || [...forbidden].some(f => name.includes(f));
    if (isForbidden) {
      if (name.includes("almond") || name.includes("hazelnut") || name.includes("walnut") || name.includes("peanut")) {
        out.push({ product: "pumpkin seeds", weight: i.weight ?? i.quantity ?? 20, unit: i.unit || "g" }); continue;
      }
      if (name.includes("milk") || name.includes("yogurt") || name.includes("cheese")) {
        out.push({ product: "lactose-free yogurt", weight: i.weight ?? i.quantity ?? 150, unit: i.unit || "g" }); continue;
      }
      if (name.includes("soy")) {
        out.push({ product: "chickpeas (cooked)", weight: i.weight ?? i.quantity ?? 100, unit: i.unit || "g" }); continue;
      }
      if (name.includes("shrimp") || name.includes("prawn") || name.includes("mussel") || name.includes("oyster")) {
        out.push({ product: "white fish (baked)", weight: i.weight ?? i.quantity ?? 120, unit: i.unit || "g" }); continue;
      }
      continue; // pomiń resztę zakazanych
    }
    out.push({ product: i.product ?? i.name ?? "", weight: i.weight ?? i.quantity ?? 0, unit: i.unit || "g" });
  }
  return out;
}

function applyHardConstraints(plan: Record<string, Record<string, Meal>>, forbidden: Set<string>) {
  for (const day of Object.keys(plan)) {
    for (const key of Object.keys(plan[day])) {
      const meal = plan[day][key];
      meal.ingredients = sanitizeIngredients(meal.ingredients, forbidden);
    }
  }
}

// lista bazowa + kontekst kuchni + preferencje – zakazy
const GLOBAL_PANTRY = [
  "oats","rice","quinoa","buckwheat","millet","potato","sweet potato",
  "carrot","zucchini","pumpkin","cucumber","tomato","spinach","kale",
  "apple","banana","berries","orange","grapes","kiwi",
  "chicken breast","turkey","white fish","eggs","lactose-free yogurt",
  "olive oil","rapeseed oil","flaxseed oil",
  "pumpkin seeds","sunflower seeds","chia","sesame",
  "chickpeas","lentils","beans","tofu","tempeh",
  "gluten-free bread","rice noodles","corn tortillas",
];

const CUISINE_PANTRY: Record<string, string[]> = {
  Polish: ["rye bread","buckwheat","sauerkraut","cottage cheese","herring","dill"],
  Italian: ["olive oil","tomato","basil","mozzarella (lactose-free)","polenta","risotto rice"],
  Japanese: ["rice","tofu","miso","nori","daikon","udon"],
  "Middle Eastern": ["tahini","chickpeas","bulgur","cucumber","mint"],
};

function buildAllowedIngredients(preferred: Set<string>, forbidden: Set<string>, cuisine: string) {
  const base = new Set<string>([...GLOBAL_PANTRY, ...(CUISINE_PANTRY[cuisine] || []), ...preferred]);
  for (const f of forbidden) base.forEach(x => { if (x.includes(f)) base.delete(x); });
  return [...base];
}

// stabilna kompletacja bez stream
async function completeOnce(prompt: string) {
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0,
    top_p: 1,
    stream: false,
    messages: [
      { role: "system", content: "You are a clinical dietitian AI. Obey hard clinical constraints. Output VALID JSON only." },
      { role: "user", content: prompt }
    ]
  });
  return r.choices?.[0]?.message?.content ?? "";
}


function extractInterview(form: any, interviewData: any) {
  const sup = form?.interview_data ?? null;
  const mpdRaw = interviewData?.mealsPerDay ?? sup?.step6_q6 ?? null; // w Twojej próbce step6_q6 = "3"
  const mealsPerDay = typeof mpdRaw === "string" ? parseInt(mpdRaw, 10) : mpdRaw;

  return {
    name: form?.name ?? null,
    age: form?.age ?? null,
    sex: form?.sex ?? null,
    height: form?.height ?? null,
    weight: form?.weight ?? null,
    mealsPerDay: Number.isFinite(mealsPerDay) ? mealsPerDay : null,
    sleepQuality: sup?.step1_q14 ?? null,     // "Dobra" w Twojej próbce
    stressLevel: sup?.step1_q13 ?? null,      // "Średni"
    physicalActivity: sup?.step8_q4 ?? null,  // "1.5 h"
    narrativeText: sup?.narrativeText ?? null,
    allergies: form?.allergies ?? null,       // w supabase to tekst; zostawiamy jako string
    preferred: interviewData?.preferred ?? [],
    disliked: interviewData?.disliked ?? [],
  };
}

function extractMedical(form: any) {
  const md = form?.medical_data ?? null;
  return {
    conditions: form?.conditions ?? [],               // ["Niewydolność serca"]
    conditionGroups: form?.conditionGroups ?? [],     // ["Choroby układu krążenia"]
    health_status: form?.health_status ?? null,
    risks: md?.risks ?? [],
    warnings: md?.warnings ?? [],
    dqChecks: md?.dqChecks ?? {},
    dietHints: {
      avoid: md?.dietHints?.avoid ?? [],
      recommend: md?.dietHints?.recommend ?? [],
    },
    enforceRanges: md?.enforceRanges ?? null,
  };
}

function buildInterviewSummary(iv: ReturnType<typeof extractInterview>) {
  // allergies w Supabase to tekst – pokaż jak jest
  const allergiesLine = iv.allergies ? String(iv.allergies) : "none";
  return [
    `Age: ${iv.age ?? "unknown"}`,
    `Sex: ${iv.sex ?? "unknown"}`,
    `Height: ${iv.height ?? "unknown"} cm`,
    `Weight: ${iv.weight ?? "unknown"} kg`,
    `Meals/day: ${iv.mealsPerDay ?? "unknown"}`,
    `Sleep quality: ${iv.sleepQuality ?? "unknown"}`,
    `Stress level: ${iv.stressLevel ?? "unknown"}`,
    `Physical activity: ${iv.physicalActivity ?? "unknown"}`,
    `Allergies: ${allergiesLine}`,
  ].join(", ");
}

function buildMedicalSummary(md: ReturnType<typeof extractMedical>) {
  return [
    `Conditions: ${md.conditions?.join(", ") || "none"}`,
    `Condition groups: ${md.conditionGroups?.join(", ") || "none"}`,
    `Health status: ${md.health_status ?? "not provided"}`,
    `Risks: ${md.risks?.join(", ") || "none"}`,
    `Warnings: ${md.warnings?.join(", ") || "none"}`,
    `Diet hints: avoid → ${md.dietHints.avoid.join(", ") || "none"}, recommend → ${md.dietHints.recommend.join(", ") || "none"}`,
    md.dqChecks?.avoidMicros?.length ? `Avoid micros: ${md.dqChecks.avoidMicros.join(", ")}` : null,
    md.dqChecks?.recommendMicros?.length ? `Prefer micros: ${md.dqChecks.recommendMicros.join(", ")}` : null,
    md.dqChecks?.avoidIngredients?.length ? `Avoid ingredients: ${md.dqChecks.avoidIngredients.join(", ")}` : null,
  ].filter(Boolean).join("\n");
}
// ———————————————————————————————————————————
// ALL-IN constraints z wywiadu + danych medycznych
// Wymaga: expandAllergens, toSet, mergeNutrientRequirements, computeSodiumLimit,
//         cuisineMap, cuisineContextMap, languageMap, extractInterview, extractMedical
// ———————————————————————————————————————————
type PatientConstraints = {
  mealsPerDay: number | null;
  forbidden: Set<string>;
  preferred: Set<string>;
  allergyFamilies: Set<string>;
  sodiumLimitMg: number | null;
  lowGlycemic: boolean;
  nutrientRanges: NutrientRequirements | null;
  cuisine: string;
  cuisineContext: string;
  language: string;
};

function buildPatientConstraints(
  form: any,
  interviewData: any,
  md: ReturnType<typeof extractMedical>,
  lang: string,
  modelKey: string
): PatientConstraints {
  const iv = extractInterview(form, interviewData);

  const mealsPerDay = Number.isFinite(iv.mealsPerDay) ? Number(iv.mealsPerDay) : null;

  const disliked: string[] = Array.isArray(iv?.disliked) ? iv.disliked : [];
  const preferredArr: string[] = [
    ...(Array.isArray(iv?.preferred) ? iv.preferred : []),
    ...(Array.isArray(md?.dietHints?.recommend) ? md.dietHints.recommend : []),
  ];

  const forbiddenArr: string[] = [
    ...(Array.isArray(md?.dietHints?.avoid) ? md.dietHints.avoid : []),
    ...(Array.isArray(md?.dqChecks?.avoidIngredients) ? md.dqChecks.avoidIngredients : []),
    ...disliked
  ].filter(Boolean);

  const allergyText = String(form?.allergies ?? iv?.allergies ?? "");
  const expandedAllergens = expandAllergens(allergyText);

  const forbidden = toSet([...forbiddenArr, ...expandedAllergens]);
  const preferred = toSet(preferredArr);

  const conditionsText = [
    ...(Array.isArray(form?.conditions) ? form.conditions : []),
    ...(Array.isArray(form?.conditionGroups) ? form.conditionGroups : []),
  ].join(" | ");

  const sodiumLimit = computeSodiumLimit(modelKey, conditionsText);

  const lowGlycemic =
    modelKey === "insulin resistance" ||
    modelKey === "diabetes" ||
    /glycem/i.test(String(interviewData?.goal || ""));

  const nutrientRanges = mergeNutrientRequirements(form);

  return {
    mealsPerDay,
    forbidden,
    preferred,
    allergyFamilies: toSet(expandedAllergens),
    sodiumLimitMg: sodiumLimit,
    lowGlycemic,
    nutrientRanges,
    cuisine: cuisineMap[interviewData.cuisine] || "global",
    cuisineContext: cuisineContextMap[interviewData.cuisine] || "general healthy cooking style",
    language: languageMap[lang] || "polski",
  };
}

export async function generateDiet(input: any): Promise<any> {
  try {
    const out = await (generateDietTool as any).execute({ input });
    // jeżeli tool mimo wszystko zwrócił wrapper, odpakuj:
    if (out && typeof out === "object" && "type" in out) {
      if ((out as any).type === "json") return (out as any).content;
      if ((out as any).type === "text") return { error: String((out as any).content ?? "Unknown error") };
    }
    return out; // spodziewane: { ... , dietPlan, ... } lub { error }
  } catch (e: any) {
    return { error: `Błąd generowania diety: ${e?.message ?? "unknown"}` };
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
  const { form, interviewData, testResults: _testResults, medicalDescription: _medicalDescription, lang = "pl" } = nested;

  // ── minimalny kontekst używany niżej
  const modelKey = modelMap[form?.model] || (typeof form?.model === "string" ? normalize(form.model) : "");
  const goalExplanation = goalMap[interviewData?.goal] || interviewData?.goal;
  const cuisineContext = cuisineContextMap[interviewData?.cuisine] || "general healthy cooking style";
  const cuisine = cuisineMap[interviewData?.cuisine] || "global";
  const daysInLang = dayNames[lang] || dayNames["pl"];
  const daysList = daysInLang.map(d => `- ${d}`).join("\n");

  const bmi = form?.bmi ?? (form?.weight && form?.height ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1)) : null);
  const pal = form?.pal ?? 1.6;
  const cpm = form?.cpm ?? (form?.weight && pal ? Math.round(form.weight * 24 * pal) : null);

  const iv = extractInterview(form, interviewData);
  const md = extractMedical(form);

  const mealsPerDay = iv?.mealsPerDay ?? "not provided";
  const interviewSummary = buildInterviewSummary(iv);
  const medicalSummary   = buildMedicalSummary(md);

  // alergie/zakazy preferencje do promptu
  const allergyText = String(form?.allergies ?? iv?.allergies ?? "");
  const dislikedItems: string[] = Array.isArray(iv?.disliked) ? iv.disliked : [];
  const preferredItems: string[] = [
    ...(Array.isArray(iv?.preferred) ? iv.preferred : []),
    ...(Array.isArray(md?.dietHints?.recommend) ? md.dietHints.recommend : [])
  ];
  const forbiddenItems: string[] = [
    ...(Array.isArray(md?.dietHints?.avoid) ? md.dietHints.avoid : []),
    ...(Array.isArray(md?.dqChecks?.avoidIngredients) ? md.dqChecks.avoidIngredients : []),
    ...dislikedItems
  ].filter(Boolean);

  const conditionsText = [
    ...(Array.isArray(form?.conditions) ? form.conditions : []),
    ...(Array.isArray(form?.conditionGroups) ? form.conditionGroups : [])
  ].join(" | ");
  const sodiumLimit =
    modelKey === "very low sodium" ? 1500 :
    (modelKey === "low sodium" || /nadciśn|hypertens/i.test(conditionsText)) ? 2000 :
    null;

  // wymagania modelu
  const modelDefinition = dietModelMap[modelKey || ""] || {};
  const modelMacroStr = (modelDefinition as any).macros
    ? Object.entries((modelDefinition as any).macros).map(([k, v]) => `- ${k}: ${v}`).join("\n")
    : "No macronutrient guidance found for this model.";
  const modelNotes = (modelDefinition as any).notes?.join("\n") || "";

  // ranges (jak dotąd: tylko z modelu – bez większej przebudowy)
  const nutrientRequirements =
  (nutrientRequirementsMap as any)[modelKey] ??
  (nutrientRequirementsMap as any)[normalize(form?.model || "")] ??
  (nutrientRequirementsMap as any)[form?.model] ??
  null;

  const nutrientRequirementsText = nutrientRequirements
    ? Object.entries(nutrientRequirements).map(([k, v]: any) => `- ${k}: ${v.min} – ${v.max}`).join("\n")
    : "⚠️ No specific micronutrient ranges found for this model.";

  const jsonFormatPreview = (dayNames[lang] || dayNames["pl"])
  .map(d => `    "${d}": { ... }`)
  .join(",\n");

  // preferowana spiżarnia (i zdejmuje błąd TS o allowedIngredients)
  const md2 = extractMedical(form);
  const pc2 = buildPatientConstraints(form, interviewData, md2, lang, modelKey);
  const allowedIngredients = buildAllowedIngredients(pc2.preferred, pc2.forbidden, pc2.cuisine);

  const prompt = `
You are a clinical dietitian AI.

⚙️ Diet Model Requirements (${modelKey || "N/A"}):
${modelMacroStr}
${modelNotes ? `\n📌 Notes:\n${modelNotes}` : ""}

Generate a complete 7-day diet plan. DO NOT stop after 1 or 2 days.

HARD CONSTRAINTS (must be satisfied in every meal and day):
- FORBIDDEN_INGREDIENTS: ${JSON.stringify(forbiddenItems)}
- ALLERGENS_FREE_TEXT: ${allergyText || "none"}
- PREFERRED: ${JSON.stringify(preferredItems)}
${sodiumLimit ? `- DAILY_SODIUM_LIMIT_MG: ${sodiumLimit}` : ""}
- Respect mealsPerDay = ${mealsPerDay} if provided.
- If model is "insulin resistance" or "diabetes" → keep low glycemic load per meal; avoid refined sugar.
- Honor cuisine context strictly: ${cuisineContext}.
- Prefer ingredients from ALLOWED_INGREDIENTS: ${JSON.stringify(allowedIngredients)}

You MUST include:
- All 7 days in the target language (${lang}):
${daysList}
- Meals per day: if provided use exactly ${mealsPerDay}, otherwise 2–6 chosen intelligently.
- Localized meal names.

Each meal must include:
- "mealName": string
- "time": "HH:MM"
- "ingredients": [{ "name": string, "quantity": number (grams) }]
- "macros": { "kcal","protein","fat","carbs","fiber","sodium","potassium","calcium","magnesium","iron","zinc","vitaminD","vitaminB12","vitaminC","vitaminA","vitaminE","vitaminK" }
(All numeric values per whole meal, rounded to 1 decimal.)

✔ Patient profile:
${interviewSummary}

✔ Clinical risks and suggestions:
${medicalSummary || "ℹ️ No clinical data provided."}

✔ Required nutrient ranges:
${nutrientRequirementsText}

✔ Diet model: ${modelKey}, Cuisine: ${cuisine}
✔ CPM: ${cpm}, BMI: ${bmi}, PAL: ${pal}
✔ Goal: ${goalExplanation}
✔ Doctor's recommendation: ${interviewData?.recommendation}
✔ Allergies: ${form?.allergies || "none"}

Sources:
${dataSources}

COMPLIANCE (self-check):
- Replace forbidden/allergen ingredients with safe alternatives.
- Keep sodium ≤ DAILY_SODIUM_LIMIT_MG when set.
- Keep low glycemic load when required.
- Fix violations before returning final JSON.

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
  },
  "complianceReport": { "violations": [], "notes": [] }
}
`;

  // lokalna, bezpieczna normalizacja (żeby nie zależeć od kolejności definicji)
  function normalizeIngredientsLocal(ingredients: any[]) {
    return (ingredients || [])
      .map(i => {
        const name = (i.product ?? i.name ?? "").toString().trim();
        const qty = Number.isFinite(i.weight) ? Number(i.weight)
                  : Number.isFinite(i.quantity) ? Number(i.quantity)
                  : 0;
        if (!name) return null;
        return { product: name, weight: qty, unit: "g" };
      })
      .filter(Boolean);
  }

  // parser JSON z fallbackiem
  function extractJsonSafely(s: string): any {
    const clean = s.replace(/```json|```/g, "").trim();
    const first = clean.indexOf("{");
    const last  = clean.lastIndexOf("}");
    if (first === -1 || last === -1) throw new Error("No JSON braces found.");
    const jsonStr = clean.slice(first, last + 1);
    const maybe = JSON.parse(jsonStr);
    return typeof maybe === "string" ? JSON.parse(maybe) : maybe;
  }

  try {
    // ── 1) streaming
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a clinical dietitian AI." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      stream: true
    });

    let fullContent = "";
    for await (const chunk of stream) {
      const delta = (chunk as any)?.choices?.[0]?.delta?.content;
      if (delta) fullContent += delta;
    }

    // ── 2) parsowanie + fallback na niestreamowane
    let parsed: any;
    try {
      parsed = extractJsonSafely(fullContent);
    } catch {
      const fallback = await completeOnce(prompt);
      parsed = extractJsonSafely(fallback);
    }

    // ── 3) wyciągnięcie dietPlan
    function isValidDietPlan(obj: any): boolean {
      if (!obj || typeof obj !== "object") return false;
      const days = Object.keys(obj);
      return days.length >= 5 && Object.values(obj).every(v => typeof v === "object" && v !== null);
    }

    let rawDietPlan: Record<string, Record<string, Meal>> | null = null;
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
      throw new Error("JSON output from model does not include 'dietPlan'.");
    }

    // ── 4) normalizacja składników
    for (const day of Object.keys(rawDietPlan)) {
      const mealsForDay = rawDietPlan[day];
      const normalizedMeals: Record<string, Meal> = {};
      for (const mealKey of Object.keys(mealsForDay)) {
        const meal = mealsForDay[mealKey] as any;
        normalizedMeals[mealKey] = {
          ...meal,
          ingredients: normalizeIngredientsLocal(meal?.ingredients)
        } as Meal;
      }
      rawDietPlan[day] = normalizedMeals;
    }
    // Uwaga jakościowa: brakujące ilości ustawiono na 0 g podczas normalizacji
    if (!parsed.complianceReport) parsed.complianceReport = { violations: [], notes: [] };
    if (!Array.isArray(parsed.complianceReport.notes)) parsed.complianceReport.notes = [];
    parsed.complianceReport.notes.push("Some ingredient quantities were missing and were set to 0 g during normalization; please review.");

    // ── 5) wymuszenie zakazów i liczby posiłków
    const mdLocal = extractMedical(form);
    const pc = buildPatientConstraints(form, interviewData, mdLocal, lang, modelKey);
    applyHardConstraints(rawDietPlan, pc.forbidden);
    enforceMealsPerDay(rawDietPlan, pc.mealsPerDay);
    // Szybki sygnał o przekroczeniu dziennego sodu (jeśli limit istnieje)
if (sodiumLimit) {
  const highDays: string[] = [];
  for (const day of Object.keys(rawDietPlan)) {
    const totalNa = Object.values(rawDietPlan[day] || {}).reduce((sum, meal: any) => {
      const na = Number(meal?.macros?.sodium) || 0;
      return sum + na;
    }, 0);
    if (totalNa > sodiumLimit) highDays.push(day);
  }
  if (highDays.length) {
    if (!parsed.complianceReport) parsed.complianceReport = { violations: [], notes: [] };
    if (!Array.isArray(parsed.complianceReport.violations)) parsed.complianceReport.violations = [];
    parsed.complianceReport.violations.push(`Daily sodium over limit on: ${highDays.join(", ")}`);
  }
}

    const confirmedPlan: Record<string, Record<string, Meal>> = rawDietPlan;

    // ── 6) dqAgent (rzuć typ „any”, żeby nie krzyczał o .dietPlan)
    const mergedRanges: NutrientRequirements | null = mergeNutrientRequirements(form);
    const dq: any = await import("@/agents/dqAgent").then(m =>
      m.dqAgent.run({
        dietPlan: confirmedPlan,
        model: modelKey,
        goal: goalExplanation,
        cpm,
        weightKg: form?.weight ?? null,
        conditions: form?.conditions ?? [],
        dqChecks: {
  ...(form?.medical_data?.dqChecks ?? {}),
  nutrientRanges: mergedRanges,
  sodiumLimit: sodiumLimit
}

      })
    );

    const finalPlan = dq?.dietPlan && Object.keys(dq.dietPlan || {}).length ? dq.dietPlan : confirmedPlan;

    return {
  ...parsed,
  dietPlan: finalPlan,
  complianceReport: dq?.complianceReport ?? parsed?.complianceReport ?? { violations: [], notes: [] }
};
  } catch (error: any) {
  return { error: `Błąd generowania diety: ${error?.message ?? "nieznany błąd"}` };
}
}
});

export const dietAgent = new Agent({
  name: "Diet Agent",
  instructions: "You are a helpful clinical nutritionist generating structured 7-day diets in JSON.",
  tools: [generateDietTool]
});
