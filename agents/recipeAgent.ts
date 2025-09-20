// agents/recipeAgent.ts
import { Agent, run } from "@openai/agents";

// — Kanoniczne klucze posiłków (niezależne od języka)
const MEAL_KEYS_BY_COUNT: Record<number, string[]> = {
  2: ["breakfast","dinner"],
  3: ["breakfast","lunch","dinner"],
  4: ["breakfast","second_breakfast","lunch","dinner"],
  5: ["breakfast","second_breakfast","lunch","afternoon_snack","dinner"],
  6: ["breakfast","second_breakfast","lunch","afternoon_snack","dinner","snack"],
};
const VALID_MEAL_KEYS = new Set([
  "breakfast","second_breakfast","lunch","afternoon_snack","dinner","snack"
]);

/** —————————————————————————————————————————————
 *  KONTEKST KUCHNI (możesz rozbudowywać w 1 miejscu)
 *  ————————————————————————————————————————————— */
const cuisineContextMap: Record<string, string> = {
  "Polska": "Polish cuisine: soups, fermented vegetables, root vegetables, pork, rye bread",
  "Włoska": "Italian cuisine: pasta, olive oil, tomatoes, basil, cheeses like mozzarella and parmesan",
  "Japońska": "Japanese cuisine: rice, miso, seaweed, tofu, sushi, umami-rich dishes",
  "Chińska": "Chinese cuisine: stir-fried dishes, ginger, garlic, soy sauce, rice, noodles",
  "Tajska": "Thai cuisine: coconut milk, chili, lemongrass, coriander, sweet-spicy balance",
  "Wietnamska": "Vietnamese cuisine: fresh herbs, rice noodles, fish sauce, light broths",
  "Indyjska": "Indian cuisine: rich spices, curries, lentils, turmeric, ghee",
  "Koreańska": "Korean cuisine: fermented vegetables, gochujang, rice, grilled meats",
  "Bliskowschodnia": "Middle Eastern: legumes, olive oil, tahini, spices, flatbreads",
  "Francuska": "French: sauces, butter, herbs de Provence, regional meats",
  "Hiszpańska": "Spanish: olive oil, paprika, garlic, seafood, tapas",
  "Skandynawska": "Scandinavian: rye, fish, dairy, root vegetables",
  "Północnoamerykańska": "North American: diverse fusion, whole grains, grilling",
  "Brazylijska": "Brazilian: rice, beans, cassava, tropical fruits",
  "Afrykańska": "African: millet, legumes, peanut stew, bold spices",
  "Dieta arktyczna / syberyjska": "Arctic/Siberian: fish, berries, root vegetables, animal fat"
};
const cuisineSeasoningMap: Record<string, {
  herbs?: string[]; spices?: string[]; fats?: string[];
  acids?: string[]; heat?: string[]; aromatics?: string[];
  condiments?: string[];
}> = {
  "Polska": {
    herbs: ["koperek","pietruszka","majeranek"],
    spices: ["pieprz","papryka słodka","liść laurowy","ziele angielskie"],
    fats: ["masło","olej rzepakowy","smalec (opcjonalnie)"],
    acids: ["sok z cytryny","ocet jabłkowy","kapusta kiszona"],
    heat: ["chili (oszczędnie)"],
    aromatics: ["cebula","czosnek","por"],
    condiments: ["musztarda","chrzan","śmietana (opcjonalnie)"]
  },
  "Włoska": {
    herbs: ["bazylia","oregano","rozmaryn","tymianek","szałwia","pietruszka"],
    spices: ["pieprz","papryka płatki"],
    fats: ["oliwa z oliwek","masło"],
    acids: ["ocet balsamiczny","sok z cytryny","pomidor (kwas)"],
    heat: ["chili (peperoncino)"],
    aromatics: ["czosnek","cebula","seler naciowy","marchew"],
    condiments: ["parmezan","kapary","anchois"]
  },
  "Japońska": {
    herbs: ["szczypiorek","shiso (jeśli dostępne)"],
    spices: ["pieprz sansho (opcjonalnie)"],
    fats: ["olej sezamowy","olej ryżowy"],
    acids: ["ocet ryżowy","cytrus (yuzu/lemon)"],
    heat: ["chili togarashi (umiarkowanie)"],
    aromatics: ["imbir","czosnek","dashi (aromat)"],
    condiments: ["miso","shoyu (sos sojowy)","mirin"]
  },
  "Chińska": {
    herbs: ["cebula dymka","kolendra"],
    spices: ["pieprz syczuański","pięć smaków","anyż"],
    fats: ["olej arachidowy","olej rzepakowy"],
    acids: ["ocet ryżowy","czarny ocet"],
    heat: ["chili (suszone/olej chili)"],
    aromatics: ["imbir","czosnek","długa dymka"],
    condiments: ["sos sojowy","ostry sos fasolowy","sos ostrygowy"]
  },
  "Tajska": {
    herbs: ["kolendra","tajska bazylia","liście limonki kafir"],
    spices: ["kmin","kolendra mielona"],
    fats: ["olej kokosowy","olej ryżowy"],
    acids: ["limonka","tamaryndowiec","sos rybny (słono-umami)"],
    heat: ["chili (bird’s eye)"],
    aromatics: ["trawa cytrynowa","imbir/galangal","czosnek","szalotka"],
    condiments: ["pasta curry","cukier palmowy","sos ostrygowy"]
  },
  "Wietnamska": {
    herbs: ["mięta","kolendra","tajska bazylia"],
    spices: ["pieprz"],
    fats: ["olej ryżowy"],
    acids: ["limonka","ocet ryżowy","nuoc cham (kwaśny)"],
    heat: ["chili świeże"],
    aromatics: ["czosnek","szalotka","imbir"],
    condiments: ["nước mắm (sos rybny)","cukier palmowy"]
  },
  "Indyjska": {
    herbs: ["kolendra świeża","mięta"],
    spices: ["kumin","kolendra","kurkuma","garam masala","gorczyca","kardamon","goździk"],
    fats: ["ghee","olej rzepakowy/kokosowy"],
    acids: ["jogurt","tamaryndowiec","sok z cytryny"],
    heat: ["chili (proszek/świeże)"],
    aromatics: ["cebula","czosnek","imbir"],
    condiments: ["pasta curry","chutney","jogurt"]
  },
  "Koreańska": {
    herbs: ["dymka"],
    spices: ["gochugaru"],
    fats: ["olej sezamowy"],
    acids: ["kimchi (kwaśno)","ocet ryżowy"],
    heat: ["chili gochujang/gochugaru"],
    aromatics: ["czosnek","imbir"],
    condiments: ["gochujang","doenjang","sos sojowy"]
  },
  "Bliskowschodnia": {
    herbs: ["pietruszka","mięta","kolendra"],
    spices: ["kumin","sumak","za’atar","papryka"],
    fats: ["oliwa z oliwek","tahini (tłuszcz + umami)"],
    acids: ["cytryna","ocet winny","sumak (kwaskowy)"],
    heat: ["chili (umiarkowanie)"],
    aromatics: ["czosnek","cebula"],
    condiments: ["tahini","jogurt","harissa"]
  },
  "Francuska": {
    herbs: ["tymianek","rozmaryn","estragon","pietruszka","szczypiorek","liść laurowy"],
    spices: ["pieprz","gałka muszkatołowa"],
    fats: ["masło","oliwa z oliwek","ghee"],
    acids: ["wino","ocet winny","cytryna"],
    heat: ["chili (oszczędnie)"],
    aromatics: ["cebula","marchew","seler naciowy","czosnek"],
    condiments: ["musztarda dijon","kapary","anchois"]
  },
  "Hiszpańska": {
    herbs: ["pietruszka","tymianek","rozmaryn"],
    spices: ["papryka słodka/wędzona","szafran (opcjonalnie)"],
    fats: ["oliwa z oliwek"],
    acids: ["ocet sherry","cytryna"],
    heat: ["chili (pimiento)"],
    aromatics: ["czosnek","cebula"],
    condiments: ["oliwki","anchois"]
  },
  "Skandynawska": {
    herbs: ["koperek","szczypiorek","pietruszka"],
    spices: ["pieprz","jałowiec"],
    fats: ["masło","olej rzepakowy"],
    acids: ["ocet spirytusowy","cytryna","marynaty"],
    heat: ["chili (rzadko)"],
    aromatics: ["cebula","por"],
    condiments: ["musztarda","śmietana (opcjonalnie)"]
  },
  "Północnoamerykańska": {
    herbs: ["pietruszka","szczypiorek","kolendra"],
    spices: ["papryka","czosnek granulowany","cebula granulowana"],
    fats: ["masło","olej rzepakowy"],
    acids: ["ocet jabłkowy","cytryna"],
    heat: ["chili/cayenne (umiarkowanie)"],
    aromatics: ["cebula","czosnek","seler naciowy"],
    condiments: ["musztarda","BBQ (opcjonalnie)"]
  },
  "Brazylijska": {
    herbs: ["kolendra","pietruszka"],
    spices: ["pieprz","papryka"],
    fats: ["olej roślinny","olej dendê (opcjonalnie)"],
    acids: ["limonka","ocet"],
    heat: ["chili"],
    aromatics: ["czosnek","cebula"],
    condiments: ["mleczko kokosowe (opcjonalnie)"]
  },
  "Afrykańska": {
    herbs: ["kolendra","pietruszka"],
    spices: ["kumin","kolendra","papryka","berbere/ras el hanout (regionalnie)"],
    fats: ["olej roślinny","ghee"],
    acids: ["cytryna","ocet"],
    heat: ["chili"],
    aromatics: ["cebula","czosnek","imbir"],
    condiments: ["tahini (północ)","sos pomidorowy"]
  },
  "Dieta arktyczna / syberyjska": {
    herbs: ["koperek","szczypiorek"],
    spices: ["pieprz"],
    fats: ["olej rzepakowy","masło"],
    acids: ["cytryna","marynaty"],
    heat: ["chili (rzadko)"],
    aromatics: ["cebula","czosnek"],
    condiments: ["śmietana (opcjonalnie)","musztarda"]
  }
};
/** —————————————————————————————————————————————
 *  WSPÓLNE INSTRUKCJE (JSON-only, szybkie odpowiedzi)
 *  ————————————————————————————————————————————— */
const BASE_INSTRUCTIONS = `
You are a multilingual professional chef and clinical nutritionist.
Your job is to generate complete, step-by-step cooking recipes for each meal.

STRICT JSON MODE:
- OUTPUT MUST BE PURE JSON. No prose, no explanations, no markdown fences.
- If you cannot produce recipes, return {"recipes": []}. Valid JSON only.

INPUT (single JSON string):
{
  "lang": "pl" | "en" | "...",
  "dietPlan": { /* day -> meals minimal spec */ },
  "nutrientFocus": ["iron","vitaminD",...],
  "cuisine": "…",
  "cuisineNote": "…"
}

CRITICAL RULES:
- Reuse input day labels as given in dietPlan; do NOT rename day keys.
- For EACH recipe, set **meal** to one of:
  ["breakfast","second_breakfast","lunch","afternoon_snack","dinner","snack"]  ← canonical keys
- Also provide **meal_label**: a natural label for 'meal' in input.lang (e.g., PL: "Śniadanie", "Obiad"…).
- Choose meal keys by ordering meals within a day (time or logical order):
  2→[breakfast,dinner], 3→[breakfast,lunch,dinner], 4→[…second_breakfast…], 5→[…afternoon_snack…], 6→[…,snack].
- Translate CONTENT (titles, ingredient names, instructions) to input.lang.
- Units allowed: "g", "ml", "pcs". Use **ml for liquids**, **g for herbs/spices**, **pcs for discrete items**. 
- Do NOT use localized unit codes like "szt", "ud", "шт", etc.
- Healthy, realistic methods; concise, numbered steps when helpful.

SEASONING DOCTRINE:
- Include herbs/spices + proper cooking fat; use acid for seafood/salads.
- **Do NOT add salt/pepper to desserts and smoothies unless explicitly requested.**
- Salt budget: default ≤ 2 g per savory recipe; salads ≤ 1 g.

OUTPUT SHAPE:
{
  "recipes": [
    {
      "day": "<day from input>",
      "meal": "breakfast|second_breakfast|lunch|afternoon_snack|dinner|snack",
      "meal_label": "<label of 'meal' in input.lang>",
      "title": "<dish title in input.lang>",
      "time": "HH:MM" | "<short time>",
      "ingredients": [
        { "name": "<string>", "amount": <number>, "unit": "g" | "ml" | "szt" }
      ],
      "instructions": ["step 1", "step 2", "..."],
      "nutrientSummary": { /* optional micronutrients */ }
    }
  ]
}
`.trim();

/** —————————————————————————————————————————————
 *  DWA AGENTY: quality (gpt-4o) i fast (gpt-4o-mini)
 *  ————————————————————————————————————————————— */
function buildRecipeAgent(model: string, name: string) {
  return new Agent({
    name,
    model,
    instructions: BASE_INSTRUCTIONS
  });
}

const recipeAgentQuality = buildRecipeAgent("gpt-4o", "Recipe Agent (Quality)");
const recipeAgentFast = buildRecipeAgent("gpt-4o-mini", "Recipe Agent (Fast)");

/** —————————————————————————————————————————————
 *  Pomocnicze: parser JSON (bez fence’ów) i kompresja wejścia
 *  ————————————————————————————————————————————— */
function tryParseJsonLoose(text: string): any | null {
  if (!text) return null;
  // Usuń BOM i fence’y (case-insensitive), zostaw czysty tekst
  const noBom = text.replace(/^\uFEFF/, "");
  const noFences = noBom.replace(/```(?:json)?|```/gi, "").trim();

  // 1) Próba wprost
  try { return JSON.parse(noFences); } catch {}

  // 2) Wytnij NAJWIĘKSZY blok JSON od pierwszej "{" do ostatniej "}"
  const first = noFences.indexOf("{");
  const last = noFences.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const candidate = noFences.slice(first, last + 1);
    try { return JSON.parse(candidate); } catch {}
  }

  return null;
}

// Minimalizacja dietPlan -> day/meal/title/ingredients[name,amount,unit]
const MAX_ING_PER_MEAL = 24;

function shrinkDietPlan(dietPlan: any): any {
  if (!dietPlan || typeof dietPlan !== "object") return dietPlan;

  const prIngredient = (i: any) => {
    if (!i || typeof i !== "object") return null;
    const name = String(i?.name ?? i?.product ?? "").trim();
    if (!name) return null;
    const amount =
      typeof i?.amount === "number" ? Math.max(0, Math.round(i.amount)) :
      typeof i?.grams === "number" ? Math.max(0, Math.round(i.grams)) :
      typeof i?.weight === "number" ? Math.max(0, Math.round(i.weight)) :
      typeof i?.quantity === "number" ? Math.max(0, Math.round(i.quantity)) :
      undefined;
    const unit = i?.unit ? String(i.unit).trim() : undefined;
    return { name, amount, unit };
  };

  const prMeal = (m: any) => {
    if (!m || typeof m !== "object") return undefined;
    const title = String(m?.title ?? m?.dish ?? "").trim() || undefined;
    const src = Array.isArray(m?.ingredients) ? m.ingredients : [];
    const ingredients = src
      .map(prIngredient)
      .filter(Boolean)
      .slice(0, MAX_ING_PER_MEAL);
    return { title, ingredients: ingredients.length ? ingredients : undefined };
  };

  // Słownik { day: { meal: {...} } }
  if (!Array.isArray(dietPlan)) {
    const out: Record<string, any> = {};
    for (const [dayKeyRaw, mealsRaw] of Object.entries(dietPlan)) {
      const dayKey = String(dayKeyRaw).trim() || "Dzień";
      const reduced: Record<string, any> = {};
      if (mealsRaw && typeof mealsRaw === "object") {
        for (const [mealKeyRaw, m] of Object.entries(mealsRaw as any)) {
          if (!m || typeof m !== "object") continue;
          const mealKey = String(mealKeyRaw).trim() || "posiłek";
          const pm = prMeal(m);
          if (pm) reduced[mealKey] = pm;
        }
      }
      out[dayKey] = reduced;
    }
    return out;
  }

  // Tablica dni
  const merged: Record<string, any> = {};
  for (const day of dietPlan) {
    const dayKey = String(day?.day || day?.name || day?.title || "").trim() || "Dzień";
    const reduced: Record<string, any> = {};

    if (Array.isArray(day?.meals)) {
      for (const m of day.meals) {
        if (!m || typeof m !== "object") continue;
        const mealKey = String(m?.meal || m?.name || m?.title || "").trim() || "posiłek";
        const pm = prMeal(m);
        if (pm) reduced[mealKey] = pm;
      }
    } else if (day && typeof day === "object") {
      for (const [k, v] of Object.entries(day)) {
        if (k === "day" || k === "name" || k === "title" || k === "meals") continue;
        if (!v || typeof v !== "object") continue;
        const mealKey = String(k).trim() || "posiłek";
        const pm = prMeal(v);
        if (pm) reduced[mealKey] = pm;
      }
    }

    merged[dayKey] = { ...(merged[dayKey] || {}), ...reduced };
  }
  return merged;
}


/** —————————————————————————————————————————————
 *  Publiczny wrapper: generateRecipes()
 *  ————————————————————————————————————————————— */
type GenerateRecipesInput = {
  lang?: string;
  cuisine?: string;
  dietPlan: any;
  nutrientFocus?: string[];
  modelHint?: "fast" | "quality";
};

export async function generateRecipes(input: GenerateRecipesInput): Promise<{ recipes: any[] }> {
  const {
    lang = "pl",
    cuisine,
    dietPlan,
    nutrientFocus = [],
    modelHint = "quality"
  } = input || ({} as GenerateRecipesInput);

  const cuisineNote = cuisineContextMap[cuisine || ""] || "general culinary tradition";
  

  // DODATKOWA KOMPRESJA (na wypadek wołań spoza batchowanego handlera)
  const compactDietPlan = shrinkDietPlan(dietPlan);

  const userPayload = {
    lang,
    nutrientFocus,
    cuisine,
    cuisineNote,
    // Klucze day/meal mają zostać użyte 1:1 — compakt zachowuje klucze
    dietPlan: compactDietPlan
  };

  // Wybór agenta w locie
  const agent = modelHint === "fast" ? recipeAgentFast : recipeAgentQuality;

  // starsze SDK: run(agent, input: string)
  const result: any = await run(agent, JSON.stringify(userPayload));
  const text = String(
    result?.finalOutput ??
    result?.output_text ??
    ""
  ).trim();

  const parsed = tryParseJsonLoose(text);
  // — Fallback: uzupełnij/napraw 'meal' na kanoniczne klucze, nie zmieniaj 'meal_label'
function enforceCanonicalMealKeys(obj: any) {
  // zbuduj tablicę wyników (obsłuż zarówno recipes: [], jak i recipes: { day: {…} })
  let arr: any[] = [];
  if (Array.isArray(obj?.recipes)) arr = obj.recipes;
  else if (obj?.recipes && typeof obj.recipes === "object") {
    for (const [day, meals] of Object.entries(obj.recipes as Record<string, any>)) {
      for (const [meal, body] of Object.entries(meals || {})) {
        arr.push({ day, meal, ...(body as any) });
      }
    }
  }

  // grupuj po dniu i nadaj klucze wg pozycji, jeśli brak lub spoza zbioru
  const byDay: Record<string, any[]> = {};
  for (const r of arr) (byDay[r.day || "Other"] ||= []).push(r);

  for (const day of Object.keys(byDay)) {
    const list = byDay[day];
    const total = list.length || 4;
    const scheme = MEAL_KEYS_BY_COUNT[total] || MEAL_KEYS_BY_COUNT[4];
    // sortuj wg czasu, jeśli jest
    list.sort((a,b) => String(a.time||"").localeCompare(String(b.time||"")));
    list.forEach((r, i) => {
      const m = String(r.meal || "").trim();
      if (!VALID_MEAL_KEYS.has(m)) r.meal = scheme[Math.min(i, scheme.length-1)];
    });
  }

  // spłaszcz
  const out: any[] = [];
  for (const d of Object.keys(byDay)) for (const r of byDay[d]) out.push(r);
  return { recipes: out };
}

const canonicalized = enforceCanonicalMealKeys(parsed);

  if (!parsed || typeof parsed !== "object") return { recipes: [] };
  // — Sanitizer: ujednolić wynik, odsiać złe wpisy —
const cleanUnit = (u: any) => {
  const x = String(u || "").toLowerCase();
  if (x === "g" || x.startsWith("gram")) return "g";
  if (x === "ml" || x.startsWith("millil")) return "ml";
  if (
    x === "pcs" || x === "pc" || x === "piece" || x === "pieces" ||
    x.startsWith("szt") || x === "ud" || x === "uds" ||
    x === "шт" || x === "шт." || x === "stk" || x === "st."
  ) return "pcs";
  return "g";
};

function sanitizeRecipes(obj: any): { recipes: any[] } {
  let arr: any[] = [];
  if (Array.isArray(obj.recipes)) arr = obj.recipes;
  else if (obj.recipes && typeof obj.recipes === "object") {
    for (const [day, meals] of Object.entries(obj.recipes as Record<string, any>)) {
      for (const [meal, body] of Object.entries(meals || {})) {
        arr.push({ day, meal, ...(body as any) });
      }
    }
  }
  // Filtr i normalizacja
  const out = arr
    .filter(r => r && typeof r === "object")
    .map(r => {
      const day = String(r.day ?? "").trim();
      const meal = String(r.meal ?? "").trim();
      const title = String(r.title ?? "").trim();
      const time = r.time ? String(r.time).slice(0, 16) : undefined;
      const ingredients = Array.isArray(r.ingredients) ? r.ingredients
        .filter((i:any)=> i && typeof i === "object" && String(i?.name || "").trim())
        .slice(0, MAX_ING_PER_MEAL)
        .map((i:any)=> ({
          name: String(i.name).trim(),
          amount: typeof i.amount === "number" ? Math.max(0, Math.round(i.amount)) : null,
          unit: cleanUnit(i.unit)
        })) : [];
      const instructions = Array.isArray(r.instructions) ? r.instructions
        .filter((s:any)=> typeof s === "string" && s.trim().length)
        .map((s:string)=> s.trim().slice(0, 200))
        : [];
      const nutrientSummary = (r.nutrientSummary && typeof r.nutrientSummary === "object") ? r.nutrientSummary : undefined;
      return { day, meal, title, time, ingredients, instructions, nutrientSummary };
    })
    .filter(r => r.day && r.meal && r.title && r.ingredients.length && r.instructions.length);
  return { recipes: out };
}

const sanitized = sanitizeRecipes(parsed);
if (!sanitized.recipes.length) return { recipes: [] };
return sanitized;
}

// (opcjonalnie) eksport mapy kuchni
export { cuisineContextMap, cuisineSeasoningMap };

