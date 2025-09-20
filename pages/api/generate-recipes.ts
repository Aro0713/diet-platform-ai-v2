// pages/api/generate-recipes.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { generateRecipes } from "@/agents/recipeAgent";

// (opcjonalnie) mały, bezpieczny limit body
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

type Unit = "g" | "ml" | "pcs";
type NormalizedIngredient = { name: string; amount: number | null; unit: Unit };
type NormalizedRecipe = {
  day: string;
  meal: string;
  title: string;
  time?: string;
  ingredients: NormalizedIngredient[];
  instructions: string[];
  nutrientSummary?: Record<string, number>;
};

// --- Normalizacje jak w generate-diet.ts (spójny styl) ---
function normalizeUnit(u: string | null | undefined): Unit {
  const x = String(u || "").trim().toLowerCase();
  if (x === "g" || x.startsWith("gram")) return "g";
  if (x === "ml" || x.startsWith("millil")) return "ml";
  if (
    x === "pcs" || x === "pc" || x === "piece" || x === "pieces" ||
    x.startsWith("szt") || x === "ud" || x === "uds" ||
    x === "шт" || x === "шт." || x === "stk" || x === "st."
  ) return "pcs";
  return "g";
}

function normalizeIngredients(arr: any): NormalizedIngredient[] {
  const list = Array.isArray(arr) ? arr : [];
  return list.map((i: any) => ({
    name: String(i?.name ?? i?.product ?? "").trim(),
    amount:
      typeof i?.amount === "number" ? Math.round(i.amount) :
      typeof i?.grams === "number" ? Math.round(i.grams) :
      typeof i?.weight === "number" ? Math.round(i.weight) :
      typeof i?.quantity === "number" ? Math.round(i.quantity) :
      null,
    unit: normalizeUnit(i?.unit),
  }));
}

// meal może być stringiem lub obiektem { "Śniadanie": { title, ingredients, ... } }
function coerceMealKeyAndPayload(r: any): { mealKey: string; payload: any } {
  const val = r?.meal;
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.length === 1) {
      const k = String(keys[0]);
      const payload = { ...r, ...(val[k] || {}) };
      return { mealKey: k, payload };
    }
  }
  return { mealKey: String(val ?? "").trim(), payload: r };
}

function normalizeRecipe(r: any): NormalizedRecipe {
  const { mealKey, payload } = coerceMealKeyAndPayload(r);

  const title =
    (typeof payload?.title === "string" && payload.title.trim()) ? payload.title.trim() :
    (typeof payload?.dish === "string" && payload.dish.trim()) ? payload.dish.trim() :
    "";

  const instructions = Array.isArray(payload?.instructions)
    ? payload.instructions.filter((s: any) => typeof s === "string" && s.trim().length > 0).map((s: string) => s.trim())
    : Array.isArray(payload?.steps)
      ? payload.steps.filter((s: any) => typeof s === "string" && s.trim().length > 0).map((s: string) => s.trim())
      : [];

  return {
    day: String(payload?.day ?? r?.day ?? "").trim(),
    meal: mealKey || String(r?.meal ?? "").trim(),
    title,
    time: payload?.time ? String(payload.time).trim() : undefined,
    ingredients: normalizeIngredients(payload?.ingredients),
    instructions,
    nutrientSummary:
      typeof payload?.nutrientSummary === "object" && payload?.nutrientSummary
        ? payload.nutrientSummary
        : undefined,
  };
}

// UI format (zgodny z PDF/komponentem)
type RecipeForUI = {
  dish: string;
  description?: string;
  servings?: number;
  time?: string;
  ingredients: { product: string; weight: number | null; unit: Unit }[];
  steps: string[];
};
// ——— helpers: ograniczanie współbieżności bez zewn. bibliotek ———
function pLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    active--;
    if (queue.length) queue.shift()!();
  };
  return async <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn().then((v) => { resolve(v); next(); }).catch((e) => { reject(e); next(); });
      };
      if (active < concurrency) run();
      else queue.push(run);
    });
}

// ——— kompresja dietPlan: tylko to, czego naprawdę potrzebuje agent przepisu ———
type MinimalMeal = {
  meal: string;
  title?: string;
  ingredients?: Array<{ name: string; amount?: number; unit?: string }>;
};
type MinimalDay = { day: string; meals: MinimalMeal[] };

function compressDietPlan(dietPlan: any): MinimalDay[] {
  const out: MinimalDay[] = [];
  // Obsłuż oba formaty: tablica dni albo słownik { day: {...} }
  if (Array.isArray(dietPlan)) {
    for (const d of dietPlan) {
      const dayName = String(d?.day || d?.name || d?.title || '').trim() || 'Dzień';
      const meals: MinimalMeal[] = [];
      const srcMeals = Array.isArray(d?.meals) ? d.meals : Object.entries(d || {}).filter(([k]) => k !== 'day').map(([,v]) => v);
      for (const m of srcMeals) {
        const mealKey = String(m?.meal || m?.name || m?.title || '').trim();
        const title = String(m?.title || m?.dish || '').trim() || mealKey;
        const ing = Array.isArray(m?.ingredients) ? m.ingredients.map((i:any)=>({
          name: String(i?.name ?? i?.product ?? '').trim(),
          amount: typeof i?.amount === 'number' ? Math.round(i.amount)
                : typeof i?.grams === 'number' ? Math.round(i.grams)
                : typeof i?.weight === 'number' ? Math.round(i.weight)
                : typeof i?.quantity === 'number' ? Math.round(i.quantity)
                : undefined,
          unit: i?.unit ? String(i.unit) : undefined
        })) : [];
        meals.push({ meal: mealKey || title || 'posiłek', title, ingredients: ing });
      }
      out.push({ day: dayName, meals });
    }
  } else if (dietPlan && typeof dietPlan === 'object') {
    for (const [day, dayObj] of Object.entries(dietPlan as Record<string, any>)) {
      const meals: MinimalMeal[] = [];
      for (const [mealKey, m] of Object.entries(dayObj || {})) {
        const title = String((m as any)?.title || (m as any)?.dish || '').trim() || mealKey;
        const ing = Array.isArray((m as any)?.ingredients) ? (m as any).ingredients.map((i:any)=>({
          name: String(i?.name ?? i?.product ?? '').trim(),
          amount: typeof i?.amount === 'number' ? Math.round(i.amount)
                : typeof i?.grams === 'number' ? Math.round(i.grams)
                : typeof i?.weight === 'number' ? Math.round(i.weight)
                : typeof i?.quantity === 'number' ? Math.round(i.quantity)
                : undefined,
          unit: i?.unit ? String(i.unit) : undefined
        })) : [];
        meals.push({ meal: mealKey, title, ingredients: ing });
      }
      out.push({ day, meals });
    }
  }
  return out;
}

// ——— pomocnicze: lekkie retry z timeoutem na losowe lagi modeli ———
async function withTimeout<T>(p: Promise<T>, ms: number, label = 'op') {
  let to: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    to = setTimeout(() => rej(new Error(`timeout ${label} after ${ms}ms`)), ms);
  });
  try { return await Promise.race([p, timeout]); }
  finally { clearTimeout(to!); }
}
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500) {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; if (i < retries) await new Promise(r=>setTimeout(r, delayMs*(i+1))); }
  }
  throw lastErr;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { dietPlan, lang, modelHint } = req.body || {};
  if (!dietPlan) return res.status(400).send("Brakuje dietPlan w danych wejściowych.");

  try {
    // 1) Kompresja i grupowanie po dniach
    const days: MinimalDay[] = compressDietPlan(dietPlan);
    if (!days.length) return res.status(400).send("dietPlan nie zawiera posiłków.");

    // 2) Ograniczona współbieżność (3 równoległe zapytania sprawdzają się najlepiej na Vercel/Pro)
    const limit = pLimit(3);

    // 3) Zlecenia per-dzień (małe prompt’y)
    const perDayJobs = days.map((d) => limit(async () => {
      const payload = {
        // wysyłamy JEDEN dzień – minimalny
        dietPlan: { [d.day]: Object.fromEntries(d.meals.map(m => [m.meal || m.title || 'posiłek', {
          title: m.title,
          ingredients: m.ingredients
        }])) },
        lang: lang || 'pl',
        // delikatna podpowiedź dla agenta — jeśli obsłużysz w recipeAgent
        modelHint: modelHint || 'fast'
      };

      // retry + timeout per dzień
      const dayResult = await withRetry(
        () => withTimeout(generateRecipes(payload), 25_000, `recipes:${d.day}`),
        2, 600
      );

      // Znormalizuj wynik dnia do postaci tablicowej
      let raw: any[] = [];
      if (Array.isArray(dayResult?.recipes)) raw = dayResult.recipes;
      else if (dayResult?.recipes && typeof dayResult.recipes === "object") {
        for (const [meal, body] of Object.entries(dayResult.recipes as Record<string, any>)) {
          raw.push({ day: d.day, meal, ...(body as any) });
        }
      }

      // Zwróć już znormalizowane wpisy
      return raw.map(normalizeRecipe);
    }));

    // 4) Zbieramy wyniki wszystkich dni
    const allPerDay = await Promise.all(perDayJobs);
    const recipes: NormalizedRecipe[] = ([] as NormalizedRecipe[]).concat(...allPerDay);
   // 4.1) MULTI-LANG sanitizers: only units, no language-specific renames

type Unit = "g" | "ml" | "pcs"; // <- upewnij się, że to masz na górze pliku

// ——— wielojęzyczne tokeny (PL/EN/ES/FR/DE/RU/UA/AR/HE/ZH/HI) ———
const TOKENS = {
  // zioła i delikatne przyprawy (używane do pcs→g)
  herbs: [
    // basil
    "basil","basilic","albahac","basilikum","базилик","بَازِلّا","בזיל","罗勒","तुलसी","bazyl",
    // parsley
    "parsley","persil","perejil","petersil","петруш","بقدونس","פטרוזיל","欧芹","अजमोद","pietrusz",
    // dill
    "dill","aneth","eneldo","dill","укроп","شبت","שמיר","莳萝","सोआ","koperek",
    // cilantro / coriander
    "cilantro","coriander","coriandr","кинза","кориандр","كزبرة","כוסבר","香菜","धनिया","kolendr",
    // chive / spring onion
    "chive","ciboulette","cebollín","schnittlauch","шнитт","بصل أخضر","עירית","细香葱","szczypior",
    // mint
    "mint","menthe","menta","minze","мята","نعناع","נענע","薄荷","mięt",
    // thyme
    "thyme","thym","tomillo","thymian","тимьян","زعتر","תימין","百里香","tymian",
    // rosemary
    "rosemary","romarin","romero","rosmarin","розмарин","إكليل الجبل","רוזמרין","迷迭香","rozmaryn",
    // oregano
    "oregano","orégano","oregano","ореган","أوريجانو","אורגנו","牛至","oregano",
    // marjoram
    "marjoram","marjolaine","mejorana","majoran","майоран","مردقوش","אזובית","墨角兰","majeran"
  ],
  // przyprawy / aromaty (do wykrycia „czy jest przyprawianie” + sól-klamra)
  seasoning: [
    // salt
    "salt","sal","sel","salz","соль","ملح","מלח","盐","नमक","sól",
    // pepper
    "pepper","poivre","pfeffer","pimienta","перец","فلفل","פלפל","胡椒","काली मिर्च","pieprz",
    // garlic
    "garlic","ail","knoblauch","ajo","чеснок","ثوم","שום","大蒜","czosnek",
    // paprika / chili
    "paprika","pimentón","paprika","паприк","فلفل حلو","פפריקה","红椒粉","chili","ají","piment","chil","辣椒",
    // cumin / turmeric / ginger / oregano / thyme / rosemary (część duplikuje herbs – ok)
    "cumin","comino","kreuzkümmel","кумин","كمون","כמון","孜然",
    "turmeric","curcuma","cúrcuma","куркума","كركم","כורכום","姜黄",
    "ginger","gingembre","jengibre","ingwer","имбир","زنجبيل","ג'ינג'ר","生姜",
    "oregano","orégano","thyme","thym","tomillo","rosemary","romarin","romero"
  ],
  // tłuszcze
  fats: [
    "olive oil","huile d'olive","aceite de oliva","olio d'oliva","оливковое масло","زيت الزيتون","שמן זית","橄榄油","oliwa z oliwek",
    "oil","huile","aceite","olio","масло","زيت","שמן","油",
    "butter","beurre","mantequilla","burro","масло слив","زبدة","חמאה","黄油","masło",
    "ghee"
  ],
  // płyny (do g→ml)
  liquids: [
    "oil","huile","aceite","olio","масло","زيت","שמן","油",
    "vinegar","vinaigre","vinagre","aceto","уксус","خل","醋",
    "water","eau","agua","acqua","вода","ماء","水",
    "milk","lait","leche","latte","молоко","حليب","牛奶",
    "juice","jus","zumo","succo","сок","عصير","汁",
    "soy sauce","sauce soja","salsa de soja","salsa di soia","соевый соус","صلصة الصويا","酱油"
  ]
};

const hasToken = (text: string, list: string[]) => {
  const lc = String(text || "").toLowerCase();
  return list.some(tok => lc.includes(tok));
};

// — standaryzacja jednostek i drobne sensowne korekty; NIE tłumaczymy nazw
function fixNameAndUnits(i: NormalizedIngredient, _recipeTitle: string): NormalizedIngredient {
  let name = String(i?.name ?? "").trim();
  let amount = typeof i?.amount === "number" ? i.amount : null;
  let unit: Unit = i?.unit; // "g" | "ml" | "pcs"
  const lc = name.toLowerCase();

  // płyny: gdy model zwróci w gramach → zamień na ml
  if (unit === "g" && hasToken(lc, TOKENS.liquids)) unit = "ml";

  // zioła: nigdy w sztukach → pcs→g
  if (unit === "pcs" && hasToken(lc, TOKENS.herbs)) unit = "g";

  return { name, amount, unit };
}

function ensureSpiceInList(r: NormalizedRecipe, name: string, amount: number, unit: Unit) {
  const has = r.ingredients.some(i => i.name.toLowerCase().includes(name.toLowerCase()));
  if (!has) r.ingredients.push({ name, amount, unit });
}

for (const r of recipes) {
  // 1) jednostki
  r.ingredients = r.ingredients.map(i => fixNameAndUnits(i, r.title));

  // 2) przyprawy z kroków → jeśli wspomniane, a brakuje na liście (multi-lang)
  const stepsText = (r.instructions || []).join(" ").toLowerCase();
  const mentionsPepper = hasToken(stepsText, ["pepper","poivre","pfeffer","pimienta","перец","فلفل","פלפל","胡椒","pieprz"]);
  const mentionsSalt   = hasToken(stepsText, ["salt","sal","sel","salz","соль","ملح","מלח","盐","sól"]);

  if (mentionsPepper && !r.ingredients.some(i => hasToken(i.name, ["pepper","poivre","pfeffer","pimienta","перец","פלפל","胡椒","pieprz"]))) {
    ensureSpiceInList(r, "Pepper", 1, "g"); // nazwa neutralna — UI ją przetłumaczy jeśli chcesz
  }
  if (mentionsSalt && !r.ingredients.some(i => hasToken(i.name, ["salt","sal","sel","salz","соль","מלח","盐","sól"]))) {
    ensureSpiceInList(r, "Salt", 1, "g");
  }

  // 3) brak jakichkolwiek przypraw → dodaj minimalny zestaw do dań wytrawnych (heurystyka: nie dodaj do smoothie/deserów)
  const looksSweet = hasToken(r.title, ["smoothie","shake","koktajl","batido","奶昔","jogurt","yogurt","dessert","deser","postre","pudding","budyń"]);
  const hasSeasoning = r.ingredients.some(i => hasToken(i.name, TOKENS.seasoning));
  if (!looksSweet && !hasSeasoning) {
    ensureSpiceInList(r, "Salt", 1, "g");
    ensureSpiceInList(r, "Pepper", 1, "g");
  }

  // 4) sól — limit: 1 g dla sałatek/deserów, 2 g dla dań ciepłych
  const isSalad = hasToken(r.title, ["salad","salade","ensalada","salat","sałat","سلطة","סלט","沙拉"]);
  const salt = r.ingredients.find(i => hasToken(i.name, ["salt","sal","sel","salz","соль","ملح","מלח","盐","sól"]));
  if (salt && typeof salt.amount === "number") {
    const max = (looksSweet || isSalad) ? 1 : 2;
    if (salt.amount > max) salt.amount = max;
  }

  // 5) smażenie bez tłuszczu → dodaj neutralnie „Olive oil 10 ml”
  const hasFat = r.ingredients.some(i => hasToken(i.name, TOKENS.fats));
  const frying = /(smaż|podsmaż|patelni|fry|sauté|poêler|sofreír|braten)/i.test(stepsText);
  if (frying && !hasFat) ensureSpiceInList(r, "Olive oil", 10, "ml");
}
    // 4.2) Porządek dni tygodnia (startWeek: 'monday' | 'sunday')
    const startWeek = (req.body?.startWeek === 'sunday') ? 'sunday' : 'monday'; // domyślnie poniedziałek
    const DAY_ORDER_PL_MON_FIRST = ["Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota","Niedziela"];
    const DAY_ORDER_PL_SUN_FIRST = ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"];
    const DAY_ORDER = startWeek === 'sunday' ? DAY_ORDER_PL_SUN_FIRST : DAY_ORDER_PL_MON_FIRST;
    const dayIndex = (d: string) => {
      const i = DAY_ORDER.findIndex(x => x.toLowerCase() === String(d || "").toLowerCase());
      return i === -1 ? 999 : i;
    };
    recipes.sort((a, b) => dayIndex(a.day) - dayIndex(b.day));

    if (!recipes.length) {
      console.error("❌ Brak pola recipes w odpowiedziach generateRecipes (wszystkie dni).");
      return res.status(500).send("Nie udało się wygenerować przepisów.");
    }

    // 5) Transformacja do słownika { day: { meal: RecipeForUI } }
    const recipesByDay: Record<string, Record<string, RecipeForUI>> = {};
    for (const r of recipes) {
      const dayKey = r.day || "Inne";
      const mealKey = r.meal || r.title || "posiłek";
      const uiRecipe: RecipeForUI = {
        dish: r.title,
        description: (r as any).description ?? undefined,
        servings: typeof (r as any).servings === "number" ? (r as any).servings : 1,
        time: r.time,
        ingredients: r.ingredients.map(i => ({
          product: i.name,
          weight: i.amount,
          unit: i.unit,
        })),
        steps: r.instructions,
      };
      if (!recipesByDay[dayKey]) recipesByDay[dayKey] = {};
      recipesByDay[dayKey][mealKey] = uiRecipe;
    }

    // 6) Zwięzłe logi
    (() => {
      const total = recipes.length;
      const sample = recipes.slice(0, 2).map(r => `${r.day}/${r.meal}:${r.title}`).join(" ; ");
      console.log(`[recipes] OK batched — days=${days.length} total=${total} sample=${sample}`);
    })();

    return res.status(200).json({ recipes: recipesByDay });
  } catch (err: any) {
    console.error("❌ Błąd generateRecipes (batched):", err?.message || err);
    return res.status(500).send("Błąd generowania przepisów.");
  }
}

