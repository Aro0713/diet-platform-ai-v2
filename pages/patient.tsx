import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { generateDietPdf } from '../utils/generateDietPdf';
import ProductScanner from '../components/ProductScanner';

export default function PatientPanel() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [phone, setPhone] = useState('');
  const [lang, setLang] = useState('');

  useEffect(() => {
        const fetchPatientData = async () => {
      const userId = localStorage.getItem('currentUserID');
      if (!userId) {
        alert('Nie jesteś zalogowany.');
        router.push('/register');
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // ✅ zamiast .single()

      if (error || !data) {
        console.error('Błąd pobierania danych pacjenta:', error);
        alert('Nie znaleziono danych pacjenta.');
        router.push('/register');
        return;
      }

      setPatient(data);
      setPhone(data.phone || '');
      setLang(data.lang || '');

      if (data.expiresAt) {
        const now = new Date();
        const expiry = new Date(data.expiresAt);
        const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysLeft(diff);
      }
    };


    fetchPatientData();
  }, [router]);

  const updatePatient = async () => {
    const userId = localStorage.getItem('currentUserID');
    const { error } = await supabase
      .from('patients')
      .update({ phone, lang })
      .eq('user_id', userId);

    if (error) {
      alert('Błąd aktualizacji danych: ' + error.message);
    } else {
      alert('Dane zostały zapisane.');
    }
  };

  const updateDiet = async () => {
    const userId = localStorage.getItem('currentUserID');
    const newDiet = {
      date: new Date().toISOString().split('T')[0],
      diet: [
        {
          name: `Nowa dieta: ${selectedRegion} / ${selectedCuisine}`,
          calories: 1800,
          glycemicIndex: 45,
          ingredients: [
            { product: 'Produkt A', weight: 100 },
            { product: 'Produkt B', weight: 150 }
          ]
        }
      ]
    };

    const { error } = await supabase
      .from('patients')
      .update(newDiet)
      .eq('user_id', userId);

    if (error) {
      alert('Błąd zapisu diety: ' + error.message);
    } else {
      alert('Dieta została zaktualizowana.');
      setPatient({ ...patient, ...newDiet });
    }
  };

  if (!patient) return null;

  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <h1 className='text-3xl font-bold mb-4'>Panel pacjenta</h1>

      {daysLeft !== null && (
        <div className={`p-3 mb-4 rounded ${daysLeft > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
          {daysLeft > 0
            ? `📅 Masz jeszcze ${daysLeft} dni dostępu`
            : '⛔ Twój dostęp wygasł.'}
        </div>
      )}

      <div className='bg-white p-4 rounded shadow mb-6'>
        <h3 className='text-lg font-semibold mb-2'>📇 Twoje dane</h3>
        <label className='block text-sm mb-1'>Telefon</label>
        <input
          className='w-full border px-3 py-1 mb-2'
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <label className='block text-sm mb-1'>Język</label>
        <input
          className='w-full border px-3 py-1 mb-2'
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        />
        <button className='bg-blue-600 text-white px-4 py-2 rounded' onClick={updatePatient}>💾 Zapisz dane</button>
      </div>

      {patient.diet ? (
        <>
          <p className='mb-2 text-sm text-gray-600'>
            Dieta z dnia: {patient.date || '—'}
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
            onClick={() => generateDietPdf(patient, patient.bmi ?? null, patient.diet)}
          >
            📄 Pobierz dietę jako PDF
          </button>
        </>
      ) : (
        <p>Brak przypisanej diety.</p>
      )}

      <div className='mt-6 bg-white p-4 rounded shadow'>
        <h3 className='text-lg font-semibold mb-2'>🔄 Zmień dietę</h3>

        <label className='block text-sm font-semibold mb-1'>Region</label>
        <select
          className='w-full border px-2 py-1 mb-2'
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

        <label className='block text-sm font-semibold mb-1'>Kuchnia</label>
        <select
          className='w-full border px-2 py-1 mb-2'
          value={selectedCuisine}
          onChange={(e) => setSelectedCuisine(e.target.value)}
        >
          <option value=''>-- wybierz kuchnię --</option>
          <option value='Japońska'>Japońska</option>
          <option value='Środziemnomorska'>Środziemnomorska</option>
          <option value='Meksykańska'>Meksykańska</option>
          <option value='Francuska'>Francuska</option>
          <option value='Włoska'>Włoska</option>
        </select>

        <button
          className='bg-blue-600 text-white px-4 py-2 rounded'
          onClick={updateDiet}
        >
          🧠 Wygeneruj nową dietę
        </button>
      </div>

      {patient.premium && <ProductScanner patient={patient} lang={'pl'} />}
    </div>
  );
}
