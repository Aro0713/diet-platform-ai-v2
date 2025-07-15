import React from 'react';

export default function ProgressOverlay({
  message,
  percent,
}: {
  message: string;
  percent: number;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 z-[9999] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg text-center w-[90%] max-w-[400px]">
        <p className="text-xl font-semibold mb-4">{message}</p>
        <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-emerald-600 h-4 transition-all"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{percent}%</p>
      </div>
    </div>
  );
}
