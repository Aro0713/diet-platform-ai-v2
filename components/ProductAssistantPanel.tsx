// components/ProductAssistantPanel.tsx

import React, { useState } from 'react';
import { tUI, type LangKey } from '@/utils/i18n';
import { useBasket } from '@/hooks/useBasket';
import ShoppingListCard from '@/components/ShoppingListCard';
import ProductAnswerCard from '@/components/ProductAnswerCard';
import { Send } from 'lucide-react';
import Image from 'next/image';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      
      {response?.mode === 'shopping' && (
      <ShoppingListCard response={response} lang={lang} />
      )}


    setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: data.answer }
        ]);

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
  // sprzątanie ObjectURL
// (jeśli użytkownik opuści widok przed wysłaniem)
React.useEffect(() => {
  return () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  };
}, [previewUrl]);

  return (
    <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-xl shadow-md mt-6 w-full max-w-3xl mx-auto overflow-hidden break-words">
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
          <Image
            src="/Look.png"
            alt="Look avatar"
            width={48}
            height={48}
            unoptimized
            priority
            className="rounded-full shadow-md ring-2 ring-emerald-500"
          />
          <p className="text-lg font-semibold">{tUI('lookReadyToHelp', lang)}</p>
        </div>
      )}

      {chatHistory.length > 0 && (
        <div className="mt-6 space-y-4 min-w-0">
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
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>

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

{/* 🔎 wiersz: tekst + przycisk „zdjęcie” + „wyślij” */}
<div className="mt-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
  <input
    type="text"
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' && !loading) {
        e.preventDefault();
        handleAsk();
      }
    }}
    placeholder={tUI('askQuestionPlaceholder', lang)}
    className="flex-1 min-w-0 p-2 rounded-md text-black placeholder-gray-400"
  />

  {/* 📷 przycisk do wyboru zdjęcia (otwiera natywny picker kamera/galeria) */}
  <button
    type="button"
    onClick={() => document.getElementById('look-file-input')?.click()}
    className="sm:w-11 h-11 px-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium whitespace-nowrap"
    title={tUI('attachPhoto', lang) || 'Dodaj zdjęcie'}
  >
    📷
  </button>

  {/* ▶️ wyślij */}
  <button
    onClick={handleAsk}
    className="sm:w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white shadow disabled:opacity-50"
    disabled={loading}
    title={tUI('startConversationWithLook', lang)}
  >
    <Send size={18} />
  </button>
</div>

{/* ukryty input file (obsługa Android/iOS) */}
<input
  id="look-file-input"
  type="file"
  accept="image/*"
  capture="environment"
  className="hidden"
  onChange={(e) => {
    const f = e.target.files?.[0] || null;
    if (!f) {
      setImageFile(null);
      setPreviewUrl(null);
      return;
    }
    // walidacja: typ i rozmiar (np. do 8 MB)
    if (!f.type.startsWith('image/')) {
      setError('Obsługiwane są wyłącznie obrazy.');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError('Plik jest zbyt duży (max 8 MB).');
      return;
    }
    setError(null);
    setImageFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }}
/>

{/* mini-podgląd wybranego zdjęcia */}
{previewUrl && (
  <div className="mt-2 flex items-center gap-3">
    <Image
      src={previewUrl}
      alt="Wybrane zdjęcie"
      width={56}
      height={56}
      unoptimized
      className="rounded-md object-cover"
    />
    <div className="text-xs text-gray-300 flex-1 min-w-0 truncate">
      {imageFile?.name} • {(imageFile?.size ? Math.round(imageFile.size / 1024) : 0)} KB
    </div>
    <button
      type="button"
      onClick={() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setImageFile(null);
        // reset inputa file (dla wyboru tego samego pliku ponownie)
        const el = document.getElementById('look-file-input') as HTMLInputElement | null;
        if (el) el.value = '';
      }}
      className="px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-xs"
    >
      ✖
    </button>
  </div>
)}


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
</div>
);
}
