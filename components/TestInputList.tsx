import React from 'react'

interface Props {
  selectedConditions: string[]
  conditionToTests: Record<string, string[]>
  values: Record<string, string>
  onChange: (test: string, value: string) => void
}

const testInputTypes: Record<string, 'number' | 'range' | 'text'> = {
  'Glukoza': 'number',
  'HbA1c': 'number',
  'Kreatynina': 'number',
  'TSH': 'number',
  'Witamina D3': 'number',
  'Pomiar ciśnienia': 'range',
  'Saturacja': 'range',
  'EKG': 'text',
  'Gastroskopia': 'text',
  'Badanie kału': 'text',
  'USG': 'text'
  // Dodaj więcej jeśli chcesz
}

export default function TestInputList({
  selectedConditions,
  conditionToTests,
  values,
  onChange
}: Props) {
  const allTests = Array.from(
    new Set(selectedConditions.flatMap((cond) => conditionToTests[cond] || []))
  )

  return (
    <div className='mt-6'>
      <h3 className='text-md font-semibold mb-2'>Wprowadź wyniki badań:</h3>
      {allTests.map((test) => {
        const type = testInputTypes[test] || 'text'
        return (
          <div key={test} className='mb-3'>
            <label className='block text-sm font-semibold mb-1'>{test}</label>
            {type === 'text' && (
              <textarea
                className='w-full border px-2 py-1'
                rows={2}
                value={values[test] || ''}
                onChange={(e) => onChange(test, e.target.value)}
                placeholder='np. prawidłowy, ujemny'
              />
            )}
            {type === 'range' && (
              <input
                type='text'
                className='w-full border px-2 py-1'
                value={values[test] || ''}
                onChange={(e) => onChange(test, e.target.value)}
                placeholder='np. 120/80'
              />
            )}
            {type === 'number' && (
              <input
                type='number'
                className='w-full border px-2 py-1'
                value={values[test] || ''}
                onChange={(e) => onChange(test, e.target.value)}
                placeholder='np. 85'
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
