import { Agent, tool } from '@openai/agents';
import OpenAI from 'openai';
import { z } from 'zod';
import { dietModelMeta } from '@/utils/dietModelMeta';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AnalyzeProductSchema = z.object({
  barcode: z.string(),
  productName: z.string(),
  ingredients: z.string(),
  nutrition: z.record(z.any()),
  patient: z.object({
    conditions: z.array(z.string()).optional().nullable(),
    allergies: z.string().optional().nullable(),
    dietModel: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    location: z.string().optional().nullable()
  }).passthrough(),
  lang: z.string(),
  question: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  dietPlan: z.any().optional()
});

function getNextDayName(): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return days[tomorrow.getDay() === 0 ? 6 : tomorrow.getDay() - 1];
}

function detectDayFromQuestion(q: string): string | null {
  const map: Record<string, string> = {
    'poniedziałek': 'Monday',
    'wtorek': 'Tuesday',
    'środę': 'Wednesday',
    'czwartek': 'Thursday',
    'piątek': 'Friday',
    'sobotę': 'Saturday',
    'niedzielę': 'Sunday',
    'jutro': getNextDayName()
  };
  const found = Object.entries(map).find(([key]) => q.toLowerCase().includes(key));
  return found?.[1] || null;
}

export async function analyzeProductInput(input: any) {
  const result = AnalyzeProductSchema.safeParse(input);
  if (!result.success) {
    throw new Error('Invalid input for product analysis agent');
  }

  const {
    barcode,
    productName,
    ingredients,
    nutrition,
    patient,
    lang,
    question,
    image,
    dietPlan
  } = result.data;

  const isShoppingQuery =
    question?.toLowerCase().includes('zakup') ||
    question?.toLowerCase().includes('koszt') ||
    question?.toLowerCase().includes('lista') ||
    question?.toLowerCase().includes('dzień');

  const inferredDay = detectDayFromQuestion(question || '') || 'Saturday';

  const modelMeta = dietModelMeta[patient?.dietModel || ''] || {};

  const forbidden = modelMeta.forbiddenIngredients?.length
    ? `⚠️ Forbidden ingredients in this diet: ${modelMeta.forbiddenIngredients.join(', ')}`
    : 'No specific ingredient restrictions found.';

  const prompt = `
You are a clinical dietitian assistant AI.
Please respond fully in language: ${lang}. Never use English.

${
    isShoppingQuery
      ? `The user is asking about shopping based on their diet plan. 
Generate a shopping list for one selected day: "${inferredDay}" from the given dietPlan.
Group ingredients, estimate total cost in local stores (based on approximate market prices), and provide an online alternative if possible.

Use this format in your JSON reply (no markdown):

{
  "mode": "shopping",
  "day": "${inferredDay}",
  "shoppingList": [
    {
      "product": "...",
      "quantity": "...",
      "unit": "...",
      "localPrice": "...",
      "onlinePrice": "...",
      "shopSuggestion": "..."
    }
  ],
  "totalEstimatedCost": {
    "local": "...",
    "online": "..."
  },
  "summary": "..."
}`
      : `Evaluate the following product for the patient below.

Product:
- Name: ${productName}
- Barcode: ${barcode}
- Ingredients: ${ingredients}
- Nutrition: ${JSON.stringify(nutrition)}
- Question: ${question || '[no question provided]'}
- Image: ${image ? '[attached]' : '[none]'}

Patient:
- Conditions: ${patient.conditions?.join(', ') || 'none'}
- Allergies: ${patient.allergies || 'none'}
- Diet model: ${patient.dietModel || 'unspecified'}
- Region: ${patient.region || 'Poland'}
- Location: ${patient.location || 'unknown'}

${forbidden}

If an image is attached — do your best to visually identify the product, even without label.
Describe what you see and guess the product type if needed. Don't refuse to assist.

Return strictly valid JSON in ${lang} (no markdown):
{
  "mode": "product",
  "productName": "...",
  "dietaryAnalysis": "...",
  "allowPurchase": true,
  "reasons": ["..."],
  "cheapestShop": {
    "name": "...",
    "price": "..."
  },
  "betterAlternative": {
    "name": "...",
    "shop": "...",
    "price": "...",
    "whyBetter": "..."
  }
}`
  }`;

  console.log('🧠 GPT prompt:', prompt);

  try {
    const messages: any[] = [
      { role: 'system', content: 'You are a helpful clinical nutrition AI.' }
    ];

    if (image && !isShoppingQuery) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: image } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.4
    });

    const content = completion.choices[0]?.message?.content;
    console.log('📩 GPT agent output (raw):', content);

    if (!content || !content.includes('{')) {
      return {
        mode: 'response',
        answer: 'Nie udało się rozpoznać produktu lub przygotować listy. Czy możesz przesłać więcej informacji lub zadać pytanie inaczej?',
        summary: 'Brak danych lub struktury JSON.',
        suggestion: 'Spróbuj przesłać nazwę lub inny opis.',
        sources: ['fallback'],
        audio: null
      };
    }

    try {
      const cleaned = content
        .replace(/^```json\n?/, '')
        .replace(/^```/, '')
        .replace(/\n?```$/, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      return {
        answer: parsed.dietaryAnalysis || 'Oto analiza produktu.',
        ...parsed
      };

    } catch (e) {
      console.error('❌ GPT JSON parse error:', e, content);
      return { error: 'Failed to parse AI response' };
    }
  } catch (err) {
    console.error('❌ GPT completion error:', err);
    return { error: 'Failed to analyze product or shopping query' };
  }
}

function extractShoppingListFromDiet(dietPlan: any, day: string, patient: any) {
  const meals = dietPlan[day] || [];
  const list: any[] = [];

  meals.forEach((meal: any) => {
    meal.ingredients?.forEach((ingredient: any) => {
      list.push({
        product: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        localPrice: estimatePrice(ingredient.name),
        onlinePrice: estimateOnlinePrice(ingredient.name),
        shopSuggestion: suggestShop(ingredient.name, patient.region, patient.location)
      });
    });
  });

  return list;
}

function estimatePrice(name: string) {
  return name.toLowerCase().includes('bio') ? '7.00 zł' : '3.50 zł';
}

function estimateOnlinePrice(name: string) {
  return name.toLowerCase().includes('bio') ? '6.80 zł' : '3.30 zł';
}

function suggestShop(name: string, region = '', location = '') {
  const country = (region || '').toLowerCase();
  const product = name.toLowerCase();

  if (country.includes('pol')) {
    if (product.includes('tofu') || product.includes('soja')) return 'Lidl';
    if (product.includes('olej') || product.includes('bio')) return 'Auchan';
    if (product.includes('pieczywo') || product.includes('chleb')) return 'Carrefour';
    if (product.includes('nabiał') || product.includes('jogurt') || product.includes('mleko')) return 'Biedronka';
    return ['Lidl', 'Biedronka', 'Carrefour'][Math.floor(Math.random() * 3)];
  }

  if (country.includes('usa')) {
    if (product.includes('organic') || product.includes('tofu')) return 'Whole Foods';
    if (product.includes('meat') || product.includes('eggs')) return 'Walmart';
    return 'Kroger';
  }

  if (country.includes('germany')) return 'Rewe';
  if (country.includes('france')) return 'Carrefour';
  if (country.includes('india')) return 'Big Bazaar';
  if (country.includes('ukraine')) return 'Silpo';

  return 'Local Market';
}

function calculateTotalCost(list: any[]) {
  const local = list.reduce((sum, item) => sum + parseFloat(item.localPrice || '0'), 0);
  const online = list.reduce((sum, item) => sum + parseFloat(item.onlinePrice || '0'), 0);

  return {
    local: `${local.toFixed(2)} zł`,
    online: `${online.toFixed(2)} zł`
  };
}

export const productAgent = new Agent({
  name: 'Product Analysis Agent',
  instructions:
    'Analyzes products and answers patient questions about foods, shopping, ingredients and personalized lists.',
  tools: []
});
