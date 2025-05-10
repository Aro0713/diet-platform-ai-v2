import React from 'react'

interface Props {
  selectedGroups: string[]
  setSelectedGroups: (groups: string[]) => void
}

const groupOptions = [
  'Choroby metaboliczne',
  'Choroby krążenia',
  'Choroby nerek',
  'Choroby przewodu pokarmowego',
  'Choroby skóry',
  'Choroby endokrynologiczne',
  'Choroby układu kostno-stawowego',
  'Choroby pasożytnicze',
  'Nowotwory',
  'Alergie pokarmowe'
]

export default function SelectGroupForm({ selectedGroups, setSelectedGroups }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions, (option) => option.value)
    setSelectedGroups(options)
  }

  return (
    <div className='mt-4'>
      <label className='block font-semibold mb-1'>Wybierz grupy chorób:</label>
      <select
        multiple
        className='w-full border px-2 py-1'
        value={selectedGroups}
        onChange={handleChange}
      >
        {groupOptions.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>
    </div>
  )
}
