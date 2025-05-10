import React from 'react'
import { useState } from 'react'

export default function PatientForm() {
  const [form, setForm] = useState({
    age: '',
    sex: '',
    weight: '',
    height: '',
    conditions: [] as string[],
    allergies: '',
    region: ''
  })

  const [diet, setDiet] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    const updated = checked
      ? [...form.conditions, value]
      : form.conditions.filter((item) => item !== value)
    setForm({ ...form, conditions: updated })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setDiet(null)

    try {
      const res = await fetch('/api/generate-diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      setDiet(data.diet)
    } catch (error) {
      console.error('B³¹d podczas generowania diety:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='bg-white p-6 rounded shadow max-w-2xl mx-auto space-y-4'>
      <h2 className='text-xl font-semibold mb-2'>Formularz pacjenta</h2>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block mb-1'>Wiek</label>
          <input name='age' type='number' className='w-full border px-2 py-1' onChange={handleChange} required />
        </div>
        <div>
          <label className='block mb-1'>P³eæ</label>
          <select name='sex' className='w-full border px-2 py-1' onChange={handleChange} required>
            <option value=''>Wybierz</option>
            <option value='Kobieta'>Kobieta</option>
            <option value='Mê¿czyzna'>Mê¿czyzna</option>
          </select>
        </div>
        <div>
          <label className='block mb-1'>Waga (kg)</label>
          <input name='weight' type='number' className='w-full border px-2 py-1' onChange={handleChange} required />
        </div>
        <div>
          <label className='block mb-1'>Wzrost (cm)</label>
          <input name='height' type='number' className='w-full border px-2 py-1' onChange={handleChange} required />
        </div>
      </div>

      <div>
        <label className='block mb-1'>Schorzenia</label>
        <div className='flex flex-wrap gap-4'>
          {['niewydolnoœæ nerek', 'niewydolnoœæ w¹troby', 'cukrzyca', 'nadciœnienie'].map((cond) => (
            <label key={cond}>
              <input
                type='checkbox'
                value={cond}
                onChange={handleCheckbox}
                className='mr-1'
              />
              {cond}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className='block mb-1'>Alergie pokarmowe</label>
        <input name='allergies' className='w-full border px-2 py-1' onChange={handleChange} />
      </div>

      <div>
        <label className='block mb-1'>Region œwiata (np. Polska, Azja, USA)</label>
        <input name='region' className='w-full border px-2 py-1' onChange={handleChange} />
      </div>

      <button
        type='submit'
        className='bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50'
        disabled={loading}
      >
        {loading ? 'Generowanie...' : 'Wygeneruj dietê'}
      </button>

      {diet && (
        <div className='mt-6'>
          <h3 className='text-lg font-semibold mb-2'>Zalecana dieta:</h3>
          <ul className='list-disc pl-5 space-y-1'>
            {diet.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
