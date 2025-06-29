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
    { id: 'data', label: `📒 ${tUI('patientData', lang)}`, icon: NotebookPen, color: 'text-red-500', bg: 'bg-red-100/80 dark:bg-red-600/30' },
    { id: 'medical', label: `🩺 ${tUI('medicalAnalysis', lang)}`, icon: Stethoscope, color: 'text-orange-500', bg: 'bg-orange-100/80 dark:bg-orange-500/30' },
    { id: 'interview', label: `🧠 ${tUI('interviewTitle', lang)}`, icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-100/80 dark:bg-yellow-500/30' },
    { id: 'calculator', label: `📊 ${tUI('patientInNumbers', lang)}`, icon: Calculator, color: 'text-green-600', bg: 'bg-green-100/80 dark:bg-green-600/30' },
    { id: 'diet', label: `👨‍🍳 ${tUI('dietPlan', lang)}`, icon: ChefHat, color: 'text-blue-600', bg: 'bg-blue-100/80 dark:bg-blue-600/30' },
    { id: 'scan', label: `🔍 ${tUI('scanProduct', lang)}`, icon: ScanLine, color: 'text-purple-600', bg: 'bg-purple-100/80 dark:bg-purple-700/30' }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mt-12 px-4">
      {icons.map(({ id, label, icon: Icon, color, bg }) => (
        <button
          key={id}
          onClick={() => {
            setActiveId(id);
            onSelect(id);
          }}
          className={`flex flex-col items-center justify-center p-5 ${bg}
            rounded-2xl shadow-md transition-all duration-300 transform
            hover:scale-105 hover:shadow-2xl active:scale-95
            ${activeId === id ? 'ring-2 ring-offset-2 ring-white dark:ring-blue-400 scale-105 animate-pulse' : ''}`}
        >
          <Icon
            size={48}
            className={`mb-2 transition-all duration-300 ${color} ${activeId === id ? 'rotate-[8deg]' : ''}`}
          />
          <span className="text-xs font-medium text-center text-black dark:text-white">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};
