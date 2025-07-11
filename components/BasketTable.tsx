import React from 'react';
import { useBasket } from '@/hooks/useBasket';
import { tUI, type LangKey } from '@/utils/i18n';

const emojiMap: Record<string, string> = {
  'chleb': '🍞',
  'jabłko': '🍎',
  'banan': '🍌',
  'mleko': '🥛',
  'ryż': '🍚',
  'ser': '🧀',
  'pomidor': '🍅',
  'jogurt': '🍶',
  'masło': '🧈',
  'orzechy': '🥜'
};

interface BasketTableProps {
  lang: LangKey;
}

export default function BasketTable({ lang }: BasketTableProps) {
  const { basket, removeProduct, clearBasket } = useBasket();

  if (basket.length === 0) return null;

  return (
    <div className="mt-8 p-4 bg-white text-black rounded-xl shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">{tUI('yourBasket', lang)}</h2>

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">{tUI('product', lang) || 'Produkt'}</th>
            <th className="p-2">{tUI('shop', lang) || 'Sklep'}</th>
            <th className="p-2">{tUI('price', lang) || 'Cena'}</th>
            <th className="p-2">{tUI('remove', lang) || 'Usuń'}</th>
          </tr>
        </thead>
        <tbody>
          {basket.map((item, i) => {
            const emoji = Object.entries(emojiMap).find(([key]) =>
              item.productName.toLowerCase().includes(key)
            )?.[1] || '🧺';

            return (
              <tr key={i} className="border-t">
                <td className="p-2">{emoji} {item.productName}</td>
                <td className="p-2">{item.shop}</td>
                <td className="p-2">{item.price}</td>
                <td className="p-2">
                  <button
                    onClick={() => removeProduct(i)}
                    className="text-red-500 hover:underline"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 text-right">
        <button
          onClick={clearBasket}
          className="text-sm text-blue-600 hover:underline"
        >
          {tUI('clearBasket', lang)}
        </button>
      </div>
    </div>
  );
}
