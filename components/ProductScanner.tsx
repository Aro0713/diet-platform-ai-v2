// components/ProductScanner.tsx
import React, { useState } from 'react';
import { tUI, type LangKey } from '@/utils/i18n';

interface ProductScannerProps {
  lang: LangKey;
  patient: any; // Typ danych pacjenta – warunki, alergie itd.
}

export default function ProductScanner({ lang, patient }: ProductScannerProps) {
  const [barcode, setBarcode] = useState('');
  const [productText, setProductText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyzeBarcode = async () => {
    if (!barcode) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyzeagent-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, lang, patient })
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      console.error('❌ Error analyzing barcode:', err);
    } finally {
      setLoading(false);
    }
  };

const handleAnalyzeText = async () => {
  if (!productText) return;
  setLoading(true);
  try {
    const res = await fetch('/api/analyzeagent-product-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: productText, lang, patient })
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (!res.ok) {
      const errorMsg = isJson ? (await res.json()).error : await res.text();
      throw new Error(errorMsg || 'Unexpected error');
    }

    const json = await res.json();
    setResult(json);
  } catch (err: any) {
    console.error('❌ Error analyzing text:', err.message);
    setResult({ error: err.message });
  } finally {
    setLoading(false);
  }
};

  const handleAnalyzeImage = async () => {
  if (!imageFile) return;
  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('lang', lang);
    formData.append('patient', JSON.stringify(patient));

    const res = await fetch('/api/analyzeagent-product-photo', {
      method: 'POST',
      body: formData
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    if (!res.ok) {
      const errorMsg = isJson ? (await res.json()).error : await res.text();
      throw new Error(errorMsg || 'Unexpected error');
    }

    const json = await res.json();
    setResult(json);
  } catch (err: any) {
    console.error('❌ Error analyzing image:', err.message);
    setResult({ error: err.message });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-slate-900 rounded-xl p-6 shadow-lg text-white max-w-3xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">📦 {tUI('productScannerTitle', lang)}</h2>

      {/* Kod kreskowy */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">🔢 {tUI('enterBarcode', lang)}</label>
        <input
          type="text"
          placeholder="5901234123457"
          className="w-full p-2 rounded-md text-black placeholder-gray-400"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <button
          onClick={handleAnalyzeBarcode}
          className="mt-2 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 font-medium"
        >
          🤖 {tUI('analyzeWithAI', lang)}
        </button>
      </div>

      {/* Zdjęcie etykiety */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">📸 {tUI('uploadLabelPhoto', lang)}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={handleAnalyzeImage}
          className="mt-2 px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700 font-medium"
        >
          🧠 {tUI('analyzePhoto', lang)}
        </button>
      </div>

      {/* Opis słowny */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">📝 {tUI('writeProductText', lang)}</label>
        <input
          type="text"
          placeholder="np. jogurt naturalny 2% bez laktozy"
          className="w-full p-2 rounded-md text-black placeholder-gray-400"
          value={productText}
          onChange={(e) => setProductText(e.target.value)}
        />
        <button
          onClick={handleAnalyzeText}
          className="mt-2 px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 font-medium"
        >
          🧪 {tUI('analyzeTextDescription', lang)}
        </button>
      </div>
  
       {result && (
       <pre className="bg-black text-white p-4 mt-4 rounded-md overflow-x-auto whitespace-pre-wrap">
       {typeof result === 'string'
      ? result
      : JSON.stringify(result, null, 2)}
     </pre>
      )}

      {loading && <p className="text-yellow-400">⏳ Trwa analiza...</p>}
      {result && (
        <pre className="bg-black text-white p-4 mt-4 rounded-md overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}