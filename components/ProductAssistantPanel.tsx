import React, { useState } from 'react';
import { tUI, type LangKey } from '@/utils/i18n';
import ProductAnswerCard from '@/components/ProductAnswerCard';
import { useBasket } from '@/hooks/useBasket';
import ShoppingListCard from '@/components/ShoppingListCard';

interface ProductAssistantPanelProps {
  lang: LangKey;
  patient: any;
  form: any;
  interviewData: any;
  medical: any;
  dietPlan: any;
}

export default function ProductAssistantPanel({
  lang,
  patient,
  form,
  interviewData,
  medical,
  dietPlan
}: ProductAssistantPanelProps) {
  const [question, setQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addProduct, basket } = useBasket();

  const handleAskAssistant = async () => {
    if (!question.trim()) {
      setError(tUI('emptyQuestionError', lang));
      return;
    }

    const formData = new FormData();
    formData.append('question', question);
    formData.append('lang', lang);
    formData.append('patient', JSON.stringify(patient));
    formData.append('form', JSON.stringify(form));
    formData.append('interviewData', JSON.stringify(interviewData));
    formData.append('medical', JSON.stringify(medical));
    formData.append('dietPlan', JSON.stringify(dietPlan));
    formData.append('basket', JSON.stringify(basket));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ask-look-agent', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

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
      <h2 className="text-2xl font-bold mb-4">
        👋 {tUI('lookWelcomeHeader', lang, { name: patient?.name?.split(' ')[0] || '' })}
      </h2>

      <p
        className="text-sm text-gray-300 mb-4 leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: tUI('lookWelcomeIntro', lang, {
            name: patient?.name?.split(' ')[0] || ''
          })
        }}
      />

      {/* Pole tekstowe */}
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={tUI('askQuestionPlaceholder', lang)}
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
        {loading ? '🧠 Look pisze odpowiedź...' : `💬 ${tUI('startConversationWithLook', lang)}`}
      </button>

      {error && (
        <p className="text-red-400 mt-4">{error}</p>
      )}

      {/* Tryb: klasyczny produkt */}
      {response?.mode === 'product' && (
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

      {/* Tryb: lista zakupów */}
      {response?.mode === 'shopping' && (
        <ShoppingListCard response={response} />
      )}

      {/* Tryb: odpowiedź ogólna Looka */}
      {response?.mode === 'response' && (
        <div className="bg-white text-black p-4 mt-4 rounded shadow">
          <p className="text-lg font-semibold mb-2">💬 Look:</p>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{response.answer}</p>
          {response.suggestion && (
            <p className="mt-2 text-sm italic text-gray-600">💡 {response.suggestion}</p>
          )}
        </div>
      )}
    </div>
  );
}
