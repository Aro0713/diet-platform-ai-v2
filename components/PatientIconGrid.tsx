import React, { useState, useEffect } from 'react';
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
  selected: string | null;
}

export const PatientIconGrid: React.FC<PatientIconGridProps> = ({ lang, onSelect, selected }) => {
  const icons = [
    {
      id: 'data',
      label: tUI('patientData', lang),
      icon: NotebookPen,
      color: 'text-red-500',
      ring: 'ring-red-300'
    },
    {
      id: 'medical',
      label: tUI('medicalAnalysis', lang),
      icon: Stethoscope,
      color: 'text-orange-500',
      ring: 'ring-orange-300'
    },
    {
      id: 'interview',
      label: tUI('interviewTitle', lang),
      icon: FileText,
      color: 'text-yellow-500',
      ring: 'ring-yellow-300'
    },
    {
      id: 'calculator',
      label: tUI('patientInNumbers', lang),
      icon: Calculator,
      color: 'text-green-500',
      ring: 'ring-green-300'
    },
    {
      id: 'diet',
      label: tUI('dietPlan', lang),
      icon: ChefHat,
      color: 'text-blue-500',
      ring: 'ring-blue-300'
    },
    {
      id: 'scanner',
      label: tUI('scanProduct', lang),
      icon: ScanLine,
      color: 'text-purple-500',
      ring: 'ring-purple-300'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mt-12 px-4">
      {icons.map(({ id, label, icon: Icon, color, ring }) => {
        const isActive = selected === id;
        return (
          <button
            key={id}
            onClick={() => {
              onSelect(id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl
              transition-all duration-300 shadow-md hover:scale-105 bg-white/20 dark:bg-white/10
              ${isActive ? `scale-105 animate-pulse ring-2 ${ring}` : ''}`}
          >
            <Icon
              size={42}
              className={`mb-2 transition-transform ${color} ${isActive ? 'rotate-[8deg]' : ''}`}
            />
            <span className="text-xs font-medium text-white dark:text-white text-center">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
