import React, { useState } from 'react';
import { tUI, type LangKey } from '@/utils/i18n';
import ProductAnswerCard from '@/components/ProductAnswerCard';
import { useBasket } from '@/hooks/useBasket';

interface ProductAssistantPanelProps {
  lang: LangKey;
  patient: any;
}

export default function ProductAssistantPanel({ lang, patient }: ProductAssistantPanelProps) {
  const [question, setQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addProduct } = useBasket(); // ✅ integracja z koszykiem

  const handleAskAssistant = async () => {
    if (!question.trim()) {
      setError('Zadaj pytanie związane z dietą lub zakupami.');
      return;
    }

    const formData = new FormData();
    formData.append('question', question);
    formData.append('lang', lang);
    formData.append('patient', JSON.stringify(patient));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ask-product-assistant', {
        method: 'POST',
        body: formData
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('❌ JSON parsing error:', jsonErr);
        setError('Serwer zwrócił pustą lub niepoprawną odpowiedź.');
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Coś poszło nie tak');
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setError(err.message || 'Błąd połączenia z AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-md mt-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🧠 {tUI('productScannerTitle', lang)}</h2>

      <p className="text-sm text-gray-300 mb-4">
        {tUI('productAssistantIntro', lang)}
      </p>

      {/* Pole tekstowe */}
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Zadaj pytanie dotyczące produktów lub diety..."
        className="w-full p-2 rounded-md text-black placeholder-gray-400 mb-3"
      />

      {/* Pole zdjęcia */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          setImageFile(selected instanceof File ? selected : null);
        }}
        className="mb-3"
      />

      <button
        onClick={handleAskAssistant}
        className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 font-medium"
        disabled={loading}
      >
        {loading ? '⏳ Myślę...' : `🔍 ${tUI('askDietAssistant', lang)}`}
      </button>

      {error && (
        <p className="text-red-400 mt-4">{error}</p>
      )}

      {response && (
        <ProductAnswerCard
          response={response}
          lang={lang}
          onAddToBasket={() => {
            addProduct({
              productName: response.productName,
              shop: response.cheapestShop?.name || 'Nieznany sklep',
              price: response.cheapestShop?.price || '—',
              emoji: '🧺',
              whyBetter: response.betterAlternative?.whyBetter || ''
            });
          }}
        />
      )}
    </div>
  );
}
