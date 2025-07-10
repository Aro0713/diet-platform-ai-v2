import React from "react";

export default function NeonNextArrow({
  onClick,
  label = "Dalej →"
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-4 px-3 py-2 text-base font-semibold text-white rounded-md transition-transform hover:scale-105 animate-pulse neon-blue"
    >
      {label}
      <style jsx>{`
        @keyframes neonColorShift {
          0% {
            box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
            background-color: #2563eb;
          }
          50% {
            box-shadow: 0 0 6px #60a5fa, 0 0 12px #60a5fa;
            background-color: #3b82f6;
          }
          100% {
            box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
            background-color: #2563eb;
          }
        }

        .neon-blue {
          animation: neonColorShift 2s infinite alternate;
          border: 1px solid #fff;
          text-shadow: 0 0 4px #ffffff, 0 0 6px #3b82f6;
        }
      `}</style>
    </button>
  );
}
