import React, { useState } from 'react'
import { useRouter } from 'next/router'

export default function LoginDoctorForm() {
  const router = useRouter()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    address: '',
    pwz: '',
    professionCode: '',
    phone: '',
    email: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.pwz && !form.professionCode) {
      alert('Wymagany numer PWZ lub kod zawodu.')
      return
    }

    // symulacja
    console.log('Formularz lekarza:', form)
    router.push('/panel')
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 bg-white p-6 rounded shadow max-w-xl'>
      <h2 className='text-xl font-bold'>Rejestracja lekarza / dietetyka</h2>

      <input name='firstName' placeholder='Imię' className='w-full border px-2 py-1' onChange={handleChange} required />
      <input name='lastName' placeholder='Nazwisko' className='w-full border px-2 py-1' onChange={handleChange} required />
      <input name='title' placeholder='Tytuł naukowy (opcjonalnie)' className='w-full border px-2 py-1' onChange={handleChange} />
      <input name='address' placeholder='Adres wykonywanej działalności medycznej' className='w-full border px-2 py-1' onChange={handleChange} required />
      <input name='pwz' placeholder='Numer PWZ (jeśli dotyczy)' className='w-full border px-2 py-1' onChange={handleChange} />
      <input name='professionCode' placeholder='Kod zawodu (jeśli nie PWZ)' className='w-full border px-2 py-1' onChange={handleChange} />
      <input name='phone' placeholder='Numer telefonu' className='w-full border px-2 py-1' onChange={handleChange} required />
      <input name='email' type='email' placeholder='Adres e-mail' className='w-full border px-2 py-1' onChange={handleChange} required />

      <button type='submit' className='bg-blue-600 text-white px-4 py-2 rounded'>Zarejestruj</button>
    </form>
  )
}
