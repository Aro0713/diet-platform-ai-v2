import React from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const activityLevels = [
  { value: "low", label: "Niska aktywność" },
  { value: "moderate", label: "Umiarkowana aktywność" },
  { value: "high", label: "Wysoka aktywność" },
];

export const SelectActivityForm: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Aktywność fizyczna
      </label>
      <select
        className="w-full p-2 border rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Wybierz poziom aktywności</option>
        {activityLevels.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectActivityForm;
