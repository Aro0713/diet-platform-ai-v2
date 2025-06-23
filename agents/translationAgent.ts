import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const translatorAgent = {
  run: async ({ text }: { text: string }): Promise<Record<string, string>> => {
    const prompt = `
Translate the following text into 11 languages and return valid JSON ONLY (no markdown, no explanations):

{
  "pl": "...",
  "en": "...",
  "es": "...",
  "fr": "...",
  "de": "...",
  "ua": "...",
  "ru": "...",
  "zh": "...",
  "hi": "...",
  "ar": "...",
  "he": "..."
}

TEXT:
"${text}"
`;

    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a multilingual translator for a clinical nutrition app.'
        },
        { role: 'user', content: prompt }
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
