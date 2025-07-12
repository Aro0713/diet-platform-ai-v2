import React from 'react';
import { type LangKey, tUI } from '@/utils/i18n';

interface ProductAnswerCardProps {
  response: {
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
  };
  onAddToBasket?: () => void;
  lang: LangKey;
}

export default function ProductAnswerCard({
  response,
  onAddToBasket,
  lang
}: ProductAnswerCardProps) {
  const {
    productName,
    dietaryAnalysis,
    allowPurchase,
    reasons,
    cheapestShop,
    betterAlternative,
    audio
  } = response;

  const playAudio = () => {
    if (!audio) return;
    const sound = new Audio(audio);
    sound.play().catch((err) => {
      console.warn('🔇 Nie udało się odtworzyć audio:', err);
    });
  };

  return (
    <div className="bg-emerald-100 text-black p-4 rounded-lg shadow-md max-w-xl mr-auto mt-4">
      <div className="flex items-center gap-2 mb-2">
        <img src="/Look.png" className="w-6 h-6 rounded-full" />
        <span className="font-bold text-emerald-800">Look:</span>
      </div>

      <h3 className="text-md font-semibold mb-2">🧾 {productName}</h3>

      <p className="text-sm mb-2 whitespace-pre-wrap">{dietaryAnalysis}</p>

      <div className={`text-sm font-semibold mb-2 ${allowPurchase ? 'text-green-600' : 'text-red-600'}`}>
        {allowPurchase
          ? tUI('allowedToBuy', lang)
          : tUI('notRecommendedToBuy', lang)}
      </div>

      {reasons?.length > 0 && (
        <ul className="list-disc list-inside text-sm text-gray-800 mb-2">
          {reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}

      {cheapestShop?.name && cheapestShop?.price && (
        <div className="text-sm text-gray-700 mb-2">
          🛒 {tUI('cheapestAt', lang)} <strong>{cheapestShop.name}</strong> {tUI('for', lang)} <strong>{cheapestShop.price}</strong>.
        </div>
      )}

      {betterAlternative && (
        <div className="bg-slate-100 rounded-md p-3 text-sm text-gray-700 mb-2">
          <p className="font-medium">💡 {tUI('betterAlternative', lang)}</p>
          <p>
            <strong>{betterAlternative.name}</strong> {tUI('from', lang)} <strong>{betterAlternative.shop}</strong> {tUI('for', lang)} <strong>{betterAlternative.price}</strong>
          </p>
          <p className="italic text-gray-500">{betterAlternative.whyBetter}</p>
        </div>
      )}

      {audio && (
        <button
          onClick={playAudio}
          className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
        >
          🔊 {tUI('listenToLook', lang)}
        </button>
      )}

      {onAddToBasket && (
        <button
          onClick={onAddToBasket}
          className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-md hover:bg-emerald-800 font-medium"
        >
          ➕ {tUI('addToBasket', lang)}
        </button>
      )}
    </div>
  );
}
