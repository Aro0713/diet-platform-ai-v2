import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { generateDietPdf } from '../utils/generateDietPdf';
import ProductScanner from '../components/ProductScanner';

export default function PatientPanel() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('currentUserID');
    if (!id) {
      alert('Nie jesteś zalogowany.');
      router.push('/register');
      return;
    }

    const data = localStorage.getItem(id);
    if (!data) {
      alert('Nie znaleziono danych pacjenta.');
      router.push('/register');
      return;
    }

    const parsed = JSON.parse(data);
    setPatient(parsed);

    const now = new Date();
    const expiry = new Date(parsed.expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setDaysLeft(diff);
  }, [router]);

  if (!patient) return null;

  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <h1 className='text-3xl font-bold mb-4'>Panel pacjenta</h1>

      {daysLeft !== null && (
        <div className={`p-3 mb-4 rounded ${daysLeft > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
          {daysLeft > 0
            ? `📅 Masz jeszcze ${daysLeft} dni dostępu (${patient?.premium ? 'Plan premium' : 'Plan podstawowy'})`
            : '⛔ Twój dostęp wygasł. Skontaktuj się z administratorem lub opłać dostęp.'}
        </div>
      )}

      {!patient.diet ? (
        <p>Brak zapisanej diety. Skontaktuj się z lekarzem lub dietetykiem.</p>
      ) : (
        <>
          <p className='mb-2 text-sm text-gray-600'>
            Dieta z dnia: {patient.date || '—'} | BMI: {patient.bmi || '—'} | Zatwierdzona przez: {patient.approvedBy || '—'}
          </p>

          {patient.diet.map((meal: any, idx: number) => (
            <div key={idx} className='bg-white p-4 rounded shadow mb-4'>
              <h3 className='text-lg font-semibold'>{meal.name}</h3>
              <ul className='list-disc pl-5 text-sm'>
                {meal.ingredients.map((ing: any, i: number) => (
                  <li key={i}>{ing.product} – {ing.weight} g</li>
                ))}
              </ul>
              <p className='text-sm mt-1'>
                Kalorie: {meal.calories} kcal | IG: {meal.glycemicIndex}
              </p>
            </div>
          ))}

          <button
            className='bg-green-600 text-white px-4 py-2 rounded'
            onClick={() => generateDietPdf(patient.patient, patient.bmi, patient.diet)}
          >
            📄 Pobierz dietę jako PDF
          </button>

          <div className='mt-6 bg-white p-4 rounded shadow'>
            <h3 className='text-lg font-semibold mb-2'>🔄 Zmień dietę</h3>

            <div className='mb-2'>
              <label className='block text-sm font-semibold'>Wybierz region</label>
              <select
                className='w-full border px-2 py-1'
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value=''>-- wybierz region --</option>
                <option value='Polska'>Polska</option>
                <option value='Azja'>Azja</option>
                <option value='Afryka'>Afryka</option>
                <option value='Ameryka'>Ameryka</option>
                <option value='Europa'>Europa</option>
              </select>
            </div>

            <div className='mb-2'>
              <label className='block text-sm font-semibold'>Wybierz kuchnię</label>
              <select
                className='w-full border px-2 py-1'
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
              >
                <option value=''>-- wybierz kuchnię --</option>
                <option value='Japońska'>Japońska</option>
                <option value='Śródziemnomorska'>Śródziemnomorska</option>
                <option value='Meksykańska'>Meksykańska</option>
                <option value='Francuska'>Francuska</option>
                <option value='Włoska'>Włoska</option>
              </select>
            </div>

            <button
              className='bg-blue-600 text-white px-4 py-2 rounded mt-2'
              onClick={() => alert(`🧠 AI wygeneruje nową dietę dla regionu ${selectedRegion} i kuchni ${selectedCuisine}`)}
            >
              🔁 Zmień dietę
            </button>
          </div>

          {patient.premium && (
            <ProductScanner patient={patient} />
          )}
        </>
      )}
    </div>
  );
}
