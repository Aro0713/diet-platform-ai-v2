// components/ShoppingListCard.tsx
import React from 'react';

export default function ShoppingListCard({ response }: { response: any }) {
  return (
    <div className="bg-white text-black p-4 rounded-md shadow">
      <h3 className="text-xl font-bold mb-2">🛒 Lista zakupów na {response.day}</h3>
      <ul className="space-y-2">
        {response.shoppingList?.map((item: any, idx: number) => (
          <li key={idx} className="border-b pb-2">
            <strong>{item.product}</strong>: {item.quantity} {item.unit} <br />
            🏪 {item.localPrice} ({item.shopSuggestion}) | 🌐 {item.onlinePrice}
          </li>
        ))}
      </ul>
      <div className="mt-4 font-semibold text-green-700">
        💰 Lokalnie: {response.totalEstimatedCost?.local} <br />
        💻 Online: {response.totalEstimatedCost?.online}
      </div>
      <p className="mt-2 text-sm text-gray-700">{response.summary}</p>
    </div>
  );
}
