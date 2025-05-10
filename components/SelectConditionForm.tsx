import React, { useState, useEffect } from 'react';
import { diseaseGroups } from '../lib/diseaseTestsMap';

interface Props {
  selectedConditions: string[];
  setSelectedConditions: (conditions: string[]) => void;
}

const SelectConditionForm: React.FC<Props> = ({ selectedConditions, setSelectedConditions }) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const newConditions = selectedGroups.flatMap(group => diseaseGroups[group] || []);
    setAvailableConditions(newConditions);
    setSelectedConditions(
      selectedConditions.filter(cond => newConditions.includes(cond))
    );
  }, [selectedGroups]);

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setSelectedGroups(values);
  };

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setSelectedConditions(values);
  };

  const visibleConditions = availableConditions.filter(condition =>
    condition.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="font-semibold block mb-2">Wybierz grupy chorób:</label>
          <select
            multiple
            className="w-full border rounded px-2 py-1"
            value={selectedGroups}
            onChange={handleGroupChange}
          >
            {Object.keys(diseaseGroups).map((group) => (
              <option key={group} value={group}>
                {group} ({diseaseGroups[group].length})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold block mb-2">Wyszukaj chorobę:</label>
          <input
            type="text"
            placeholder="np. cukrzyca"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      <div>
        <label className="font-semibold block mb-2">
          Wybierz choroby ({selectedConditions.length} wybrane):
        </label>
        <select
          multiple
          className="w-full border rounded px-2 py-1"
          value={selectedConditions}
          onChange={handleConditionChange}
          size={Math.min(10, visibleConditions.length || 5)}
        >
          {visibleConditions.map((condition) => (
            <option key={condition} value={condition}>
              {condition}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SelectConditionForm;
