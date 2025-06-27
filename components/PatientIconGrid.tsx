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
  { id: 'data', label: tUI('patientData', lang), icon: NotebookPen, bg: 'bg-blue-500/30' },
  { id: 'medical', label: tUI('medicalAnalysis', lang), icon: Stethoscope, bg: 'bg-rose-500/30' },
  { id: 'interview', label: tUI('interviewTitle', lang), icon: FileText, bg: 'bg-amber-500/30' },
  { id: 'calculator', label: tUI('patientInNumbers', lang), icon: Calculator, bg: 'bg-emerald-500/30' },
  { id: 'diet', label: tUI('dietPlan', lang), icon: ChefHat, bg: 'bg-purple-600/30' },
  { id: 'scan', label: tUI('scanProduct', lang), icon: ScanLine, bg: 'bg-cyan-500/30' }
];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mt-20 px-4">
      {icons.map(({ id, label, icon: Icon, bg }) => (
        <button
          key={id}
          onClick={() => {
            setActiveId(id);
            onSelect(id);
          }}
          className={`
            flex flex-col items-center justify-center p-6
            ${bg} rounded-2xl shadow-inner transition-all transform
            hover:scale-105 active:rotate-[360deg] duration-500
            ${activeId === id ? 'ring-2 ring-blue-500 scale-105' : ''}
          `}
        >
          <Icon size={48} className="mb-3 text-black dark:text-white" />
          <span className="text-sm font-semibold text-center text-black dark:text-white">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};
