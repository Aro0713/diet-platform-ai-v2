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
    betterAlternative
  } = response;

  return (
    <div className="mt-6 p-4 bg-white text-black rounded-xl shadow space-y-4">
      <h3 className="text-xl font-bold">🧾 {productName}</h3>

      <p className="text-sm text-gray-700">{dietaryAnalysis}</p>

      <div className={`text-sm font-semibold ${allowPurchase ? 'text-green-600' : 'text-red-600'}`}>
        {allowPurchase
          ? tUI('allowedToBuy', lang)
          : tUI('notRecommendedToBuy', lang)}
      </div>

      {reasons?.length > 0 && (
        <ul className="list-disc list-inside text-sm text-gray-800">
          {reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}

      {cheapestShop?.name && cheapestShop?.price && (
        <div className="text-sm text-gray-700">
          🛒 {tUI('cheapestAt', lang)} <strong>{cheapestShop.name}</strong> {tUI('for', lang)} <strong>{cheapestShop.price}</strong>.
        </div>
      )}

      {betterAlternative && (
        <div className="bg-slate-100 rounded-md p-3 text-sm text-gray-700">
          <p className="font-medium">💡 {tUI('betterAlternative', lang)}</p>
          <p>
            <strong>{betterAlternative.name}</strong> {tUI('from', lang)} <strong>{betterAlternative.shop}</strong> {tUI('for', lang)} <strong>{betterAlternative.price}</strong>
          </p>
          <p className="italic text-gray-500">{betterAlternative.whyBetter}</p>
        </div>
      )}

      {onAddToBasket && (
        <button
          onClick={onAddToBasket}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium"
        >
          ➕ {tUI('addToBasket', lang)}
        </button>
      )}
    </div>
  );
}
