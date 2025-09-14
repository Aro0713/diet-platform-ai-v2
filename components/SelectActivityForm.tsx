import React from "react";
import PanelCard from "./PanelCard";

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
    <PanelCard title="🏃‍♂️ Aktywność fizyczna" className="bg-[#0d1117] text-white border border-gray-600 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm md:text-base font-medium">
          Wybierz poziom aktywności:
        </label>
        <select
          className="w-full text-sm md:text-base border rounded-md px-3 py-2 bg-[#1e293b] text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Wybierz poziom aktywności"
        >
          <option value="">--</option>
          {activityLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>
    </PanelCard>
  );
};

export default SelectActivityForm;
