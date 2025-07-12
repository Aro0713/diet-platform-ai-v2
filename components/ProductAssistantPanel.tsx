// components/ProductAssistantPanel.tsx

import React, { useState } from 'react';
import { tUI, type LangKey } from '@/utils/i18n';
import { useBasket } from '@/hooks/useBasket';
import ShoppingListCard from '@/components/ShoppingListCard';
import ProductAnswerCard from '@/components/ProductAnswerCard';

interface Props {
  lang: LangKey;
  patient: any;
  form: any;
  interviewData: any;
  medical: any;
  dietPlan: any;
}

type LookResponse =
  | {
      mode: 'response';
      answer: string;
      summary?: string;
      suggestion?: string;
      sources?: string[];
      audio?: string;
    }
  | {
      mode: 'product';
      productName: string;
      dietaryAnalysis: string;
      allowPurchase: boolean;
      reasons: string[];
      cheapestShop?: { name: string; price: string };
      betterAlternative?: {
        name: string;
        shop: string;
        price: string;
        whyBetter: string;
      };
      audio?: string;
    }
  | {
      mode: 'shopping';
      day: string;
      shoppingList: {
        product: string;
        quantity: string;
        unit: string;
        localPrice: string;
        onlinePrice: string;
        shopSuggestion: string;
      }[];
      totalEstimatedCost: {
        local: string;
        online: string;
      };
      summary: string;
      audio?: string;
    };

export default function ProductAssistantPanel({
  lang,
  patient,
  form,
  interviewData,
  medical,
  dietPlan
}: Props) {
  const [question, setQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [response, setResponse] = useState<LookResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const { addProduct, basket } = useBasket();

  const handleAsk = async () => {
    if (!question.trim()) return;

    const formData = new FormData();
    formData.append('question', question);
    formData.append('lang', lang);
    formData.append('patient', JSON.stringify(patient));
    formData.append('form', JSON.stringify(form));
    formData.append('interviewData', JSON.stringify(interviewData));
    formData.append('medical', JSON.stringify(medical));
    formData.append('dietPlan', JSON.stringify(dietPlan));
    formData.append('basket', JSON.stringify(basket));
    formData.append('chatHistory', JSON.stringify(chatHistory));
    if (imageFile) formData.append('image', imageFile);

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ask-look-agent', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Błąd odpowiedzi');

      setResponse({
        ...data,
        ...(data.audio ? { audio: data.audio } : {})
      });

      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: question },
        {
            role: 'assistant',
            content:
            data.mode === 'response'
                ? data.answer
                : data.mode === 'product'
                ? '🧪 Przeanalizowałem produkt – zobacz kartę poniżej.'
                : '🛒 Przygotowałem listę zakupów – znajdziesz ją poniżej.'
        }
        ]);
        ;
     setQuestion('');

      if (data.mode === 'product') {
        addProduct({
          productName: data.productName,
          shop: data.cheapestShop?.name,
          price: data.cheapestShop?.price,
          emoji: '🛒',
          whyBetter: data.betterAlternative?.whyBetter || ''
        });
      }
    } catch (err: any) {
      setError(err.message || 'Błąd połączenia');
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

      {!response && !loading && (
        <div className="flex items-center gap-3 mb-4">
          <img src="/Look.png" alt="Look avatar" className="w-12 h-12 rounded-full shadow-md ring-2 ring-emerald-500" />
          <p className="text-lg font-semibold">{tUI('lookReadyToHelp', lang)}</p>
        </div>
      )}

      {chatHistory.length > 0 && (
        <div className="mt-6 space-y-4">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-100 text-black ml-auto text-right'
                  : 'bg-emerald-100 text-black mr-auto'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <img src="/Look.png" className="w-6 h-6 rounded-full" />
                  <span className="font-bold">Look:</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* 🔊 Dodaj odtwarzacz audio tylko do ostatniej odpowiedzi */}
              {msg.role === 'assistant' &&
                response?.audio &&
                index === chatHistory.length - 1 && (
                  <button
                    onClick={() => new Audio(response.audio!).play()}
                    className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    🔊 {tUI('listenToLook', lang)}
                  </button>
                )}
            </div>
          ))}
        </div>
      )}

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={tUI('askQuestionPlaceholder', lang)}
        className="w-full p-2 rounded-md text-black placeholder-gray-400 mt-4 mb-3"
      />

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
        onClick={handleAsk}
        className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 font-medium"
        disabled={loading}
      >
        {loading ? '🧠 Look myśli...' : `💬 ${tUI('startConversationWithLook', lang)}`}
      </button>

      {error && <p className="text-red-400 mt-4">{error}</p>}

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

      {response?.mode === 'shopping' && <ShoppingListCard response={response} />}
    </div>
  );
}
