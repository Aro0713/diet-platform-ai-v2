import React from "react";
import { tUI, type LangKey } from "@/utils/i18n";
import { sem, type SemanticTone } from "@/utils/semanticUI";
import {
  NotebookPen,
  Stethoscope,
  FileText,
  Calculator,
  ChefHat,
  CheckCircle,
  XCircle,
  Ban,
  Bot,
} from "lucide-react";

interface PatientIconGridProps {
  lang: LangKey;
  onSelect: (section: string) => void;
  selected: string | null;
  hasPaid: boolean;
  isTrialActive: boolean;
  form?: any; // ✅ ETAP 3/9
}

type IconLike =
  | React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  | (() => React.ReactNode);

function IconBadge({
  children,
  active,
  disabled,
  glow,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled: boolean;
  glow: string;
}) {
  return (
    <div
      className={[
        "relative flex items-center justify-center",
        "h-14 w-14 rounded-2xl",
        "border border-white/10",
        "bg-white/7 backdrop-blur-xl",
        "shadow-[0_18px_60px_rgba(0,0,0,.35)]",
        disabled ? "opacity-60" : "opacity-100",
        active ? "ring-1 ring-white/10 shadow-[0_0_0_1px_rgba(255,255,255,.06),0_26px_90px_rgba(0,0,0,.50)]" : "",
      ].join(" ")}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(120%_90%_at_20%_0%,rgba(255,255,255,.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]" />

      {active && (
        <div
          className="pointer-events-none absolute -inset-6 rounded-[28px] blur-2xl opacity-70"
          style={{ background: glow }}
        />
      )}

      <div className="relative">{children}</div>
    </div>
  );
}

export const PatientIconGrid: React.FC<PatientIconGridProps> = ({
  lang,
  onSelect,
  selected,
  hasPaid,
  isTrialActive,
  form, // ✅ ETAP 3/9
}) => {
  const openCancelTrial = async () => {
    try {
      const uid = localStorage.getItem("currentUserID");
      if (!uid) return;

      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, returnUrl: window.location.href }),
      });

      const data = await res.json();
      const url = data?.url;
      if (url) window.location.href = url;
    } catch (e) {
      console.error("❌ Cannot open customer portal:", e);
      alert(tUI("paymentInitError", lang));
    }
  };

  // ✅ ETAP 3/9 — widoczność ikony robota (tylko gdy pacjent ma zadeklarowane urządzenie)
  const showRobot =
    Boolean(hasPaid) &&
    Boolean(form?.has_kitchen_robot) &&
    Boolean(String(form?.kitchen_robot_model || "").trim()) &&
    Boolean(String(form?.kitchen_robot_serial || "").trim());

  const icons: Array<{
  id: string;
  label: string;
  icon: any;
  tone: SemanticTone;
}> = [
  { id: "data", label: tUI("registrationLabel", lang), icon: NotebookPen, tone: "danger" as const },
  { id: "medical", label: tUI("medicalAnalysis", lang), icon: Stethoscope, tone: "warning" as const },
  { id: "interview", label: tUI("interviewTitle", lang), icon: FileText, tone: "warning" as const },
  { id: "calculator", label: tUI("patientInNumbers", lang), icon: Calculator, tone: "success" as const },
  { id: "diet", label: tUI("dietPlan", lang), icon: ChefHat, tone: "brand" as const },
  {
    id: "scanner",
    label: tUI("askLook", lang),
    tone: "violet" as const,
    icon: () => (
      <img src="/Look.png" alt="Look avatar" className="h-10 w-10 rounded-xl object-cover" />
    ),
  },

  ...(showRobot
    ? [{ id: "robot", label: tUI("kitchenRobot.panelLabel", lang), icon: Bot, tone: "cyan" as const }]
    : []),

  ...(isTrialActive
    ? [{ id: "cancel_trial", label: tUI("cancelTrial", lang), icon: Ban, tone: "danger" as const }]
    : []),

  {
    id: "status",
    label: hasPaid ? tUI("paymentConfirmed", lang) : tUI("paymentPending", lang),
    icon: hasPaid ? CheckCircle : XCircle,
    tone: (hasPaid ? "success" : "danger") as SemanticTone,
  },
];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-6 mt-12 px-4">
      {icons.map(({ id, label, icon: Icon, tone }) => {
        const isActive = selected === id;

        // allow: data + status always; allow cancel_trial even if hasPaid is false
        const isDisabled = !hasPaid && id !== "data" && id !== "status" && id !== "cancel_trial";

        const { icon: iconColor, ring, glow } = sem(tone);

        return (
          <button
            key={id}
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;

              if (id === "scanner") {
                onSelect("scanner");
                setTimeout(() => {
                  document.getElementById("look-assistant")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
                return;
              }

              if (id === "cancel_trial") {
                openCancelTrial();
                return;
              }

              if (id !== "status") {
                onSelect(id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className={[
              "group flex flex-col items-center justify-center p-4 rounded-3xl",
              "transition-all duration-300",
              "border border-white/10 bg-white/6 backdrop-blur-2xl",
              "shadow-[0_18px_60px_rgba(0,0,0,.30)]",
              isDisabled ? "opacity-30 cursor-not-allowed" : "hover:translate-y-[-2px] hover:bg-white/8",
              isActive ? `ring-2 ${ring} shadow-[0_0_0_1px_rgba(255,255,255,.06),0_26px_90px_rgba(0,0,0,.50)]` : "",
            ].join(" ")}
            aria-label={label}
            title={label}
          >
            <IconBadge active={isActive} disabled={isDisabled} glow={glow}>
              {typeof Icon === "function" && Icon.length !== 0 ? (
                <Icon
                  size={30}
                  strokeWidth={1.6}
                  className={[
                    "transition-transform duration-300",
                    iconColor,
                    isActive ? "rotate-[6deg] scale-[1.02]" : "group-hover:scale-[1.04]",
                    "drop-shadow-[0_10px_24px_rgba(0,0,0,.35)]",
                  ].join(" ")}
                />
              ) : (
                <div className="relative">
                  <div className="absolute -inset-2 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.18),transparent_60%)]" />
                  <div className="relative rounded-2xl border border-white/10 bg-white/8 p-1">
                    <Icon />
                  </div>
                </div>
              )}
            </IconBadge>

            <span className="mt-2 text-xs font-medium text-white/90 text-center">{label}</span>
          </button>
        );
      })}
    </div>
  );
};