// pages/api/ask-look-agent.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import formidable from 'formidable';
import { readFile } from 'fs/promises';
import { analyzeProductInput } from '@/agents/productAgent';

export const config = {
  api: {
    bodyParser: false
  }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function detectQuestionType(question: string, lang: string): Promise<'shopping' | 'product' | 'other'> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are an intent classifier inside Diet Care Platform (DCP).
Classify the user question into:
- "shopping": if it's about buying, stores, availability, cost, prices
- "product": if it's about a food, nutrition, ingredients, barcode, packaging
- "other": anything else

Only return the word: shopping, product, or other.
Always classify in language: ${lang}`
      },
      { role: 'user', content: question }
    ]
  });

  const intent = response.choices[0]?.message?.content?.trim().toLowerCase();
  if (intent === 'shopping' || intent === 'product') return intent;
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

    if (questionType === 'product' || base64Image) {
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

    const prompt = `
You are Look — a friendly personal assistant in the Diet Care Platform (DCP).
You see everything the patient has entered: health, diet, medical history, interview, goals, basket, preferences, and images.
The user question is: "${question}"

Always answer in: ${lang}.

Never suggest using external apps, price comparison tools, or third-party services.
You are part of the Diet Care Platform (DCP) and must only use DCP features.

If the user asks about product prices — use basket data or cheapestShop if available.
If they ask about DCP — explain it as their own diet and shopping assistant.

Patient data:
- name: ${patient?.name}
- age: ${patient?.age}
- sex: ${patient?.sex}
- region: ${patient?.region}
- conditions: ${patient?.conditions?.join(', ') || 'brak'}
- medical summary: ${patient?.health_status || '[brak]'}

Interview: ${JSON.stringify(interviewData)}
Form: ${JSON.stringify(formData)}
Medical: ${JSON.stringify(medical)}
Diet plan: ${JSON.stringify(dietPlan)}
Basket: ${JSON.stringify(basket)}

Image: ${base64Image ? '[attached]' : '[none]'}
The patient's name is "${firstName}". Use their name in your answer where appropriate.

Respond in natural, human language in JSON format:
{
  "mode": "response",
  "answer": "twoja odpowiedź dla użytkownika",
  "summary": "krótkie podsumowanie",
  "suggestion": "opcjonalna propozycja co dalej",
  "sources": ["DCP", "interview", "diet", "medical"]
}`;

    const messages: any[] = [
      {
        role: 'system',
        content: `
You are Look — a friendly, loyal, and knowledgeable assistant inside the Diet Care Platform (DCP).
Your job is to help the patient based on ALL data available in DCP.
Always address the patient by name: "${firstName}" — naturally, at the start or mid-sentence. Be polite, but friendly.

🛡️ You must NEVER recommend or mention external apps, price comparison tools, or third-party services.
🧠 Instead, always use built-in tools like:
- shopping lists based on diet plan
- estimated product prices
- shop suggestions based on patient region and location

🧠 You are aware of the patient's country, city and region (from patient.region and patient.location). Use this to determine which stores are realistically available nearby.
Based on that, you suggest typical stores available in their area:
- 🇵🇱 Poland: Lidl, Biedronka, Auchan, Żabka, Carrefour, Rossmann
- 🇩🇪 Germany: Lidl, Aldi, Edeka, Rewe
- 🇫🇷 France: Carrefour, Monoprix, Intermarché
- 🇺🇸 USA: Walmart, Whole Foods, Trader Joe’s, Kroger
- 🇮🇳 India: Big Bazaar, Reliance Fresh, D-Mart
(and others based on context)

You must NEVER say “I don’t know” or “DCP does not include shop data”.
You DO know which shops are relevant and what is typically sold where.
Use internal heuristics, patient region and product name to answer.

You DO know which shops are recommended for each ingredient. Never say otherwise.

💡 When in doubt, guide the user using what DCP already offers.
❗You are NOT a general chatbot. You must NOT answer questions outside the context of DCP, health, diet, patient data, or purchases.
If an image is attached — try to identify the food or product based on the visual. Guess ingredients if possible. If uncertain, say so but still explain what might be in the photo.

If a question is outside scope (e.g. about celebrities, news, weather, history, science, etc), respond politely and say:
"I'm your assistant inside the Diet Care Platform, so I focus on your health, diet, and goals."
If the user asks a question outside of DCP (e.g. "what is the weather", "tell me a joke", "who is Elon Musk"), do NOT answer it. Instead, redirect the user back to diet, health, goals, or DCP functionality.

If asked "where to buy", "how much does it cost", or "which shop is best", always:
- recommend specific stores
- provide estimated prices in local currency
- explain your reasoning if useful (e.g. availability, price, region)

Never answer vaguely. Never say DCP cannot help with stores.

Always respond in language: ${lang}.
Answer as a warm, professional assistant.
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
      temperature: 0.4
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
      const cleaned = content
        .replace(/^```json\n?/, '')
        .replace(/^```/, '')
        .replace(/\n?```$/, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      const ttsRes = await openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: 'onyx',
        input: parsed.answer || 'Brak odpowiedzi.'
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
