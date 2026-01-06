import React from 'react';
import { tUI, type LangKey } from '@/utils/i18n';
import {
  NotebookPen,
  Stethoscope,
  FileText,
  Calculator,
  ChefHat,
  CheckCircle,
  XCircle,
  Ban
} from 'lucide-react';

interface PatientIconGridProps {
  lang: LangKey;
  onSelect: (section: string) => void;
  selected: string | null;
  hasPaid: boolean;
  isTrialActive: boolean;
}

export const PatientIconGrid: React.FC<PatientIconGridProps> = ({
  lang,
  onSelect,
  selected,
  hasPaid,
  isTrialActive
}) => {
  const openCancelTrial = async () => {
    try {
      const uid = localStorage.getItem('currentUserID');
      if (!uid) return;

      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, returnUrl: window.location.href }),
      });

      const data = await res.json();
      const url = data?.url;
      if (url) window.location.href = url;
    } catch (e) {
      console.error('❌ Cannot open customer portal:', e);
      alert(tUI('paymentInitError', lang));
    }
  };

  const icons = [
    {
      id: 'data',
      label: tUI('registrationLabel', lang),
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
      label: tUI('askLook', lang),
      icon: () => (
        <img
          src="/Look.png"
          alt="Look avatar"
          className="w-[42px] h-[42px] rounded-full border-2 border-white shadow"
        />
      ),
      color: '',
      ring: 'ring-purple-300'
    },

    ...(isTrialActive
      ? [{
          id: 'cancel_trial',
          label: tUI('cancelTrial', lang),
          icon: Ban,
          color: 'text-rose-200',
          ring: 'ring-rose-300'
        }]
      : []),

    {
      id: 'status',
      label: hasPaid ? tUI('paymentConfirmed', lang) : tUI('paymentPending', lang),
      icon: hasPaid ? CheckCircle : XCircle,
      color: hasPaid ? 'text-green-500' : 'text-red-500',
      ring: hasPaid ? 'ring-green-300' : 'ring-red-300'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-6 mt-12 px-4">
      {icons.map(({ id, label, icon: Icon, color, ring }: any) => {
        const isActive = selected === id;

        // allow: data + status always; allow cancel_trial even if hasPaid is false
        const isDisabled = !hasPaid && id !== 'data' && id !== 'status' && id !== 'cancel_trial';

        return (
          <button
            key={id}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;

              if (id === 'scanner') {
                onSelect('scanner');
                setTimeout(() => {
                  document.getElementById('look-assistant')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
                return;
              }

              if (id === 'cancel_trial') {
                openCancelTrial();
                return;
              }

              if (id !== 'status') {
                onSelect(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl
              transition-all duration-300 shadow-md
              ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'}
              bg-white/20 dark:bg-white/10
              ${isActive ? `scale-105 animate-pulse ring-2 ${ring}` : ''}`}
            aria-label={label}
            title={label}
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
