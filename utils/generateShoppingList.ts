import { Meal } from "@/types";

export interface ShoppingListItem {
  product: string;
  totalWeight: number; // w gramach
  unit: "g" | "ml" | "szt" | "łyżka" | "szklanka" | string;
  count: number;
}

export function generateShoppingList(diet: Meal[]): ShoppingListItem[] {
  const itemMap = new Map<string, { weight: number; unit: string; count: number }>();

  for (const meal of diet) {
    for (const ing of meal.ingredients) {
      const key = `${ing.product}|${ing.unit || "g"}`;
      if (!itemMap.has(key)) {
        itemMap.set(key, { weight: ing.weight, unit: ing.unit || "g", count: 1 });
      } else {
        const current = itemMap.get(key)!;
        itemMap.set(key, {
          weight: current.weight + ing.weight,
          unit: current.unit,
          count: current.count + 1
        });
      }
    }
  }

  return Array.from(itemMap.entries()).map(([key, val]) => {
    const [product, unit] = key.split("|");
    return {
      product,
      unit: unit as ShoppingListItem["unit"],
      totalWeight: Math.round(val.weight),
      count: val.count
    };
  });
}
