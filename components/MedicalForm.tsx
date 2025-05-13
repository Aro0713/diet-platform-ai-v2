"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { diseaseGroups } from "./diseaseGroups";
import { testsByCondition } from "@/types/testsByCondition";
import { testReferenceValues } from "./testReferenceValues";
import { LangKey } from '../utils/i18n';
import { translationsUI } from '../utils/translationsUI';

interface MedicalFormProps {
  onChange: (data: {
    selectedGroups: string[];
    selectedConditions: string[];
    testResults: { [testName: string]: string };
  }) => void;
  lang: LangKey;
}

const MedicalForm: React.FC<MedicalFormProps> = ({ onChange, lang }) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [availableConditions, setAvailableConditions] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});

  const t = (key: keyof typeof translationsUI): string =>
    translationsUI[key]?.[lang] || translationsUI[key]?.pl || key;

  const groupOptions = Object.keys(diseaseGroups).map(group => ({
    value: group,
    label: group,
  }));

  const conditionOptions = availableConditions.map(cond => ({
    value: cond,
    label: cond,
  }));

  useEffect(() => {
    const conditions: string[] = [];
    selectedGroups.forEach((group) => {
      if (diseaseGroups[group]) {
        conditions.push(...diseaseGroups[group]);
      }
    });
    setAvailableConditions(conditions);
    setSelectedConditions([]);
    setTestResults({});
  }, [selectedGroups]);

  useEffect(() => {
    onChange({
      selectedGroups,
      selectedConditions,
      testResults,
    });
  }, [selectedGroups, selectedConditions, testResults, onChange]);

  const handleTestResultChange = (testName: string, value: string) => {
    setTestResults((prev) => ({
      ...prev,
      [testName]: value,
    }));
  };

  return (
    <div className="my-8 p-6 border rounded bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-6">{t('medicalData')}</h2>

      {/* Grupy chorób */}
      <label className="block mb-2 font-semibold">{t('selectDiseaseGroups')}</label>
      <Select
        isMulti
        options={groupOptions}
        value={groupOptions.filter(opt => selectedGroups.includes(opt.value))}
        onChange={(selected) => setSelectedGroups(selected.map((s) => s.value))}
        className="mb-6"
        placeholder={t('selectDiseaseGroups')}
        menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
      />

      {/* Choroby */}
      {availableConditions.length > 0 && (
        <>
          <label className="block mb-2 font-semibold">{t('selectConditions')}</label>
          <Select
            isMulti
            options={conditionOptions}
            value={conditionOptions.filter(opt => selectedConditions.includes(opt.value))}
            onChange={(selected) => setSelectedConditions(selected.map((s) => s.value))}
            className="mb-6"
            placeholder={t('selectConditions')}
            menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
          />
        </>
      )}

      {/* Wyniki badań */}
      {selectedConditions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">{t('testResults')}</h3>
          {selectedConditions.map((condition) => (
            <div key={condition} className="mb-6">
              <h4 className="font-semibold mb-2">{condition}</h4>
              {(testsByCondition[condition] || ["Opis choroby"]).map((test: string) => (
                <div key={test} className="mb-3">
                  <label className="block text-sm font-semibold mb-1">{test}</label>
                  <input
                    type="text"
                    value={testResults[test] || ""}
                    onChange={(e) => handleTestResultChange(test, e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder={`Zakres: ${testReferenceValues[test] || "wpisz wynik"}`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalForm;