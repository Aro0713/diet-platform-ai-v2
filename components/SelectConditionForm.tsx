import React, { useState, useEffect } from 'react';
import Select, { StylesConfig } from 'react-select';
import { diseaseGroups } from '../lib/diseaseTestsMap';
import { conditionLabels, conditionGroupLabels } from '@/utils/translations/translationsConditions';
import { getTranslation, LangKey } from '@/utils/i18n';
import PanelCard from '@/components/PanelCard';

interface Props {
  selectedConditions: string[];
  setSelectedConditions: (conditions: string[]) => void;
  lang: LangKey;
}

const SelectConditionForm: React.FC<Props> = ({ selectedConditions, setSelectedConditions, lang }) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const newConditions = selectedGroups.flatMap(
      (group) => diseaseGroups[group] || []
    );
    setAvailableConditions(newConditions);

    setSelectedConditions(
      selectedConditions.filter((cond) => newConditions.includes(cond))
    );
  }, [selectedGroups]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const groupOptions = Object.keys(diseaseGroups).map((group) => ({
    label: getTranslation(conditionGroupLabels, group, lang),
    value: group,
  }));

  const conditionOptions = availableConditions
    .filter((condition) =>
      getTranslation(conditionLabels, condition, lang)
        .toLowerCase()
        .includes(filter.toLowerCase())
    )
    .map((cond) => ({
      label: getTranslation(conditionLabels, cond, lang),
      value: cond,
    }));

  const customStyles: StylesConfig<any, true> = {
    control: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#cccccc',
      color: isDarkMode ? 'white' : 'black',
      minHeight: '2.5rem',
      boxShadow: 'none',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      color: isDarkMode ? 'white' : 'black',
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '180px',
      overflowY: 'auto',
      padding: 0,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? '#3b82f6'
        : isDarkMode
        ? '#1e293b'
        : '#ffffff',
      color: isDarkMode ? 'white' : 'black',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDarkMode ? 'white' : 'black',
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? 'white' : 'black',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? 'white' : 'black',
    }),
  };

  return (
    <PanelCard
      title={lang === 'pl' ? '🧬 Wybór chorób i filtr' : '🧬 Select and Filter Conditions'}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium mb-2 block">
            {lang === 'pl' ? 'Wybierz grupy chorób:' : 'Select disease groups:'}
          </label>
          <Select
            isMulti
            options={groupOptions}
            value={groupOptions.filter((g) => selectedGroups.includes(g.value))}
            onChange={(selected) => setSelectedGroups(selected.map((g) => g.value))}
            classNamePrefix="react-select"
            menuPortalTarget={document.body}
            styles={customStyles}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            {lang === 'pl' ? 'Wyszukaj chorobę:' : 'Search condition:'}
          </label>
          <input
            type="text"
            placeholder={lang === 'pl' ? 'np. cukrzyca' : 'e.g. diabetes'}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-white text-black placeholder:text-gray-500 
                       border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="text-sm font-medium mb-2 block">
          {lang === 'pl'
            ? `Wybierz choroby (${selectedConditions.length} wybrane):`
            : `Select conditions (${selectedConditions.length} selected):`}
        </label>
        <Select
          isMulti
          options={conditionOptions}
          value={conditionOptions.filter((opt) => selectedConditions.includes(opt.value))}
          onChange={(selected) => setSelectedConditions(selected.map((c) => c.value))}
          classNamePrefix="react-select"
          menuPortalTarget={document.body}
          styles={customStyles}
        />
      </div>
    </PanelCard>
  );
};

export default SelectConditionForm;
