import React, { useState } from 'react'
import { useRouter } from 'next/router'

export default function LoginPatientForm() {
  const router = useRouter()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // symulacja zapisu
    console.log('Dane pacjenta:', form)
    router.push('/patient')
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 bg-white p-6 rounded shadow max-w-xl'>
      <h2 className='text-xl font-bold'>Rejestracja pacjenta</h2>

      <input name='firstName' placeholder='Imię' className='w-full border px-2 py-1' onChange={handleChange} required />
      <input name='lastName' placeholder='Nazwisko' className='w-full border px-2 py-1' onChange={handleChange} required />
      <input name='phone' placeholder='Numer telefonu' className='w-full border px-2 py-1' onChange={handleChange} required />
      <input name='email' type='email' placeholder='Adres e-mail' className='w-full border px-2 py-1' onChange={handleChange} required />

      <button type='submit' className='bg-green-600 text-white px-4 py-2 rounded'>Zarejestruj pacjenta</button>
    </form>
  )
}
