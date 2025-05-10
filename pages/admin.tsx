import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function AdminLogin() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const adminEmail = 'a4p.email@gmail.com'
  const correctPassword = 'Ar@1234567'

  const validatePassword = (value: string): boolean => {
    const regex = /^(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{10,}$/
    return regex.test(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePassword(password)) {
      setError('Hasło musi mieć min. 10 znaków, zawierać dużą literę, cyfrę i znak specjalny.')
      return
    }

    if (password !== correctPassword) {
      setError('Nieprawidłowe hasło administratora.')
      return
    }

    // symulacja logowania admina
    alert('✅ Zalogowano jako administrator')
    router.push('/admin-panel')
  }

  return (
    <div className='min-h-screen bg-gray-100 p-6'>
      <Head>
        <title>Logowanie – Administrator</title>
      </Head>

      <form onSubmit={handleSubmit} className='max-w-md mx-auto bg-white p-6 rounded shadow space-y-4'>
        <h2 className='text-xl font-bold text-center'>Logowanie Administratora</h2>

        <input
          type='email'
          value={adminEmail}
          disabled
          className='w-full border px-2 py-1 bg-gray-200 text-gray-600'
        />

        <input
          type='password'
          placeholder='Hasło'
          className='w-full border px-2 py-1'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className='text-red-600 text-sm'>{error}</p>}

        <button type='submit' className='bg-gray-800 text-white px-4 py-2 rounded w-full'>
          Zaloguj
        </button>
      </form>
    </div>
  )
}
