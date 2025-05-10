import React, { useState } from 'react';

interface Props {
  patient: {
    age: number;
    sex: string;
    weight: number;
    height: number;
    allergies?: string;
    conditions?: string[];
  };
}

const productDatabase: Record<string, { name: string; ingredients: string[] }> = {
  '5901234567890': {
    name: 'Serek Danio truskawkowy',
    ingredients: ['cukier', 'mleko', 'aromat', 'białka mleka']
  },
  '5900000000001': {
    name: 'Pieczywo chrupkie żytnie',
    ingredients: ['żyto', 'błonnik', 'sól']
  },
  '5900000000002': {
    name: 'Baton proteinowy czekoladowy',
    ingredients: ['białko mleka', 'czekolada', 'cukier', 'syrop glukozowy']
  },
  '5900000000003': {
    name: 'Jogurt naturalny 2%',
    ingredients: ['mleko', 'kultury bakterii']
  }
};

export default function ProductScanner({ patient }: Props) {
  const [ean, setEan] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const evaluateProduct = async (eanCode: string) => {
    const product = productDatabase[eanCode];
    if (!product) {
      setResult('🔍 Produkt nie został znaleziony w bazie.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/evaluate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient, product })
      });

      const data = await res.json();
      setResult(data.result || '⚠️ Nie udało się uzyskać odpowiedzi.');
    } catch (err) {
      console.error(err);
      setResult('❌ Wystąpił błąd podczas analizy produktu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow mt-8">
      <h2 className="text-lg font-bold mb-4">🛒 Skaner produktów (kod EAN)</h2>

      <input
        type="text"
        placeholder="Wpisz lub zeskanuj kod EAN"
        value={ean}
        onChange={(e) => setEan(e.target.value)}
        className="w-full border px-2 py-1 mb-4"
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={() => evaluateProduct(ean)}
        disabled={loading || !ean}
      >
        {loading ? 'Analizuję...' : 'Sprawdź produkt'}
      </button>

      {result && (
        <p className="mt-4 text-md font-semibold">{result}</p>
      )}
    </div>
  );
}
