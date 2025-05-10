import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona. Dozwolone tylko POST.' });
  }

  const { form, interviewData, lang } = req.body;

  if (!form || !interviewData) {
    return res.status(400).json({ message: 'Brakuje danych formularza lub wywiadu.' });
  }

  // Uproszczona walidacja kluczowych danych
  const requiredFields = ['age', 'sex', 'weight', 'height'];
  const missingFields = requiredFields.filter((field) => !form[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Brakuje wymaganych danych pacjenta.',
      missing: missingFields,
    });
  }

  // Tworzymy rekord do zapisu
  const interviewRecord = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    language: lang || 'pl',
    patient: {
      age: form.age,
      sex: form.sex,
      weight: form.weight,
      height: form.height,
      allergies: form.allergies || '',
      region: form.region || '',
      conditions: form.conditions || [],
      medical: form.medical || [],
    },
    interview: {
      ...interviewData
    }
  };

  // Tymczasowy zapis do loga (w przyszłości: zapis do bazy)
  console.log('📥 Zapisano pełny wywiad:', JSON.stringify(interviewRecord, null, 2));

  // Przykładowy sukces
  return res.status(200).json({
    message: 'Wywiad pacjenta został zapisany.',
    recordId: interviewRecord.id,
    createdAt: interviewRecord.createdAt,
  });
}
