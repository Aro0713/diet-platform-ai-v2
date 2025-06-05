import { useState } from 'react';

interface Props {
  onPaymentSuccess: () => void;
}

export default function GuestPayWall({ onPaymentSuccess }: Props) {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const simulatePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setPaid(true);
      onPaymentSuccess();
    }, 2000);
  };

  if (paid) {
    return (
      <div className="p-4 bg-green-100 rounded text-green-800 font-semibold">
        ✅ Płatność została przyjęta. Możesz teraz wygenerować dietę.
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border rounded shadow text-center">
      <h2 className="text-xl font-bold mb-4">Dieta bez rejestracji</h2>
      <p className="mb-4 text-gray-700">
        Koszt indywidualnej diety na 7 dni: <strong>150 zł brutto</strong>
      </p>
      <button
        onClick={simulatePayment}
        disabled={loading}
        className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Przetwarzanie...' : 'Opłać i przejdź dalej'}
      </button>
    </div>
  );
}
