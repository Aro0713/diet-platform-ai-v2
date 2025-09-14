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
    <div className="mt-4 w-full">
      <label className="block font-semibold mb-1 text-sm md:text-base">Wybierz modele diet:</label>
      <select
          multiple
          className="w-full text-sm md:text-base border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedModels}
          onChange={(e) =>
            setSelectedModels(Array.from(e.target.selectedOptions, (opt) => opt.value))
          }
          aria-label="Wybierz modele diet"
          size={Math.min(6, Math.max(3, selectedGroups.length ? 4 : 3))}
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
