import React from 'react';
import { tUI, type LangKey } from '@/utils/i18n';
import { weekDaysMap } from '@/utils/weekDaysMap';

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
        🛒 {tUI('shoppingListFor', lang)} {weekDaysMap[response.day]?.[lang] || response.day}
        </h3>

      {/* 🆕 Obsługa shoppingGroups */}
      {response.shoppingGroups?.length > 0 ? (
        <div className="space-y-4">
          {response.shoppingGroups.map((group: any, i: number) => (
            <div
              key={i}
              className="p-3 bg-white/80 rounded-md border border-emerald-200"
            >
              <h4 className="font-semibold text-sm mb-2">
                🏬 {group.shop}
              </h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {group.items.map((item: any, j: number) => (
                  <li key={j}>
                    <strong>{item.product}</strong> — {item.quantity} {item.unit}
                    {item.localPrice && <> – 💰 {item.localPrice}</>}
                    {item.onlinePrice && <> | 🌐 {item.onlinePrice}</>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {response.shoppingList?.map((item: any, idx: number) => (
            <li key={idx} className="border-b border-gray-300 pb-2">
              <strong>{item.product}</strong> — {item.quantity} {item.unit} <br />
              🏪 {item.localPrice} ({item.shopSuggestion}) | 🌐 {item.onlinePrice}
            </li>
          ))}
        </ul>
      )}

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
