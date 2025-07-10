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
    conditions: z.array(z.string()).optional(),
    allergies: z.string().optional(),
    dietModel: z.string().optional()
  }).passthrough(),
  lang: z.string()
});

export const analyzeProductTool = tool({
  name: 'analyze_product_for_patient',
  description: 'Analyzes a food product for dietary compatibility based on patient data',
  parameters: AnalyzeProductSchema as any,
  async execute(input: any) {
    const result = AnalyzeProductSchema.safeParse(input);
    if (!result.success) {
      throw new Error('Invalid input for product analysis agent');
    }
    const { barcode, productName, ingredients, nutrition, patient, lang } = result.data;

    const prompt = `
You are a clinical dietitian AI.

Evaluate the following product:
- Name: ${productName}
- Barcode: ${barcode}
- Ingredients: ${ingredients}
- Nutrition: ${JSON.stringify(nutrition)}

Patient:
- Conditions: ${patient.conditions?.join(', ') || 'none'}
- Allergies: ${patient.allergies || 'none'}
- Diet model: ${patient.dietModel || 'unspecified'}

Based on the patient's dietary needs and restrictions:
1. Is this product suitable?
2. Provide a short AI comment explaining why or why not.
3. Suggest up to 3 alternative products (mock): name, shop, price, reason.

Return strictly JSON like:
{
  "productName": "...",
  "ingredients": "...",
  "verdict": "...",
  "pricing": [...],
  "alternatives": [...]
}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful clinical nutrition AI.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        stream: false
      });

      const content = completion.choices[0].message?.content || '{}';
      const jsonStart = content.indexOf('{');
      return JSON.parse(content.slice(jsonStart));
    } catch (err) {
      console.error('❌ GPT parsing error:', err);
      return { error: 'Failed to analyze product' };
    }
  }
});

export const productAgent = new Agent({
  name: 'Product Analysis Agent',
  instructions: 'Analyzes food products using barcode, ingredients, nutrition and patient data to determine compatibility.',
  tools: [analyzeProductTool]
});




