// pages/api/ask-look-agent.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import formidable from 'formidable';
import { readFile } from 'fs/promises';
import { analyzeProductInput } from '@/agents/productAgent';
import { dietModelMeta } from '@/utils/dietModelMeta';

export const config = {
  api: {
    bodyParser: false
  }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function detectQuestionType(
  question: string,
  lang: string
): Promise<'shopping' | 'shoppingGroups' | 'product' | 'other'> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Return strictly JSON: {"intent":"shopping|shoppingGroups|product|other"}. No prose.'
      },
      {
        role: 'user',
        content: JSON.stringify({ lang, question })
      }
    ]
  });

  const raw = response.choices[0]?.message?.content || '{}';
  let intent = 'other';
  try {
    const intentObj = JSON.parse(raw);
    intent = String(intentObj.intent || '').toLowerCase();
  } catch {
    intent = 'other';
  }

  // Normalizacja i whitelist
  if (intent === 'shoppinggroups') return 'shoppingGroups';
  if (intent === 'shopping' || intent === 'product') return intent as any;
  return 'other';
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const form = formidable();

  try {
    const [fields, files] = await form.parse(req);
    const question = fields.question?.[0] || '';
    const lang = fields.lang?.[0] || 'pl';

    const patient = JSON.parse(fields.patient?.[0] || '{}');
    const formData = JSON.parse(fields.form?.[0] || '{}');
    const interviewData = JSON.parse(fields.interviewData?.[0] || '{}');
    const medical = JSON.parse(fields.medical?.[0] || '{}');
    const rawDiet = JSON.parse(fields.dietPlan?.[0] || '{}');
    const dietPlan = rawDiet?.weekPlan || rawDiet;
    const basket = JSON.parse(fields.basket?.[0] || '[]');
    const chatHistory = JSON.parse(fields.chatHistory?.[0] || '[]');
    // 🌍 Geo z Vercel (dokładniejsze waluty/sklepy)
    const reqCountry = (req.headers['x-vercel-ip-country'] as string) || '';
    const reqCity = (req.headers['x-vercel-ip-city'] as string) || '';
    const reqRegion = (req.headers['x-vercel-ip-country-region'] as string) || '';

    let base64Image = '';
    const rawFile = files.image;
    if (rawFile) {
      const file = Array.isArray(rawFile) ? rawFile[0] : rawFile;
      if (file?.filepath && file?.mimetype?.startsWith('image/')) {
        const buffer = await readFile(file.filepath);
        base64Image = `data:${file.mimetype};base64,${buffer.toString('base64')}`;
        console.log('🖼️ Zdjęcie dołączone do zapytania.');
      }
    }
    
    const questionType = await detectQuestionType(question, lang);
    const firstName = patient?.name?.split?.(' ')[0] || 'Pacjencie';

    if ((questionType === 'product' || (base64Image && questionType !== 'shopping' && questionType !== 'shoppingGroups'))) {
      const result = await analyzeProductInput({
        barcode: 'N/A',
        productName: '[From user question]',
        ingredients: '[Unknown]',
        nutrition: {},
        patient,
        lang,
        question,
        image: base64Image,
        dietPlan
      });
      return res.status(200).json(result);
    }

    if (
      questionType === 'shopping' &&
      (!dietPlan || Object.values(dietPlan).every((d) => !Array.isArray(d) || d.length === 0))
    ) {
      return res.status(200).json({
        mode: 'response',
        answer: 'Nie mogę przygotować listy zakupów, ponieważ Twój plan diety jest pusty lub nie zawiera posiłków. Wygeneruj dietę, aby kontynuować.',
        summary: 'Brak danych do stworzenia listy.',
        suggestion: 'Wróć do sekcji „Dieta” i kliknij „Generuj dietę”.',
        sources: ['diet'],
        audio: null
      });
    }
function getTargetDay(question: string): string {
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const polishDays = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
  const lower = question.toLowerCase();

  // Jutro
  if (lower.includes('jutro') || lower.includes('tomorrow')) {
    return days[(today.getDay() + 1) % 7];
  }

  // Dzisiaj
  if (lower.includes('dzisiaj') || lower.includes('today')) {
    return days[today.getDay()];
  }

  // Weekend
  if (lower.includes('weekend') || lower.includes('na weekend')) {
    return today.getDay() === 6 ? 'Sunday' : 'Saturday'; // jeśli dziś sobota, to niedziela; inaczej sobota
  }

  // Konkretne dni po polsku
  for (let i = 0; i < polishDays.length; i++) {
    if (lower.includes(polishDays[i])) return days[i];
  }

  // Konkretne dni po angielsku
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i].toLowerCase())) return days[i];
  }

  return 'Saturday'; // fallback
}

const targetDay = getTargetDay(question); // <- dynamicznie ustalamy dzień

function resolveCurrency(region?: string, countryHeader?: string): string {
  const r = (region || countryHeader || '').toLowerCase();
  if (r.includes('pol') || r.includes('pl')) return 'PLN';
  if (r.includes('ger') || r.includes('de')) return 'EUR';
  if (r.includes('fr')) return 'EUR';
  if (r.includes('usa') || r === 'us' || r === 'usa' || r.includes('united states')) return 'USD';
  if (r.includes('india') || r.includes('in')) return 'INR';
  if (r.includes('ukr') || r.includes('ua')) return 'UAH';
  if (r.includes('isr') || r.includes('il')) return 'ILS';
  if (r.includes('china') || r.includes('cn')) return 'CNY';
  return 'USD';
}
const resolvedCurrency = resolveCurrency(patient?.region, reqCountry);

const prompt = `
You are Look — a friendly personal assistant inside the Diet Care Platform (DCP).
You have access to everything the patient has provided: health conditions, medical results, interview, goals, diet plan, basket, and uploaded images.

The user's question is: "${question}"

Always respond in: ${lang}.
Address the patient by their name ("${firstName}") naturally in the reply.

NEVER suggest external apps, services or tools — you are part of DCP and must only use DCP features.

If the user asks about a specific product — return mode: "product".
If the user asks about shopping or what to buy — return mode: "shopping".
If the user explicitly asks to group products by shop (e.g. "group by shop", "separate by store", "which shop sells what"), then return a grouped list using the "shoppingGroups" format instead of a flat list.
If the question is general or instructional — return mode: "response".
🍽️ If the user asks whether they can eat or drink something — like sausage, cake, alcohol, dairy — always analyze it based on their health, diet model, and goals.
This falls under mode: "response".
🍽️ If the user asks about a specific food, like "Can I eat this?" or "Is milk 3.2% allowed?", return mode: "product".
🛍️ If the user asks what to buy, return mode: "shopping".
🛍️ If the user asks to group items by store, return mode: "shoppingGroups".

💡 Never confuse product questions (nutritional analysis) with shopping list requests (what to buy).
Always return the correct mode based on user intent.


If mode is "shopping", always set:  
"answer": "Your shopping list is below 👇"

Reply in a balanced, practical tone. You may explain:
- if it's acceptable occasionally,
- what risks it poses based on patient data,
- or suggest better timing or alternatives.

Never be judgmental. The goal is to support the patient in real-world choices.
When mode is "shopping", you MUST include "shoppingList" (flat array). You MAY also include "shoppingGroups", but "shoppingList" is required.

Example:
{
  "mode": "response",
  "answer": "Eating cake and drinking whisky occasionally is acceptable, but keep in mind your current diet and health goals. For patients with liver strain or metabolic issues, moderation is strongly advised.",
  "summary": "Occasional treat allowed with caution.",
  "audio": "(optional)"
}

🛎️ You MUST return the value of "day" exactly as provided: "${targetDay}". Do not replace it, guess it, or infer it from the question again.

Shopping list mode example:
{
  "mode": "shopping",
  "day": "${targetDay}",
  "shoppingGroups": [
    {
      "shop": "Lidl",
      "items": [
        { "product": "Quinoa", "quantity": "80", "unit": "g" }
      ]
    },
    {
      "shop": "Biedronka",
      "items": [
        { "product": "Tofu", "quantity": "100", "unit": "g" }
      ]
    }
  ],
  "totalEstimatedCost": {
  "local": "34.50 [LOCAL_CURRENCY]",
  "online": "39.80 [LOCAL_CURRENCY]"
},
"summary": "Your shopping list grouped by store with optimized prices.",
"audio": "(optional text-to-speech URL)"
}

🧠 Based on the patient's region or location, always determine the correct local currency.
Examples:
- Poland → PLN
- USA → USD
- Germany → EUR
- India → INR
- Ukraine → UAH
- Israel → ILS
- China → CNY

If you're unsure, default to USD.
Patient region: ${patient?.region || '[unknown]'}
Location: ${patient?.location || '[not specified]'}
Currency (resolved server-side): ${resolvedCurrency}

You must respond in structured JSON only. Do NOT use markdown, HTML, or prose. The UI will render everything.
Image: ${base64Image ? '[attached]' : '[none]'}

Patient:
- name: ${patient?.name}
- age: ${patient?.age}
- sex: ${patient?.sex}
- region: ${patient?.region}
- conditions: ${patient?.conditions?.join(', ') || 'none'}
- summary: ${patient?.health_status || '[none]'}

Interview: ${JSON.stringify(interviewData)}
Form: ${JSON.stringify(formData)}
Model metadata: ${JSON.stringify(dietModelMeta[formData?.model || ''] || {})}
Medical: ${JSON.stringify(medical)}
Diet plan: ${JSON.stringify(dietPlan)}
Basket: ${JSON.stringify(basket)}

If appropriate, include shop suggestions (e.g. Lidl, Biedronka, Carrefour) and explain your logic using patient region or ingredient type.
`;

 const messages: any[] = [
  {
    role: 'system',
    content: `
You are Look — a helpful, warm, and knowledgeable assistant within the Diet Care Platform (DCP).
Your job is to assist the patient using the data inside DCP: diet, health, goals, basket, and interview.

Always greet the patient by name: "${firstName || 'Patient'}" — naturally and politely.

🛡️ NEVER recommend external apps, websites, or tools.
✅ ALWAYS use DCP’s internal features:
- diet plan
- medical data
- basket
- ingredient suggestions
- product analysis
- shopping list generator

🛍️ If the user asks about what to buy, generate a full shopping list using mode: "shopping", including prices and shops.
If they ask to group products by store — return a structured response using "shoppingGroups", one group per shop.
🧺 If the user asks about a product, use mode: "product" and provide shop, price, better alternative, and explanation.
💬 If the question is general, reply with mode: "response".

You MUST return all answers in JSON structure, matching the UI modes:
- mode: "shopping" → ShoppingListCard
- mode: "product" → ProductAnswerCard
- mode: "response" → general answer

If a photo is provided, try to identify the food or product based on visual clues. If unsure, say so — but still try.

NEVER say "I don’t know", "not available", or redirect user to other apps. You MUST always try to help using DCP.

You know typical stores per region:
- 🇵🇱 Poland: Lidl, Biedronka, Auchan, Carrefour
- 🇺🇸 USA: Walmart, Whole Foods, Kroger
- 🇫🇷 France: Carrefour, Monoprix
- 🇩🇪 Germany: Aldi, Rewe, Lidl
- 🇮🇳 India: Big Bazaar, Reliance

You may mention store names and explain recommendations. Use common sense, heuristics, and product names.

Always respond in language: ${lang || 'en'}.
Answer briefly, clearly, and professionally — like a trusted digital dietitian.
`

      },
      ...chatHistory
    ];

    messages.push(
      base64Image
        ? {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        : { role: 'user', content: prompt }
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;

    if (!content || !content.includes('{')) {
      return res.status(200).json({
        mode: 'response',
        answer: content || 'Nie udało się uzyskać odpowiedzi.',
        summary: 'Odpowiedź była niekompletna.',
        suggestion: 'Spróbuj ponownie lub zadaj pytanie inaczej.',
        sources: ['openai-fallback'],
        audio: null
      });
    }

    try {
    const cleaned = content.replace(/```[\s\S]*?json|```/gi, '').trim();

      const parsed = JSON.parse(cleaned);
      function buildShoppingListFromDietPlan(dietPlan: any, day: string) {
  if (!dietPlan) return [];

  // obsłuż oba formaty: { Monday: [...] } lub { weekPlan: { Monday: [...] } } – ale masz już weekPlan wyciągnięty wyżej
  const dayMeals = dietPlan[day] || dietPlan[day.toLowerCase()] || [];

  const items: Array<{ product: string; quantity: string; unit: string }> = [];

  for (const meal of Array.isArray(dayMeals) ? dayMeals : []) {
    // 1) Nowa/normatywna struktura: meal.ingredients: [{ name, quantity, unit }] lub [{ product, qty, unit }]
    if (Array.isArray(meal?.ingredients)) {
      for (const ing of meal.ingredients) {
        const name = ing?.name ?? ing?.product ?? ing?.title ?? '';
        const qty = ing?.quantity ?? ing?.qty ?? ing?.amount ?? '';
        const unit = ing?.unit ?? ing?.uom ?? '';
        if (name) items.push({ product: String(name), quantity: String(qty ?? ''), unit: String(unit ?? '') });
      }
    }
    // 2) Starsza/luźna struktura: meal składniki jako stringi
    if (Array.isArray(meal?.items)) {
      for (const s of meal.items) {
        if (typeof s === 'string') items.push({ product: s, quantity: '', unit: '' });
      }
    }
  }

  // Proste deduplikowanie po nazwie (zachowaj pierwszą ilość)
  const seen = new Map<string, { product: string; quantity: string; unit: string }>();
  for (const it of items) {
    const key = it.product.trim().toLowerCase();
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, it);
  }
  return Array.from(seen.values());
}

      // 🧹 Normalizacja pod UI (ShoppingListCard używa shoppingList)
if (parsed?.mode === 'shopping') {
  // 1) Jeśli mamy grupy – spłaszcz do shoppingList, ale NIE usuwaj shoppingGroups (UI może użyć obu)
  if (!parsed.shoppingList && Array.isArray(parsed.shoppingGroups)) {
    parsed.shoppingList = parsed.shoppingGroups.flatMap((group: any) =>
      (group?.items || []).map((it: any) => ({
        product: it?.product ?? it?.name ?? '',
        quantity: String(it?.quantity ?? it?.qty ?? ''),
        unit: it?.unit ?? '',
        localPrice: it?.localPrice ?? '',
        onlinePrice: it?.onlinePrice ?? '',
        shopSuggestion: group?.shop ?? it?.shop ?? ''
      }))
    );
    // ⛔ NIE usuwamy parsed.shoppingGroups
  }

  // 2) Serwerowy fallback: jeśli nadal brak listy, zbuduj z planu diety dla targetDay
  if (!Array.isArray(parsed.shoppingList) || parsed.shoppingList.length === 0) {
    const fallbackList = buildShoppingListFromDietPlan(dietPlan, targetDay);
    parsed.shoppingList = fallbackList;
  }

  // 3) Uzupełnij wymagane pola
  if (!parsed.day) parsed.day = targetDay;
  if (!parsed.totalEstimatedCost) {
    parsed.totalEstimatedCost = { local: '', online: '' };
  }

  // 4) Jeśli po wszystkich krokach lista jest dalej pusta – zmień tryb na response z komunikatem
  if (!Array.isArray(parsed.shoppingList) || parsed.shoppingList.length === 0) {
    parsed.mode = 'response';
    parsed.answer =
      'Nie mogę przygotować listy zakupów, bo w planie diety nie znaleziono składników na wybrany dzień. Wygeneruj dietę albo zapytaj o inny dzień.';
    parsed.summary = 'Brak składników w planie diety dla tego dnia.';
  }
}

// Dla "product" i "response" dopilnuj, by "answer" istniało
if (!parsed.answer) {
  parsed.answer =
    parsed.summary ||
    (parsed.mode === 'product'
      ? 'Analysis of the product is below.'
      : 'Odpowiedź poniżej.');
}


      const ttsRes = await openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: 'alloy',
        input: String(parsed.answer || 'Brak odpowiedzi.')
      });

      const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
      const audioBase64 = audioBuffer.toString('base64');

      return res.status(200).json({
        ...parsed,
        audio: `data:audio/mpeg;base64,${audioBase64}`
      });
    } catch (err) {
      return res.status(400).json({ error: 'Failed to parse GPT JSON or generate audio', raw: content });
    }
  } catch (err) {
    console.error('❌ Look agent error:', err);
    return res.status(500).json({ error: 'Server error in Look agent' });
  }
}
