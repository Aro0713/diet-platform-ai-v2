import { useState } from 'react';

export interface BasketProduct {
  productName: string;
  shop: string;
  price: string;
  emoji?: string;
  whyBetter?: string;
}

export function useBasket() {
  const [basket, setBasket] = useState<BasketProduct[]>([]);

  const addProduct = (product: BasketProduct) => {
    setBasket((prev) => [...prev, product]);
  };

  const removeProduct = (index: number) => {
    setBasket((prev) => prev.filter((_, i) => i !== index));
  };

  const clearBasket = () => {
    setBasket([]);
  };

  return {
    basket,
    addProduct,
    removeProduct,
    clearBasket
  };
}
