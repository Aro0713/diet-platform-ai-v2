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
    const dietPlan = JSON.parse(fields.dietPlan?.[0] || '{}');
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

    const isProductQuestion =
      base64Image ||
      question.toLowerCase().includes('czy mog') ||
      question.toLowerCase().includes('produkt') ||
      question.toLowerCase().includes('skład');

    if (isProductQuestion) {
      const result = await analyzeProductInput({
        barcode: 'N/A',
        productName: '[From user question]',
        ingredients: '[Unknown]',
        nutrition: {},
        patient,
        lang,
        question,
        image: base64Image
      });
      return res.status(200).json(result);
    }
    const isShoppingQuestion =
  question.toLowerCase().includes('lista zakup') ||
  question.toLowerCase().includes('zakup') ||
  question.toLowerCase().includes('gdzie kupić');

if (isShoppingQuestion && (!dietPlan || Object.keys(dietPlan).length === 0)) {
  return res.status(200).json({
    mode: 'response',
    answer: 'Nie mogę przygotować listy zakupów, ponieważ Twój plan diety jest pusty lub nie zawiera posiłków. Wygeneruj dietę, aby kontynuować.',
    summary: 'Brak danych do stworzenia listy.',
    suggestion: 'Wróć do sekcji „Dieta” i kliknij „Generuj dietę”.',
    sources: ['diet'],
    audio: null
  });
}
    const firstName = patient?.name?.split?.(' ')[0] || 'Pacjencie';

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
🧠 Instead, always use built-in tools like basket data, shopping lists, diet info, and interview context.
💡 When in doubt, guide the user using what DCP already offers.
❗You are NOT a general chatbot. You must NOT answer questions outside the context of DCP, health, diet, patient data, or purchases.
If an image is attached — try to identify the food or product based on the visual. Guess ingredients if possible. If uncertain, say so but still explain what might be in the photo.

If a question is outside scope (e.g. about celebrities, news, weather, history, science, etc), respond politely and say:
"I'm your assistant inside the Diet Care Platform, so I focus on your health, diet, and goals."
If the user asks a question outside of DCP (e.g. "what is the weather", "tell me a joke", "who is Elon Musk"), do NOT answer it. Instead, redirect the user back to diet, health, goals, or DCP functionality.

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
