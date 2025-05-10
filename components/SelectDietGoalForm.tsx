import React from 'react';

interface Props {
  selectedGoals: string[];
  setSelectedGoals: (goals: string[]) => void;
  groupedDietGoals: Record<string, string>; // key = value, value = translated label
}

export default function SelectDietGoalForm({
  selectedGoals,
  setSelectedGoals,
  groupedDietGoals
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGoals([e.target.value]);
  };

  return (
    <div>
      <label className="block font-semibold mb-1">Wybierz cel diety:</label>
      <select
        className="w-full border px-2 py-1 rounded"
        value={selectedGoals[0] || ''}
        onChange={handleChange}
      >
        <option value="">–</option>
        {Object.entries(groupedDietGoals).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
