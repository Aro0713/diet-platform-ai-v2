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
    { id: 'data', label: tUI('patientData', lang), icon: NotebookPen },
    { id: 'medical', label: tUI('medicalAnalysis', lang), icon: Stethoscope },
    { id: 'interview', label: tUI('interviewTitle', lang), icon: FileText },
    { id: 'calculator', label: tUI('patientInNumbers', lang), icon: Calculator },
    { id: 'diet', label: tUI('dietPlan', lang), icon: ChefHat },
    { id: 'scan', label: tUI('scanProduct', lang), icon: ScanLine }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mt-12 px-4">
      {icons.map(({ id, label, icon: Icon }) => {
        const isActive = activeId === id;
        return (
          <button
            key={id}
            onClick={() => {
              setActiveId(id);
              onSelect(id);
            }}
            className={`ios-icon flex flex-col items-center justify-center p-4 rounded-2xl
              transition-transform duration-300 shadow-md hover:scale-105
              ${isActive ? 'animate-pulse-glow scale-105 ring-2 ring-green-400' : ''}`}
          >
            <Icon
              size={42}
              className={`mb-2 transition-transform ${isActive ? 'rotate-[8deg] text-emerald-400' : 'text-white/80'}`}
            />
            <span className="text-xs font-medium text-center">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
