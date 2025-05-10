import React from 'react'

interface Props {
  selectedGroups: string[]
  selectedModels: string[]
  setSelectedModels: (models: string[]) => void
  groupedDietGoals: Record<string, string[]>
}

export default function SelectDietModelForm({
  selectedGroups,
  selectedModels,
  setSelectedModels,
  groupedDietGoals
}: Props) {
  const filteredModels = selectedGroups.flatMap((group) => groupedDietGoals[group] || [])

  return (
    <div className='mt-4'>
      <label className='block font-semibold mb-1'>Wybierz modele diet:</label>
      <select
        multiple
        className='w-full border px-2 py-1'
        value={selectedModels}
        onChange={(e) =>
          setSelectedModels(Array.from(e.target.selectedOptions, (opt) => opt.value))
        }
      >
        {filteredModels.map((model) => (
          <option key={model} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  )
}
