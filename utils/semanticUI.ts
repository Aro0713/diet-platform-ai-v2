// utils/semanticUI.ts
export type SemanticTone =
  | "brand"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "violet"
  | "cyan";

export type SemanticStyle = {
  icon: string;   // text-...
  ring: string;   // ring-...
  glow: string;   // inline background for glow (optional use)
};

export const SEMANTIC_UI: Record<SemanticTone, SemanticStyle> = {
  // primary brand (icy blue)
  brand: {
    icon: "text-sky-200",
    ring: "ring-sky-300/40",
    glow:
      "radial-gradient(55% 55% at 25% 20%, rgba(56,189,248,.35), transparent 60%)," +
      "radial-gradient(50% 50% at 80% 30%, rgba(167,139,250,.18), transparent 60%)," +
      "radial-gradient(55% 55% at 55% 90%, rgba(16,185,129,.14), transparent 60%)",
  },

  info: {
    icon: "text-sky-200",
    ring: "ring-sky-300/40",
    glow:
      "radial-gradient(55% 55% at 25% 20%, rgba(56,189,248,.28), transparent 60%)," +
      "radial-gradient(55% 55% at 70% 75%, rgba(56,189,248,.14), transparent 60%)",
  },

  success: {
    icon: "text-emerald-200",
    ring: "ring-emerald-300/40",
    glow:
      "radial-gradient(55% 55% at 25% 20%, rgba(16,185,129,.28), transparent 60%)," +
      "radial-gradient(55% 55% at 70% 75%, rgba(16,185,129,.12), transparent 60%)",
  },

  warning: {
    icon: "text-amber-200",
    ring: "ring-amber-300/40",
    glow:
      "radial-gradient(55% 55% at 25% 20%, rgba(245,158,11,.25), transparent 60%)," +
      "radial-gradient(55% 55% at 70% 75%, rgba(245,158,11,.10), transparent 60%)",
  },

  danger: {
    icon: "text-rose-200",
    ring: "ring-rose-300/40",
    glow:
      "radial-gradient(55% 55% at 25% 20%, rgba(244,63,94,.25), transparent 60%)," +
      "radial-gradient(55% 55% at 70% 75%, rgba(244,63,94,.10), transparent 60%)",
  },

  violet: {
    icon: "text-fuchsia-200",
    ring: "ring-fuchsia-300/40",
    glow:
      "radial-gradient(55% 55% at 25% 20%, rgba(167,139,250,.25), transparent 60%)," +
      "radial-gradient(55% 55% at 70% 75%, rgba(251,113,133,.10), transparent 60%)",
  },

  cyan: {
    icon: "text-cyan-200",
    ring: "ring-cyan-300/40",
    glow:
      "radial-gradient(55% 55% at 25% 20%, rgba(34,211,238,.24), transparent 60%)," +
      "radial-gradient(55% 55% at 70% 75%, rgba(34,211,238,.10), transparent 60%)",
  },
};

export function sem(tone: SemanticTone): SemanticStyle {
  return SEMANTIC_UI[tone] ?? SEMANTIC_UI.brand;
}