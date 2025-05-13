import React from 'react';

interface Props {
  selectedGoals: string[];
  setSelectedGoals: (goals: string[]) => void;
  groupedDietGoals: Record<string, string>; // key = value, value = translated label
  placeholder?: string; // ⬅ dodajemy placeholder
}

export default function SelectDietGoalForm({
  selectedGoals,
  setSelectedGoals,
  groupedDietGoals,
  placeholder = '–' // ⬅ domyślny placeholder
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGoals([e.target.value]);
  };

  return (
    <select
      className="w-full border px-2 py-1 rounded"
      value={selectedGoals[0] || ''}
      onChange={handleChange}
    >
      <option value="">{placeholder}</option>
      {Object.entries(groupedDietGoals).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
