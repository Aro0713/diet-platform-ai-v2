import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const patientData = req.body;
    console.log("Dane pacjenta:", patientData);
    // W przyszłości: zapis do bazy danych lub przetwarzanie
    res.status(200).json({ message: "Dane pacjenta zapisane." });
  } else {
    res.status(405).json({ message: "Metoda niedozwolona." });
  }
}
