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
      className="mt-8 px-8 py-5 text-2xl font-extrabold text-white rounded-xl transition-transform hover:scale-105 animate-pulse neon-glow"
    >
      {label}
      <style jsx>{`
        .neon-glow {
          background-color: #ff00cc;
          border: 3px solid #fff;
          box-shadow:
            0 0 8px #ff00cc,
            0 0 20px #ff00cc,
            0 0 40px #ff00cc,
            0 0 80px #ff00cc;
          text-shadow:
            0 0 5px #fff,
            0 0 10px #fff,
            0 0 20px #ff00cc;
        }
      `}</style>
    </button>
  );
}
