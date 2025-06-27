import React from 'react';
import { tUI, type LangKey } from '@/utils/i18n';
import {
  NotebookPen,
  Stethoscope,
  FileText,
  Calculator,
  ScanLine,
  ChefHat
} from 'lucide-react';

interface PatientIconGridProps {
  lang: LangKey;
  onSelect: (section: string) => void;
}

export const PatientIconGrid: React.FC<PatientIconGridProps> = ({ lang, onSelect }) => {
  const icons = [
    { id: 'data', label: tUI('patientData', lang), icon: NotebookPen },
    { id: 'medical', label: tUI('medicalAnalysis', lang), icon: Stethoscope },
    { id: 'interview', label: tUI('interviewTitle', lang), icon: FileText },
    { id: 'calculator', label: tUI('patientInNumbers', lang), icon: Calculator },
    { id: 'diet', label: tUI('dietPlan', lang), icon: ChefHat },
    { id: 'scan', label: tUI('scanProduct', lang), icon: ScanLine }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-20">
      {icons.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:scale-105 transition-all"
        >
          <Icon size={32} className="text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};
