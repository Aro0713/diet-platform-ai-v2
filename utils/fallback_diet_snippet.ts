
// Fallback jadłospis w wielu językach
const fallbackDiets: Record<string, any[]> = {
  pl: [
    { name: "Śniadanie", ingredients: [{ product: "Płatki owsiane", weight: 50 }, { product: "Mleko", weight: 200 }], calories: 300, glycemicIndex: 45 },
    { name: "Drugie śniadanie", ingredients: [{ product: "Jogurt naturalny", weight: 150 }, { product: "Banan", weight: 120 }], calories: 250, glycemicIndex: 55 },
    { name: "Obiad", ingredients: [{ product: "Kurczak", weight: 150 }, { product: "Ryż brązowy", weight: 100 }, { product: "Brokuły", weight: 80 }], calories: 550, glycemicIndex: 50 },
    { name: "Podwieczorek", ingredients: [{ product: "Migdały", weight: 30 }, { product: "Jabłko", weight: 150 }], calories: 280, glycemicIndex: 35 },
    { name: "Kolacja", ingredients: [{ product: "Jajka", weight: 100 }, { product: "Chleb żytni", weight: 60 }, { product: "Pomidor", weight: 80 }], calories: 400, glycemicIndex: 40 }
  ],
  en: [
    { name: "Breakfast", ingredients: [{ product: "Oatmeal", weight: 50 }, { product: "Milk", weight: 200 }], calories: 300, glycemicIndex: 45 },
    { name: "Second breakfast", ingredients: [{ product: "Plain yogurt", weight: 150 }, { product: "Banana", weight: 120 }], calories: 250, glycemicIndex: 55 },
    { name: "Lunch", ingredients: [{ product: "Chicken", weight: 150 }, { product: "Brown rice", weight: 100 }, { product: "Broccoli", weight: 80 }], calories: 550, glycemicIndex: 50 },
    { name: "Snack", ingredients: [{ product: "Almonds", weight: 30 }, { product: "Apple", weight: 150 }], calories: 280, glycemicIndex: 35 },
    { name: "Dinner", ingredients: [{ product: "Eggs", weight: 100 }, { product: "Rye bread", weight: 60 }, { product: "Tomato", weight: 80 }], calories: 400, glycemicIndex: 40 }
  ],
  ua: [
    { name: "Сніданок", ingredients: [{ product: "Вівсянка", weight: 50 }, { product: "Молоко", weight: 200 }], calories: 300, glycemicIndex: 45 },
    { name: "Другий сніданок", ingredients: [{ product: "Йогурт", weight: 150 }, { product: "Банан", weight: 120 }], calories: 250, glycemicIndex: 55 },
    { name: "Обід", ingredients: [{ product: "Курка", weight: 150 }, { product: "Коричневий рис", weight: 100 }, { product: "Броколі", weight: 80 }], calories: 550, glycemicIndex: 50 },
    { name: "Полуденок", ingredients: [{ product: "Мигдаль", weight: 30 }, { product: "Яблуко", weight: 150 }], calories: 280, glycemicIndex: 35 },
    { name: "Вечеря", ingredients: [{ product: "Яйця", weight: 100 }, { product: "Житній хліб", weight: 60 }, { product: "Помідор", weight: 80 }], calories: 400, glycemicIndex: 40 }
  ],
  es: [
    { name: "Desayuno", ingredients: [{ product: "Avena", weight: 50 }, { product: "Leche", weight: 200 }], calories: 300, glycemicIndex: 45 },
    { name: "Segundo desayuno", ingredients: [{ product: "Yogur natural", weight: 150 }, { product: "Plátano", weight: 120 }], calories: 250, glycemicIndex: 55 },
    { name: "Almuerzo", ingredients: [{ product: "Pollo", weight: 150 }, { product: "Arroz integral", weight: 100 }, { product: "Brócoli", weight: 80 }], calories: 550, glycemicIndex: 50 },
    { name: "Merienda", ingredients: [{ product: "Almendras", weight: 30 }, { product: "Manzana", weight: 150 }], calories: 280, glycemicIndex: 35 },
    { name: "Cena", ingredients: [{ product: "Huevos", weight: 100 }, { product: "Pan de centeno", weight: 60 }, { product: "Tomate", weight: 80 }], calories: 400, glycemicIndex: 40 }
  ],
  fr: [
    { name: "Petit-déjeuner", ingredients: [{ product: "Flocons d'avoine", weight: 50 }, { product: "Lait", weight: 200 }], calories: 300, glycemicIndex: 45 },
    { name: "Collation du matin", ingredients: [{ product: "Yaourt nature", weight: 150 }, { product: "Banane", weight: 120 }], calories: 250, glycemicIndex: 55 },
    { name: "Déjeuner", ingredients: [{ product: "Poulet", weight: 150 }, { product: "Riz complet", weight: 100 }, { product: "Brocoli", weight: 80 }], calories: 550, glycemicIndex: 50 },
    { name: "Goûter", ingredients: [{ product: "Amandes", weight: 30 }, { product: "Pomme", weight: 150 }], calories: 280, glycemicIndex: 35 },
    { name: "Dîner", ingredients: [{ product: "Œufs", weight: 100 }, { product: "Pain de seigle", weight: 60 }, { product: "Tomate", weight: 80 }], calories: 400, glycemicIndex: 40 }
  ]
  // Można dodać: de, zh, ru, hi, ar
};

export default fallbackDiets;
