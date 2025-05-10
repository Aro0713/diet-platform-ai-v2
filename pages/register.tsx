import { useState } from 'react'
import { useRouter } from 'next/router'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'basic'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const patientID = 'PAT' + Math.floor(100000 + Math.random() * 900000)
    const registeredAt = new Date()
    const expiresAt = new Date()
    expiresAt.setDate(registeredAt.getDate() + 7)

    const newPatient = {
      ...form,
      patientID,
      registeredAt: registeredAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      premium: form.plan === 'premium'
    }

    localStorage.setItem('patientData', JSON.stringify(newPatient))
    alert(`Rejestracja zakończona. Twój ID pacjenta: ${patientID}`)
    router.push('/patient')
  }

  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <h1 className='text-3xl font-bold mb-6'>Rejestracja pacjenta</h1>

      <form onSubmit={handleSubmit} className='bg-white p-6 rounded shadow max-w-lg space-y-4'>
        <div>
          <label className='block mb-1 font-semibold'>Imię i nazwisko</label>
          <input
            type='text'
            name='name'
            required
            className='w-full border px-3 py-2'
            onChange={handleChange}
          />
        </div>
        <div>
          <label className='block mb-1 font-semibold'>Email</label>
          <input
            type='email'
            name='email'
            required
            className='w-full border px-3 py-2'
            onChange={handleChange}
          />
        </div>
        <div>
          <label className='block mb-1 font-semibold'>Telefon</label>
          <input
            type='tel'
            name='phone'
            required
            className='w-full border px-3 py-2'
            onChange={handleChange}
          />
        </div>
        <div>
          <label className='block mb-1 font-semibold'>Wybierz plan</label>
          <select
            name='plan'
            className='w-full border px-3 py-2'
            onChange={handleChange}
            value={form.plan}
          >
            <option value='basic'>Podstawowy – 28,80 PLN</option>
            <option value='premium'>Premium + skaner – 38,80 PLN</option>
          </select>
        </div>
        <button type='submit' className='bg-blue-600 text-white px-4 py-2 rounded w-full'>
          Zarejestruj i aktywuj darmowy dostęp
        </button>
      </form>
    </div>
  )
}
