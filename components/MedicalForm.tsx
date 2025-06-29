import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { tUI, getTranslation, LangKey } from '@/utils/i18n';
import {
  conditionLabels,
  conditionGroupLabels,
  testLabels
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
    medicalSummary?: string;
    structuredOutput?: any;
  }) => void;
  onUpdateMedical?: (summary: string) => void;
  onDeleteMedical?: () => void;
  existingMedical?: { summary?: string; json?: any };
  initialData?: {
    selectedGroups?: string[];
    selectedConditions?: string[];
    testResults?: Record<string, string>;
  };
  lang: LangKey;
}

const MedicalForm: React.FC<MedicalFormProps> = ({
  onChange,
  onUpdateMedical,
  onDeleteMedical,
  existingMedical,
  initialData,
  lang
}) => {

  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [medicalSummary, setMedicalSummary] = useState<string | undefined>();
  const [structuredOutput, setStructuredOutput] = useState<any | undefined>();
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

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

useEffect(() => {
  if (existingMedical?.summary) setMedicalSummary(existingMedical.summary);
  if (existingMedical?.json) setStructuredOutput(existingMedical.json);
}, [existingMedical]);

useEffect(() => {
  if (initialData?.selectedGroups) setSelectedGroups(initialData.selectedGroups);
  if (initialData?.selectedConditions) setSelectedConditions(initialData.selectedConditions);
  if (initialData?.testResults) setTestResults(initialData.testResults);

  if (initialData) setHasLoadedInitial(true); 
}, [initialData]);



// ✅ dynamiczne przypisanie availableConditions po zmianie grup
useEffect(() => {
  const conditions: string[] = selectedGroups.flatMap((group) =>
    diseaseGroups[group] || []
  );

  const isSame =
    conditions.length === availableConditions.length &&
    conditions.every((c) => availableConditions.includes(c));

  if (!isSame) {
    setAvailableConditions(conditions);

    // ❗ Resetuj tylko jeśli initialData NIE zostało załadowane
    if (!hasLoadedInitial) {
      setSelectedConditions([]);
      setTestResults({});
    }
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
    medicalSummary,
    structuredOutput
  });
}, [selectedGroups, selectedConditions, testResults]);


const handleMedicalAnalysis = async () => {
  setLoading(true);
  try {
    const description = testResults["Opis choroby"] || "";
    const response = await fetch("/api/analyze-medical", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testResults, description, lang })
    });

    const fullResult = await response.text();

    const jsonMatch = fullResult.match(/```json([\s\S]*?)```/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : null;

    const analysisText = fullResult.split("```")[0].trim(); // tylko część A (tekst)

    setMedicalSummary(analysisText);
    setStructuredOutput(parsed);

    onChange({
      selectedGroups,
      selectedConditions,
      testResults,
      medicalSummary: analysisText,
      structuredOutput: parsed
    });
  } catch (error) {
    console.error("Błąd analizy medycznej:", error);
  } finally {
    setLoading(false);
  }
};

  const handleEditAnalysis = () => {
  setEditedSummary(medicalSummary || "");
  setIsEditing(true);
  };

  const handleConfirmAnalysis = () => {
  setIsConfirmed(true);
  onChange({
    selectedGroups,
    selectedConditions,
    testResults,
    medicalSummary,
    structuredOutput
  });
};
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
    Object.keys(diseaseGroups).map((group) => ({
      value: group,
      label: getTranslation(conditionGroupLabels, group, lang)
    }))
  ), [lang]);

  const conditionOptions = useMemo(() => (
    availableConditions.map((cond) => ({
      value: cond,
      label: getTranslation(conditionLabels, cond, lang)
    }))
  ), [availableConditions, lang]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);


  return (
  <PanelCard title={`🧪 ${tUI('testResults', lang)}`}>
    <SelectGroupForm
      selectedGroups={selectedGroups}
      setSelectedGroups={setSelectedGroups}
      options={groupOptions}
    />

    {availableConditions.length > 0 && (
      <>
        <label className="block mb-2 font-semibold dark:text-white">
          {tUI('selectConditions', lang)}
        </label>
        <Select
          instanceId="disease-conditions"
          isMulti
          options={conditionOptions}
          value={conditionOptions.filter(opt => selectedConditions.includes(opt.value))}
          onChange={(selected) => setSelectedConditions(selected.map((s) => s.value))}
          className="mb-6"
          placeholder={tUI('selectConditions', lang)}
          menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
          styles={customStyles}
        />
      </>
    )}

    {selectedConditions.map((condition) => (
      <div key={condition} className="mb-6">
        <h4 className="font-semibold mb-2 dark:text-white">
          {getTranslation(conditionLabels, condition, lang)}
        </h4>

        {(testsByCondition[condition] || ["Opis choroby"]).map((test: string) => {
          const fieldKey = `${condition}__${test}`;
          return (
            <div key={fieldKey} className="mb-3">
              <label className="block text-sm font-semibold mb-1 dark:text-white">
                {getTranslation(testLabels, test, lang)}
              </label>
              <input
                type="text"
                value={testResults[fieldKey] || ""}
                onChange={(e) => handleTestResultChange(fieldKey, e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-white text-black placeholder-gray-500 
                          dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 
                          border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                placeholder={`${tUI('rangePrefix', lang)} ${testReferenceValues[test] || tUI('enterResult', lang)}`}
              />
            </div>
          );
        })}
      </div>
    ))}

    <div className="mt-6 space-y-4">
      <button
        onClick={handleMedicalAnalysis}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? tUI("analyzing", lang) : tUI("analyzeTestResults", lang)}
      </button>
        {medicalSummary && (
  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded text-sm whitespace-pre-wrap mt-4 border border-blue-300 dark:border-blue-500">
    <strong className="block mb-2 text-blue-800 dark:text-blue-300">
      {tUI("medicalAnalysisSummary", lang)}:
    </strong>

    {isEditing ? (
      <>
        <textarea
          value={editedSummary}
          onChange={(e) => setEditedSummary(e.target.value)}
          className="w-full p-2 rounded bg-white dark:bg-gray-700 text-black dark:text-white border dark:border-gray-500"
          rows={6}
        />
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => { 
            setMedicalSummary(editedSummary);
            setStructuredOutput(undefined); // ❗ Kasujemy JSON bo nieaktualny
            setIsEditing(false);
            if (onUpdateMedical) onUpdateMedical(editedSummary);
          }}
            >
              💾 {tUI("save", lang)}
            </button>
          </div>
        </>
      ) : (
        <p>{medicalSummary}</p>
      )}
    </div>
  )}

<div className="mt-4 flex flex-col md:flex-row gap-3">
  <button
    type="button"
    onClick={() => {
      handleConfirmAnalysis();
      setIsConfirmed(true);
    }}
    disabled={!medicalSummary}
    className={`flex-1 px-4 py-2 rounded-md shadow-md font-semibold transition-colors ${
      isConfirmed
        ? "bg-green-100 text-green-800 cursor-default"
        : "bg-green-600 text-white hover:bg-green-700"
    }`}
  >
    ✅ {tUI(isConfirmed ? "analysisConfirmed" : "confirmAnalysis", lang)}
  </button>

  <button
    onClick={() => {
      handleEditAnalysis();
      setIsConfirmed(false); // 👈 Cofnij stan zatwierdzenia po edycji
    }}
    className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-md shadow-md hover:bg-yellow-500 transition-colors"
  >
    ✏️ {tUI("editAnalysis", lang)}
  </button>

  {onDeleteMedical && (
    <button
       onClick={() => {
      setMedicalSummary(undefined);
      setStructuredOutput(undefined);
      setSelectedGroups([]);
      setSelectedConditions([]);
      setTestResults({});
      onDeleteMedical();
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }}

      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors"
    >
      🗑️ {tUI("deleteMedicalData", lang)}
    </button>
  )}
</div>
</div>
</PanelCard>
);
};

export default MedicalForm;

