import React, { useState } from 'react';
import { Meal } from '@/types';
import { LangKey } from '@/utils/i18n';
import { tUI } from '@/utils/i18n';

interface Props {
  patient: {
    conditions: string[];
    allergies: string;
    dietModel: string;
  };
  lang: LangKey;
}

export default function ProductScanner({ patient, lang }: Props) {
  const [barcode, setBarcode] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = async () => {
    if (!barcode) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, patient, lang })
      });
      const json = await res.json();
      setAnalysis(json);
    } catch (err) {
      console.error('Error analyzing product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300">
        {tUI('productScannerTitle', lang)}
      </h2>

      <div className="flex items-center gap-4">
        <input
          type="text"
          className="border rounded p-2 w-full max-w-md"
          placeholder={tUI('enterBarcode', lang)}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <button
          onClick={handleScan}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          disabled={isLoading || !barcode}
        >
          {isLoading ? tUI('analyzing', lang) : tUI('analyzeWithAI', lang)}
        </button>
      </div>

      {analysis && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow space-y-4">
          <h3 className="text-xl font-semibold">{analysis.productName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {tUI('productSource', lang)}: {analysis.source}
          </p>
          <div>
            <strong>{tUI('ingredients', lang)}:</strong>
            <p>{analysis.ingredients}</p>
          </div>
          <div>
            <strong>{tUI('aiVerdict', lang)}:</strong>
            <p>{analysis.verdict}</p>
          </div>

          {analysis.alternatives && analysis.alternatives.length > 0 && (
            <div className="mt-4">
              <h4 className="font-bold">{tUI('alternativeProducts', lang)}</h4>
              <ul className="list-disc list-inside">
                {analysis.alternatives.map((alt: any, i: number) => (
                  <li key={i}>
                    <span className="font-medium">{alt.name}</span> – {alt.price} ({alt.shop})
                    <br />{alt.comment}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.pricing && (
            <div className="mt-4">
              <h4 className="font-bold">{tUI('priceComparison', lang)}</h4>
              <ul className="list-disc list-inside">
                {analysis.pricing.map((entry: any, i: number) => (
                  <li key={i}>
                    <strong>{entry.store}</strong>: {entry.price} – {entry.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
