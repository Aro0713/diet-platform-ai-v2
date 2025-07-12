import React from 'react';
import { tUI, type LangKey } from '@/utils/i18n';

export default function ShoppingListCard({
  response,
  lang
}: {
  response: any;
  lang: LangKey;
}) {
  const playAudio = () => {
    if (!response.audio) return;
    const sound = new Audio(response.audio);
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

      <h3 className="text-md font-semibold mb-2">
        🛒 {tUI('shoppingListFor', lang)} {response.day}
      </h3>

      <ul className="space-y-2 text-sm">
        {response.shoppingList?.map((item: any, idx: number) => (
          <li key={idx} className="border-b border-gray-300 pb-2">
            <strong>{item.product}</strong> — {item.quantity} {item.unit} <br />
            🏪 {item.localPrice} ({item.shopSuggestion}) | 🌐 {item.onlinePrice}
          </li>
        ))}
      </ul>

      <div className="mt-4 font-semibold text-green-700 text-sm">
        💰 {tUI('localTotal', lang)} {response.totalEstimatedCost?.local} <br />
        💻 {tUI('onlineTotal', lang)} {response.totalEstimatedCost?.online}
      </div>

      {response.summary && (
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
          {response.summary}
        </p>
      )}

      {response.audio && (
        <button
          onClick={playAudio}
          className="mt-3 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
        >
          🔊 {tUI('listenToLook', lang)}
        </button>
      )}
    </div>
  );
}
