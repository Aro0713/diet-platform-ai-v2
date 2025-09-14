import React, { useEffect, useState } from 'react';
import Select, { StylesConfig } from 'react-select';
import { tUI, LangKey } from '@/utils/i18n';

interface Props {
  selectedGroups: string[];
  setSelectedGroups: (groups: string[]) => void;
  options: { value: string; label: string }[];
  lang: LangKey;
}

export default function SelectGroupForm({
  selectedGroups,
  setSelectedGroups,
  options,
  lang
}: Props) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    setIsDarkMode(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  const selectedValues = options.filter((opt) =>
    selectedGroups.includes(opt.value)
  );

  const customStyles: StylesConfig<any, true> = {
   control: (base) => ({
  ...base,
  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
  borderColor: isDarkMode ? '#475569' : '#d1d5db',
  color: isDarkMode ? 'white' : 'black',
  minHeight: '2.5rem',
  boxShadow: 'none',
  fontSize: '0.875rem', // ~text-sm
}),

    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
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
    ? '#1f2937'
    : '#ffffff',
  color: isDarkMode ? 'white' : 'black',
  cursor: 'pointer',
  padding: '8px 12px',
  fontSize: '0.875rem',
}),

    multiValue: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? '#475569' : '#e2e8f0',
    }),
    multiValueLabel: (base) => ({
  ...base,
  color: isDarkMode ? 'white' : 'black',
  fontSize: '0.875rem',
}),

   input: (base) => ({
  ...base,
  color: isDarkMode ? 'white' : 'black',
  fontSize: '0.875rem',
}),

  singleValue: (base) => ({
  ...base,
  color: isDarkMode ? 'white' : 'black',
  fontSize: '0.875rem',
}),

  };

  return (
    <div className="mt-4 w-full text-black dark:text-white relative z-10 overflow-visible">
      <label className="block font-semibold mb-2 text-sm md:text-base text-gray-800 dark:text-white">
        {tUI('selectDiseaseGroups', lang)}
      </label>
     <Select
      isMulti
      options={options}
      value={selectedValues}
      onChange={(selected) =>
        setSelectedGroups(
          Array.isArray(selected) ? selected.map((s) => s.value) : []
        )
      }
      className="w-full text-sm md:text-base"
      classNamePrefix="react-select"
      placeholder={tUI('selectDiseaseGroups', lang)}
      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
      menuPlacement="auto"
      menuShouldScrollIntoView={false}
      styles={customStyles}
    />
    </div>
  );
}
