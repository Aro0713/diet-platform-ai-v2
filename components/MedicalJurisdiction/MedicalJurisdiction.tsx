import React from 'react';
import { LangKey } from '@/utils/i18n';
import { jurisdictionLabels, licensePlaceholders } from '@/components/utils/translations/medical/jurisdiction';

interface Props {
  lang: LangKey;
  jurisdiction: string;
  licenseNumber: string;
  onJurisdictionChange: (value: string) => void;
  onLicenseChange: (value: string) => void;
}

const jurisdictions = [
  'pl', 'de', 'fr', 'es', 'gb', 'us', 'ca', 'in', 'za', 'cn', 'ar', 'ua', 'ru', 'il', 'other'
];

export default function MedicalJurisdiction({
  lang,
  jurisdiction,
  licenseNumber,
  onJurisdictionChange,
  onLicenseChange
}: Props) {
  const getLabel = (code: string) =>
    jurisdictionLabels[code]?.[lang] ?? code;

  const getPlaceholder = (code: string) =>
    licensePlaceholders[code]?.[lang] ?? '';

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">
          {jurisdictionLabels['select'][lang]}
        </label>
        <select
          value={jurisdiction}
          onChange={(e) => onJurisdictionChange(e.target.value)}
          className="w-full border px-3 py-2"
        >
          <option value="">{jurisdictionLabels['select'][lang]}</option>
          {jurisdictions.map((code) => (
            <option key={code} value={code}>
              {getLabel(code)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-semibold mb-1">
          {jurisdictionLabels['license'][lang]}
        </label>
        <input
          type="text"
          value={licenseNumber}
          onChange={(e) => onLicenseChange(e.target.value)}
          className="w-full border px-3 py-2"
          placeholder={getPlaceholder(jurisdiction)}
        />
      </div>
    </div>
  );
}
