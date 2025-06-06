import React from 'react';

interface Props {
  selectedGoals: string[];
  setSelectedGoals: (goals: string[]) => void;
  groupedDietGoals: Record<string, string>; // key = value, value = translated label
  placeholder?: string; // np. "-- Wybierz cel diety --"
}

export default function SelectDietGoalForm({
  selectedGoals,
  setSelectedGoals,
  groupedDietGoals,
  placeholder = '--',
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGoals([e.target.value]);
  };

  return (
    <select
      className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 transition"
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

