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
  image: z.string().optional().nullable()
});

// ✅ główna funkcja eksportowana do API
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
    image
  } = result.data;

  const prompt = `
You are a clinical dietitian AI.

Evaluate the following product for the patient below.

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

Return strictly valid JSON:
{
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
}`;

  console.log('🧠 GPT prompt:', prompt);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful clinical nutrition AI.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5
    });

    const content = completion.choices[0]?.message?.content;
    console.log('📩 GPT agent output (raw):', content);

    if (!content || !content.includes('{')) {
      console.error('❌ GPT returned empty or non-JSON content');
      return { error: 'Empty or invalid GPT response' };
    }

    try {
      const jsonStart = content.indexOf('{');
      const parsed = JSON.parse(content.slice(jsonStart));
      return parsed;
    } catch (e) {
      console.error('❌ GPT JSON parse error:', e, content);
      return { error: 'Failed to parse AI response' };
    }
  } catch (err) {
    console.error('❌ GPT completion error:', err);
    return { error: 'Failed to analyze product' };
  }
}

// 🔧 nadal opcjonalnie dostępny agent (np. do .run() lub tool definition)
export const productAgent = new Agent({
  name: 'Product Analysis Agent',
  instructions:
    'Analyzes food products using barcode, ingredients, nutrition and patient data to determine compatibility.',
  tools: []
});
