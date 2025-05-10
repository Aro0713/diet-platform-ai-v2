import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const interviewData = req.body;

    console.log("Odebrane dane wywiadu:", interviewData);

    // Tutaj w przyszłości: scalanie danych i wysyłka do AI

    res.status(200).json({ message: "Wywiad zapisany pomyślnie" });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Metoda ${req.method} nie jest obsługiwana`);
  }
}
