import { useEffect, useState } from 'react'
import { generateDietPdf } from '../utils/generateDietPdf'

export default function ReviewPage() {
  const [pendingDiets, setPendingDiets] = useState<any[]>([])
  const [userRole, setUserRole] = useState<'lekarz' | 'dietetyk'>('dietetyk')

  useEffect(() => {
    const stored = localStorage.getItem('pendingDiets')
    if (stored) {
      setPendingDiets(JSON.parse(stored))
    }
  }, [])

  const approve = (id: number) => {
    const updated = pendingDiets.filter((diet) => diet.id !== id)
    setPendingDiets(updated)
    localStorage.setItem('pendingDiets', JSON.stringify(updated))

    const history = JSON.parse(localStorage.getItem('dietHistory') || '[]')
    const approved = pendingDiets.find((d) => d.id === id)
    history.push({ ...approved, approvedBy: userRole, approvedAt: new Date().toLocaleString() })
    localStorage.setItem('dietHistory', JSON.stringify(history))
    alert('✅ Dieta zatwierdzona i zapisana do historii.')
  }

  const reject = (id: number) => {
    const updated = pendingDiets.filter((diet) => diet.id !== id)
    setPendingDiets(updated)
    localStorage.setItem('pendingDiets', JSON.stringify(updated))
    alert('❌ Dieta została odrzucona.')
  }

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <h1 className='text-3xl font-bold mb-4'>Zatwierdzanie diet ({userRole})</h1>

      <div className='mb-6'>
        <label className='block mb-1 font-semibold'>Twoja rola:</label>
        <select
          className='border px-2 py-1'
          value={userRole}
          onChange={(e) => setUserRole(e.target.value as 'lekarz' | 'dietetyk')}
        >
          <option value="lekarz">Lekarz</option>
          <option value="dietetyk">Dietetyk</option>
        </select>
      </div>

      {pendingDiets.length === 0 ? (
        <p>Brak diet oczekujących na zatwierdzenie.</p>
      ) : (
        pendingDiets.map((entry) => (
          <div key={entry.id} className='bg-white p-4 rounded shadow mb-4'>
            <p className='text-sm text-gray-500'>📅 {entry.date}</p>
            <p><strong>Pacjent:</strong> {entry.patient.age} lat, {entry.patient.sex}</p>
            <p><strong>Waga:</strong> {entry.patient.weight} kg | <strong>Wzrost:</strong> {entry.patient.height} cm | <strong>BMI:</strong> {entry.bmi}</p>
            
            <ul className='list-disc pl-5 text-sm mt-2'>
              {entry.diet.map((meal: any, idx: number) => (
                <li key={idx}>
                  <div>
                    <strong>{meal.name}</strong>: {meal.ingredients.map((i: any) => `${i.product} (${i.weight}g)`).join(', ')}
                  </div>
                  <div>
                    Kalorie: {meal.calories} kcal | IG: {meal.glycemicIndex}
                  </div>
                </li>
              ))}
            </ul>

            <div className='mt-4 flex gap-4'>
              <button
                className='bg-green-600 text-white px-4 py-2 rounded'
                onClick={() => approve(entry.id)}
              >
                ✅ Zatwierdź
              </button>
              <button
                className='bg-red-600 text-white px-4 py-2 rounded'
                onClick={() => reject(entry.id)}
              >
                ❌ Odrzuć
              </button>
              <button
                className='bg-blue-600 text-white px-4 py-2 rounded'
                onClick={() => generateDietPdf(entry.patient, entry.bmi, entry.diet)}
              >
                📄 PDF
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
