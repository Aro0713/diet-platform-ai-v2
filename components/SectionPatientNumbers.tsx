import React from 'react'

interface Props {
  data: {
    height: string
    weight: string
    waist: string
    hips: string
    thigh: string
    pastWeight: string
    maxWeight: string
    minWeight: string
    birthDate: string
    age: string
  }
  onChange: (field: string, value: string) => void
}

export default function SectionPatientNumbers({ data, onChange }: Props) {
  return (
    <div className='space-y-4 mt-6'>
      <h3 className='text-lg font-bold'>Pacjent w liczbach – dane antropometryczne</h3>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block font-semibold'>Wzrost (cm):</label>
          <input type='number' className='w-full border px-2 py-1' value={data.height}
            onChange={(e) => onChange('height', e.target.value)} />
        </div>
        <div>
          <label className='block font-semibold'>Masa ciała (kg):</label>
          <input type='number' className='w-full border px-2 py-1' value={data.weight}
            onChange={(e) => onChange('weight', e.target.value)} />
        </div>
        <div>
          <label className='block font-semibold'>Obwód talii (cm):</label>
          <input type='number' className='w-full border px-2 py-1' value={data.waist}
            onChange={(e) => onChange('waist', e.target.value)} />
        </div>
        <div>
          <label className='block font-semibold'>Obwód bioder (cm):</label>
          <input type='number' className='w-full border px-2 py-1' value={data.hips}
            onChange={(e) => onChange('hips', e.target.value)} />
        </div>
        <div>
          <label className='block font-semibold'>Obwód uda / ramienia (opcjonalnie):</label>
          <input type='number' className='w-full border px-2 py-1' value={data.thigh}
            onChange={(e) => onChange('thigh', e.target.value)} />
        </div>
        <div>
          <label className='block font-semibold'>Masa ciała sprzed 6 miesięcy (kg):</label>
          <input type='number' className='w-full border px-2 py-1' value={data.pastWeight}
            onChange={(e) => onChange('pastWeight', e.target.value)} />
        </div>
        <div>
          <label className='block font-semibold'>Najwyższa masa ciała w życiu (kg):</label>
          <input type='number' className='w-full border px-2 py-1' value={data.maxWeight}
            onChange={(e) => onChange('maxWeight', e.target.value)} />
        </div>
        <div>
          <label className='block font-semibold'>Najniższa masa ciała w dorosłym życiu (kg):</label>
          <input type='number' className='w-full border px-2 py-1' value={data.minWeight}
            onChange={(e) => onChange('minWeight', e.target.value)} />
        </div>
      </div>

      <div>
        <label className='block font-semibold'>Data urodzenia:</label>
        <input type='date' className='w-full border px-2 py-1' value={data.birthDate}
          onChange={(e) => onChange('birthDate', e.target.value)} />
      </div>

      <div>
        <label className='block font-semibold'>Wiek (lata):</label>
        <input type='number' className='w-full border px-2 py-1' value={data.age}
          onChange={(e) => onChange('age', e.target.value)} />
      </div>
    </div>
  )
}
