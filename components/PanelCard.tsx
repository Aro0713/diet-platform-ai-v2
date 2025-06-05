import React from 'react';

interface PanelCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const PanelCard: React.FC<PanelCardProps> = ({ children, title, className = '' }) => (
  <div
  className={`relative z-30 overflow-visible w-full bg-white/30 dark:bg-gray-900/30 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-2xl p-10 shadow-xl transition-colors ${className}`}
>
    {title && (
      <h2 className="text-lg font-semibold tracking-wide mb-4 text-gray-800 dark:text-white">
        {title}
      </h2>
    )}
    <div className="text-justify space-y-4">{children}</div>
  </div>
);

export default PanelCard;
