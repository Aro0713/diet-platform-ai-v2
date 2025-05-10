import React from 'react';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  missingFields: string[];
}

export default function ConfirmationModal({ open, onConfirm, onCancel, missingFields }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded shadow-xl max-w-md w-full space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Brakujące dane</h2>
        <p className="text-gray-700">
          Nie uzupełniłeś: <strong>{missingFields.join(', ')}</strong>.<br />
          Czy mimo to mam przygotować dietę?
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Nie
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tak
          </button>
        </div>
      </div>
    </div>
  );
}
