import React from 'react';

interface SelectMealsPerDayProps {
  value: number;
  onChange: (value: number) => void;
}

export const SelectMealsPerDay: React.FC<SelectMealsPerDayProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-semibold text-sm text-gray-700">🧩 Liczba posiłków dziennie (ustala lekarz)</label>
      <select
        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        required
      >
        <option value={3}>3 posiłki</option>
        <option value={4}>4 posiłki</option>
        <option value={5}>5 posiłków</option>
      </select>
    </div>
  );
};
