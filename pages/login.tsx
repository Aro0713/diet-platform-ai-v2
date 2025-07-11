import { useState } from 'react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [inputId, setInputId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'doctor' | 'patient' | 'admin'>('patient')

  const handleLogin = () => {
    if (role === 'admin') {
      const password = prompt('🔐 Podaj hasło administratora:')
      if (password !== 'admin123') {
        setError('❌ Nieprawidłowe hasło administratora.')
        return
      }
      router.push('/admin')
      return
    }

    if (role === 'doctor') {
      router.push('/panel')
      return
    }

    // dla pacjenta – sprawdzamy ID + subskrypcję
    const data = localStorage.getItem('patientData')
    if (!data) {
      setError('Brak danych pacjenta. Zarejestruj się.')
      return
    }

    const parsed = JSON.parse(data)
    const now = new Date()
    const expiry = new Date(parsed.expiresAt)

    if (parsed.patientID !== inputId) {
      setError('Nieprawidłowy ID pacjenta.')
      return
    }

    if (now > expiry) {
      setError('⛔ Subskrypcja wygasła. Skontaktuj się z administratorem.')
      return
    }

    setError(null)
    router.push('/panel-patient')

  }
  useEffect(() => {
    const roleFromUrl = router.query.role
    if (roleFromUrl && typeof roleFromUrl === 'string') {
      setRole(roleFromUrl as 'doctor' | 'patient' | 'admin')
    }
  }, [router.query.role])
  
  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <h1 className='text-3xl font-bold mb-6'>Logowanie</h1>

      <div className='bg-white p-6 rounded shadow max-w-lg space-y-4'>
        <div>
          <label className='block font-semibold mb-1'>Wybierz rolę</label>
          <select
            className='w-full border px-3 py-2'
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value='doctor'>Lekarz / Dietetyk</option>
            <option value='patient'>Pacjent</option>
            <option value='admin'>Admin</option>
          </select>
        </div>

        {role === 'patient' && (
          <div>
            <label className='block font-semibold mb-1 mt-4'>ID pacjenta</label>
            <input
              type='text'
              className='w-full border px-3 py-2'
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder='np. PAT123456'
            />
          </div>
        )}

        <button
          onClick={handleLogin}
          className='bg-blue-600 text-white px-4 py-2 rounded w-full mt-4'
        >
          Zaloguj
        </button>

        {error && <p className='text-red-600 font-semibold mt-2'>{error}</p>}
      </div>
    </div>
  )
}
