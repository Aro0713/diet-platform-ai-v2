import React, { useState } from 'react';
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
  const [activeId, setActiveId] = useState<string | null>(null);

  const icons = [
    { id: 'data', label: tUI('patientData', lang), icon: NotebookPen, bg: 'bg-white/10', color: 'text-red-600' },
    { id: 'medical', label: tUI('medicalAnalysis', lang), icon: Stethoscope, bg: 'bg-white/10', color: 'text-orange-500' },
    { id: 'interview', label: tUI('interviewTitle', lang), icon: FileText, bg: 'bg-white/10', color: 'text-yellow-500' },
    { id: 'calculator', label: tUI('patientInNumbers', lang), icon: Calculator, bg: 'bg-white/10', color: 'text-green-600' },
    { id: 'diet', label: tUI('dietPlan', lang), icon: ChefHat, bg: 'bg-white/10', color: 'text-blue-600' },
    { id: 'scan', label: tUI('scanProduct', lang), icon: ScanLine, bg: 'bg-white/10', color: 'text-purple-700' }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mt-20 px-4">
      {icons.map(({ id, label, icon: Icon, bg, color }) => (
        <button
          key={id}
          onClick={() => {
            setActiveId(id);
            onSelect(id);
          }}
          className={`flex flex-col items-center justify-center p-6
                      ${bg} rounded-2xl shadow-md transition-all duration-300 transform
                      hover:shadow-xl hover:brightness-110 hover:-translate-y-1 active:scale-95
                      ${activeId === id ? 'ring-2 ring-blue-500 scale-105' : ''}`}
        >
          <Icon
            size={48}
            className={`mb-3 transition-transform ${activeId === id ? 'animate-pulse' : ''} ${color}`}
          />
          <span className="text-sm font-semibold text-center text-white dark:text-white">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};
