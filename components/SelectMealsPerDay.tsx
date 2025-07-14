import React from 'react';
import PanelCard from './PanelCard';

interface SelectMealsPerDayProps {
  value: number;
  onChange: (value: number) => void;
}

const SelectMealsPerDayForm: React.FC<SelectMealsPerDayProps> = ({ value, onChange }) => {
  return (
    <PanelCard title="🧩 Liczba posiłków dziennie" className="bg-[#0d1117] text-white border border-gray-600">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Liczba posiłków dziennie
        </label>
        <select
          className="rounded-md px-3 py-2 bg-[#1e293b] text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          <option value={0}>-- Wybierz --</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
          <option value={6}>6</option>
        </select>
      </div>
    </PanelCard>
  );
};

export default SelectMealsPerDayForm;
