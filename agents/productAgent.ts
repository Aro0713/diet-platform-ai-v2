import { Agent, tool } from '@openai/agents';
import OpenAI from 'openai';
import { z } from 'zod';

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
  dietPlan: z.any().optional() // 👈 dodajemy dietę jako opcjonalne wejście
});

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

  // 🔍 Czy to pytanie o zakupy?
  const isShoppingQuery =
    question?.toLowerCase().includes('zakup') ||
    question?.toLowerCase().includes('koszt') ||
    question?.toLowerCase().includes('lista') ||
    question?.toLowerCase().includes('dzień');

  const prompt = `
You are a clinical dietitian assistant AI.
Please respond fully in language: ${lang}. Never use English.

${
  isShoppingQuery
    ? `The user is asking about shopping based on their diet plan. 
Generate a shopping list for one selected day (e.g. "Saturday") from the given dietPlan. 
Group ingredients, estimate total cost in local stores (based on approximate market prices), and provide an online alternative if possible.

Use this format in your JSON reply (no markdown):

{
  "mode": "shopping",
  "day": "Saturday",
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
}
`
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
      console.error('❌ GPT returned empty or non-JSON content');
      return { error: 'Empty or invalid GPT response' };
    }

    try {
      const cleaned = content
        .replace(/^```json\n?/, '')
        .replace(/^```/, '')
        .replace(/\n?```$/, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (e) {
      console.error('❌ GPT JSON parse error:', e, content);
      return { error: 'Failed to parse AI response' };
    }
  } catch (err) {
    console.error('❌ GPT completion error:', err);
    return { error: 'Failed to analyze product or shopping query' };
  }
}

// 🔧 Agent eksportowany (opcjonalnie .run() lub tool)
export const productAgent = new Agent({
  name: 'Product Analysis Agent',
  instructions:
    'Analyzes products and answers patient questions about foods, shopping, ingredients and personalized lists.',
  tools: []
});
