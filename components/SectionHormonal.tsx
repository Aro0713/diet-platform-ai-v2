import React from 'react'

interface Props {
  data: {
    menstrualCycle: string
    hormonalIssues: string
    pregnancyOrBreastfeeding: string
    contraception: string
  }
  onChange: (field: string, value: string) => void
}

export default function SectionHormonal({ data, onChange }: Props) {
  return (
    <div className='space-y-4 mt-6'>
      <h3 className='text-lg font-bold'>Kobiety – pytania dodatkowe</h3>

      <div>
        <label className='block font-semibold'>Czy cykle miesiączkowe są regularne?</label>
        <input
          type='text'
          className='w-full border px-2 py-1'
          value={data.menstrualCycle}
          onChange={(e) => onChange('menstrualCycle', e.target.value)}
        />
      </div>

      <div>
        <label className='block font-semibold'>Dolegliwości hormonalne (np. PCOS, endometrioza):</label>
        <textarea
          className='w-full border px-2 py-1'
          value={data.hormonalIssues}
          onChange={(e) => onChange('hormonalIssues', e.target.value)}
        />
      </div>

      <div>
        <label className='block font-semibold'>Czy jest Pani w ciąży lub karmi piersią?</label>
        <input
          type='text'
          className='w-full border px-2 py-1'
          value={data.pregnancyOrBreastfeeding}
          onChange={(e) => onChange('pregnancyOrBreastfeeding', e.target.value)}
        />
      </div>

      <div>
        <label className='block font-semibold'>Czy stosuje Pani antykoncepcję hormonalną?</label>
        <input
          type='text'
          className='w-full border px-2 py-1'
          value={data.contraception}
          onChange={(e) => onChange('contraception', e.target.value)}
        />
      </div>
    </div>
  )
}
