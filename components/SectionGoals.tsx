import React from 'react'

interface Props {
  data: {
    goals: string[]
    chronicDiseases: string
    medications: string
    supplements: string
  }
  onChange: (field: string, value: any) => void
}

export default function SectionGoals({ data, onChange }: Props) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-bold'>Cele i stan zdrowia</h3>

      <div>
        <label className='block font-semibold'>Jakie są cele diety?</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data.goals.join(', ')}
          onChange={(e) => onChange('goals', e.target.value.split(',').map(x => x.trim()))}
          placeholder='np. redukcja wagi, poprawa wyników, wsparcie w chorobie...'
        />
      </div>

      <div>
        <label className='block font-semibold'>Choroby przewlekłe / dietozależne:</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data.chronicDiseases}
          onChange={(e) => onChange('chronicDiseases', e.target.value)}
        />
      </div>

      <div>
        <label className='block font-semibold'>Leki przyjmowane na stałe:</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data.medications}
          onChange={(e) => onChange('medications', e.target.value)}
        />
      </div>

      <div>
        <label className='block font-semibold'>Suplementy diety (nazwy + dawki):</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data.supplements}
          onChange={(e) => onChange('supplements', e.target.value)}
        />
      </div>
    </div>
  )
}
