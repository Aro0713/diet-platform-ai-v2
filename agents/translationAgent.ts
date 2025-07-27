import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const translatorAgent = {
  run: async ({ text }: { text: string }): Promise<Record<string, string>> => {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `
You are a multilingual translator for a clinical nutrition platform.

Your job is to translate only meaningful and displayable labels or food names, and skip or generalize placeholders or technical keys.

💡 Rules:
- If the input is a real label (e.g. "Breakfast", "Calories", "Lunch") → translate it into all 11 languages.
- If the input is a placeholder, variable, or non-sensical (e.g. "name", "nazwa", "0", "undefined", "null") → replace it with "Dish" / "Danie" in each language.
- Output must be valid JSON only with no markdown or explanation.
        `.trim()
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.2
    });

    const raw = result.choices[0].message.content ?? '';
    console.log('📦 RAW TRANSLATION TEXT:', raw);

    try {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}') + 1;
      const cleaned = raw.slice(start, end);
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('❌ Failed to parse GPT response:', raw);
      throw new Error('Nie można sparsować odpowiedzi AI – brak nawiasów.');
    }
  }
};
