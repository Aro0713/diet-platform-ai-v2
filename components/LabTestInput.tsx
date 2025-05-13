import React, { useState } from 'react';
import { translationsUI } from '../utils/translationsUI'; 
import { LangKey } from '../utils/i18n';

export interface LabTest {
  name: string;
  unit: string;
  normalRange: string;
}

interface Props {
  test: LabTest;
  lang: LangKey;
  onChange?: (value: number | null) => void;
}

export default function LabTestInput({ test, lang, onChange }: Props) {
  const [value, setValue] = useState<string>('');

  const parsedValue = parseFloat(value.replace(',', '.'));

  // Wbudowana funkcja sprawdzająca zakres (bez zewnętrznego importu)
  const isInRange = (val: number, range: string): boolean | null => {
    const match = range.match(/^(\d+(?:[.,]\d+)?)\s*[\u2013\u2014\-]\s*(\d+(?:[.,]\d+)?)/);
    if (!match) return null;
    const min = parseFloat(match[1].replace(',', '.'));
    const max = parseFloat(match[2].replace(',', '.'));
    return val >= min && val <= max;
  };

  const result = isInRange(parsedValue, test.normalRange);

  const t = (key: keyof typeof translationsUI) =>
    translationsUI[key]?.[lang] ?? translationsUI[key]?.pl ?? key;

  let statusClass = 'text-gray-600';
  let statusIcon = '❔';

  if (value && !isNaN(parsedValue)) {
    if (result === true) {
      statusClass = 'text-green-600';
      statusIcon = '✅';
    } else if (result === false) {
      statusClass = 'text-red-600';
      statusIcon = '❌';
    } else {
      statusClass = 'text-yellow-600';
      statusIcon = '⚠️';
    }
  }

  return (
    <div className="mb-4 space-y-1">
      <label className="block font-semibold">
        {test.name}{' '}
        <span className="text-sm text-gray-500">({test.unit})</span>
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (onChange) {
            const num = parseFloat(e.target.value.replace(',', '.'));
            onChange(isNaN(num) ? null : num);
          }
        }}
        className="w-full border px-2 py-1 rounded"
        placeholder={`Zakres: ${test.normalRange}`}
      />

      <div className={`text-sm font-medium ${statusClass}`}>
        {value && !isNaN(parsedValue) && (
          <>
            {statusIcon}{' '}
            {result === true
              ? t('normalResult')
              : result === false
              ? t('abnormalResult')
              : t('unknownRange')}
          </>
        )}
      </div>
    </div>
  );
}
