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
      className="mt-6 px-6 py-4 text-xl font-bold text-white rounded-lg transition-transform hover:scale-105 animate-pulse neon-glow"
    >
      {label}
      <style jsx>{`
        .neon-glow {
          background-color: #ff00cc;
          border: 2px solid #fff;
          box-shadow:
            0 0 6px #ff00cc,
            0 0 16px #ff00cc,
            0 0 32px #ff00cc;
          text-shadow:
            0 0 4px #fff,
            0 0 8px #fff,
            0 0 16px #ff00cc;
        }
      `}</style>
    </button>
  );
}
