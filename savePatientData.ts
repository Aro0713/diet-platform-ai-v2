// /pages/api/savePatientData.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: `Metoda ${req.method} nie jest obsługiwana.` });
  }

  const { basicData, medicalData, interviewData } = req.body;

  if (!basicData || !medicalData || !interviewData) {
    return res.status(400).json({ message: "Brakuje danych podstawowych, medycznych lub wywiadu." });
  }

  try {
    // Automatyczne przygotowanie promptu
    const prompt = `
Jesteś specjalistą dietetyki klinicznej.

Na podstawie poniższych danych pacjenta wygeneruj:
- Analizę sytuacji zdrowotnej,
- Indywidualne zalecenia żywieniowe,
- Ewentualne ostrzeżenia dietetyczne.

Dane podstawowe:
${JSON.stringify(basicData, null, 2)}

Dane medyczne:
${JSON.stringify(medicalData, null, 2)}

Wywiad dietetyczny:
${JSON.stringify(interviewData, null, 2)}
`;

    // Wysyłka danych do OpenAI GPT-4
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Jesteś doświadczonym dietetykiem klinicznym. Twórz dokładne i praktyczne zalecenia."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    const data = await openaiResponse.json();

    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ message: "Błąd po stronie OpenAI API.", error: data.error });
    }

    const analysis = data.choices?.[0]?.message?.content;

    return res.status(200).json({ analysis: analysis || "Brak odpowiedzi od AI." });
  } catch (error) {
    console.error("Błąd podczas komunikacji z OpenAI:", error);
    return res.status(500).json({ message: "Błąd serwera podczas komunikacji z OpenAI." });
  }
}
