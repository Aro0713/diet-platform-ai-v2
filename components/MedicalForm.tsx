import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { LangKey, getTranslation } from '../utils/i18n';
import {
  conditionLabels,
  conditionGroupLabels,
  testLabels,
  medicalUI
} from '@/utils/translations/translationsConditions';
import { diseaseGroups } from '@/components/diseaseGroups';
import { testsByCondition } from '@/types/testsByCondition';
import { testReferenceValues } from '@/components/testReferenceValues';
import PanelCard from '@/components/PanelCard';
import SelectGroupForm from './SelectGroupForm';

interface MedicalFormProps {
  onChange: (data: {
    selectedGroups: string[];
    selectedConditions: string[];
    testResults: { [testName: string]: string };
  }) => void;
  lang: LangKey;
}

const tMedical = (key: keyof typeof medicalUI, lang: LangKey): string =>
  medicalUI[key]?.[lang] || medicalUI[key]?.pl || key;

const MedicalForm: React.FC<MedicalFormProps> = ({ onChange, lang }) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
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

  const customStyles = useMemo(() => ({
    control: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      borderColor: isDarkMode ? '#475569' : '#d1d5db',
      color: isDarkMode ? 'white' : 'black',
      minHeight: '2.5rem',
      boxShadow: 'none',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      color: isDarkMode ? 'white' : 'black',
      zIndex: 9999,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    menuList: (base: any) => ({
      ...base,
      maxHeight: '180px',
      overflowY: 'auto',
      padding: 0,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused
        ? '#3b82f6'
        : isDarkMode
        ? '#1f2937'
        : '#ffffff',
      color: isDarkMode ? 'white' : 'black',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: isDarkMode ? 'white' : 'black',
    }),
    input: (base: any) => ({
      ...base,
      color: isDarkMode ? 'white' : 'black',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDarkMode ? 'white' : 'black',
    }),
  }), [isDarkMode]);

  const groupOptions = useMemo(() => (
    Object.keys(diseaseGroups).map(group => ({
      value: group,
      label: getTranslation(conditionGroupLabels, group, lang)
    }))
  ), [lang]);

  const conditionOptions = useMemo(() => (
    availableConditions.map(cond => ({
      value: cond,
      label: getTranslation(conditionLabels, cond, lang)
    }))
  ), [availableConditions, lang]);

  useEffect(() => {
    const conditions: string[] = selectedGroups.flatMap((group) =>
      diseaseGroups[group] || []
    );

    const isSame =
      conditions.length === availableConditions.length &&
      conditions.every((c) => availableConditions.includes(c));

    if (!isSame) {
      setAvailableConditions(conditions);
      setSelectedConditions([]);
      setTestResults({});
    }
  }, [selectedGroups]);

  const handleTestResultChange = (testName: string, value: string) => {
    setTestResults((prev) => ({
      ...prev,
      [testName]: value,
    }));
  };

  useEffect(() => {
    onChange({
      selectedGroups,
      selectedConditions,
      testResults,
    });
  }, [selectedGroups, selectedConditions, testResults]);

  return (
    <PanelCard title={`\ud83e\udda2 ${tMedical('testResults', lang)}`}>
      <SelectGroupForm
        selectedGroups={selectedGroups}
        setSelectedGroups={setSelectedGroups}
        options={groupOptions}
      />

      {availableConditions.length > 0 && (
        <>
          <label className="block mb-2 font-semibold dark:text-white">
            {tMedical('selectConditions', lang)}
          </label>
          <Select
            instanceId="disease-conditions"
            isMulti
            options={conditionOptions}
            value={conditionOptions.filter(opt => selectedConditions.includes(opt.value))}
            onChange={(selected) => setSelectedConditions(selected.map((s) => s.value))}
            className="mb-6"
            placeholder={tMedical('selectConditions', lang)}
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
            styles={customStyles}
          />
        </>
      )}

      {selectedConditions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4 dark:text-white">
            {tMedical('testResults', lang)}
          </h3>
          {selectedConditions.map((condition) => (
            <div key={condition} className="mb-6">
              <h4 className="font-semibold mb-2 dark:text-white">
                {getTranslation(conditionLabels, condition, lang)}
              </h4>
              {(testsByCondition[condition] || ["Opis choroby"]).map((test: string) => (
                <div key={test} className="mb-3">
                  <label className="block text-sm font-semibold mb-1 dark:text-white">
                    {getTranslation(testLabels, test, lang)}
                  </label>
                  <input
                    type="text"
                    value={testResults[test] || ""}
                    onChange={(e) => handleTestResultChange(test, e.target.value)}
                    className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 
                               dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
                               border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                    placeholder={`${tMedical('rangePrefix', lang)} ${testReferenceValues[test] || tMedical('enterResult', lang)}`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
};

export default MedicalForm;
