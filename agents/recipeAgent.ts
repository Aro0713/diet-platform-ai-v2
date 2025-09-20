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
- Reuse input day labels; do NOT rename day keys.
- For EACH recipe, set meal to one of: ["breakfast","second_breakfast","lunch","afternoon_snack","dinner","snack"] (canonical keys), and provide meal_label in input.lang.
- All ingredient names MUST be in input.lang. Do NOT mix languages.
- Units allowed: "g", "ml", "pcs". Use ml for liquids, g for herbs/spices, pcs for discrete items. Do NOT output localized unit codes (no "szt", "ud", "шт").
- Healthy, realistic methods; concise, numbered steps when helpful.
- Do NOT add salt/pepper to desserts, yogurts, sweet snacks, or smoothies unless explicitly requested.
- Salt budget: ≤ 2 g for savory; salads ≤ 1 g.

SEASONING DOCTRINE:
- Include herbs/spices + proper cooking fat; use acid for seafood/salads.

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
        { "name": "<string>", "amount": <number>, "unit": "g" | "ml" | "pcs" }
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
// — Lokalizacja podstawowych nazw składników (11 języków)
const LOCALIZE_BASICS: Record<string, Record<string, string>> = {
  pl: { "Salt":"Sól","Pepper":"Pieprz","Olive oil":"Oliwa z oliwek","Lemon juice":"Sok z cytryny","Cottage cheese":"Serek wiejski" },
  en: { "Salt":"Salt","Pepper":"Pepper","Olive oil":"Olive oil","Lemon juice":"Lemon juice","Cottage cheese":"Cottage cheese" },
  de: { "Salt":"Salz","Pepper":"Pfeffer","Olive oil":"Olivenöl","Lemon juice":"Zitronensaft","Cottage cheese":"Hüttenkäse" },
  fr: { "Salt":"Sel","Pepper":"Poivre","Olive oil":"Huile d'olive","Lemon juice":"Jus de citron","Cottage cheese":"Fromage cottage" },
  es: { "Salt":"Sal","Pepper":"Pimienta","Olive oil":"Aceite de oliva","Lemon juice":"Zumo de limón","Cottage cheese":"Queso cottage" },
  ua: { "Salt":"Сіль","Pepper":"Перець","Olive oil":"Оливкова олія","Lemon juice":"Лимонний сік","Cottage cheese":"Зернистий сир" },
  ru: { "Salt":"Соль","Pepper":"Перец","Olive oil":"Оливковое масло","Lemon juice":"Лимонный сок","Cottage cheese":"Творог" },
  zh: { "Salt":"盐","Pepper":"胡椒","Olive oil":"橄榄油","Lemon juice":"柠檬汁","Cottage cheese":"茅屋奶酪" },
  hi: { "Salt":"नमक","Pepper":"काली मिर्च","Olive oil":"जैतून का तेल","Lemon juice":"नींबू का रस","Cottage cheese":"कॉटेज चीज़" },
  ar: { "Salt":"ملح","Pepper":"فلفل","Olive oil":"زيت الزيتون","Lemon juice":"عصير الليمون","Cottage cheese":"جبن قريش" },
  he: { "Salt":"מלח","Pepper":"פלפל","Olive oil":"שמן זית","Lemon juice":"מיץ לימון","Cottage cheese":"קוטג׳" }
};

const SWEET_TOKENS = [
  "smoothie","shake","koktajl","milkshake","dessert","deser","jogurt","yogurt","pudding","budyń",
  "granola","oat","owsian","berries","jagod","fruit","owoc"
];

function looksSweet(title: string, ingredients: any[]): boolean {
  const t = (title || "").toLowerCase();
  if (SWEET_TOKENS.some(w => t.includes(w))) return true;
  const sweets = ["honey","miód","sugar","cukier","banana","banan","berries","jagod","jam","dżem"];
  return ingredients?.some((i:any)=> sweets.some(w => String(i?.name||"").toLowerCase().includes(w)));
}

function localizeBasics(recipesObj: any, lang: string) {
  const map = LOCALIZE_BASICS[lang] || LOCALIZE_BASICS.en;
  // zbuduj tablicę wyników niezależnie od formatu
  let arr: any[] = [];
  if (Array.isArray(recipesObj?.recipes)) arr = recipesObj.recipes;
  else if (recipesObj?.recipes && typeof recipesObj.recipes === "object") {
    for (const [day, meals] of Object.entries(recipesObj.recipes as Record<string, any>)) {
      for (const [meal, body] of Object.entries(meals || {})) {
        arr.push({ day, meal, ...(body as any) });
      }
    }
  }

  // przejście po przepisach
  for (const r of arr) {
    const ing = Array.isArray(r.ingredients) ? r.ingredients : [];
    const sweet = looksSweet(r.title, ing);

    // 1) lokalizacja podstawowych nazw (tylko gdy nazwa jest w EN)
    for (const it of ing) {
      const raw = String(it?.name || "");
      const key = Object.keys(map).find(k => k.toLowerCase() === raw.toLowerCase());
      if (key) it.name = map[key];
      // płyny: jeśli "Lemon juice" (albo zmapowany odpowiednik) i unit "g" → "ml"
      const lc = raw.toLowerCase();
      if ((lc.includes("juice") || lc.includes("sok")) && it.unit === "g") it.unit = "ml";
      if ((lc.includes("olive oil") || lc.includes("huile d'olive")) && it.unit === "g") it.unit = "ml";
    }

    // 2) usuń sól/pieprz dla deserów/smoothie, jeśli nie ma ich w krokach „na życzenie”
    if (sweet) {
      const steps = (r.instructions || []).join(" ").toLowerCase();
      const explicit = steps.includes("sól") || steps.includes("salt") || steps.includes("pepper") || steps.includes("pieprz");
      if (!explicit) {
        r.ingredients = ing.filter((it:any) => {
          const n = String(it?.name||"").toLowerCase();
          return !(["salt","sól","pepper","pieprz"].some(w => n.includes(w)));
        });
      }
    }

    // 3) de-duplikacja po (name, unit)
    const seen = new Map<string, any>();
    for (const it of r.ingredients) {
      const k = `${String(it.name).toLowerCase()}|${it.unit||""}`;
      if (!seen.has(k)) seen.set(k, it);
      else {
        const prev = seen.get(k);
        if (typeof prev.amount === "number" && typeof it.amount === "number") prev.amount += it.amount;
      }
    }
    r.ingredients = Array.from(seen.values());
  }

  return { recipes: arr };
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
if (!parsed || typeof parsed !== "object") return { recipes: [] };

// — 1) kanonizuj klucze posiłków wg pozycji w dniu
function enforceCanonicalMealKeys(obj: any) {
  let arr: any[] = [];
  if (Array.isArray(obj?.recipes)) arr = obj.recipes;
  else if (obj?.recipes && typeof obj.recipes === "object") {
    for (const [day, meals] of Object.entries(obj.recipes as Record<string, any>)) {
      for (const [meal, body] of Object.entries(meals || {})) {
        arr.push({ day, meal, ...(body as any) });
      }
    }
  }
  const byDay: Record<string, any[]> = {};
  for (const r of arr) (byDay[r.day || "Other"] ||= []).push(r);

  for (const day of Object.keys(byDay)) {
    const list = byDay[day];
    const total = list.length || 4;
    const scheme = MEAL_KEYS_BY_COUNT[total] || MEAL_KEYS_BY_COUNT[4];
    list.sort((a,b) => String(a.time||"").localeCompare(String(b.time||"")));
    list.forEach((r, i) => {
      const m = String(r.meal || "").trim();
      if (!VALID_MEAL_KEYS.has(m)) r.meal = scheme[Math.min(i, scheme.length-1)];
    });
  }
  const out: any[] = [];
  for (const d of Object.keys(byDay)) for (const r of byDay[d]) out.push(r);
  return { recipes: out };
}

const canonicalized = enforceCanonicalMealKeys(parsed);

// — 2) zlokalizuj bazowe nazwy (Sól/Pieprz/Oliwa/… w lang)
const localized = localizeBasics(canonicalized, lang);

// — 3) sanity + normalizacja jednostek do g|ml|pcs
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
      const meal_label = typeof r.meal_label === "string" ? r.meal_label : undefined; // ← zachowaj label z agenta
      return { day, meal, meal_label, title, time, ingredients, instructions, nutrientSummary };
    })
    .filter(r => r.day && r.meal && r.title && r.ingredients.length && r.instructions.length);
  return { recipes: out };
}

const sanitized = sanitizeRecipes(localized);
if (!sanitized.recipes.length) return { recipes: [] };
return sanitized;

}

// (opcjonalnie) eksport mapy kuchni
export { cuisineContextMap, cuisineSeasoningMap };

