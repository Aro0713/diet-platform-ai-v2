import { Meal } from '../types';

interface GenerateDietInput {
  conditions: string[];
  results: { [key: string]: string };
  goals?: string[];
  models?: string[];
  cuisine?: string;
}

export function generatePersonalizedDiet({ conditions, results, goals, models, cuisine }: GenerateDietInput): Meal[] {
  const diet: Meal[] = [];

  // 🥣 Śniadanie - zawsze zdrowa baza
  diet.push({
    name: 'Śniadanie',
    ingredients: [
      { product: 'Owsianka na wodzie lub mleku roślinnym', weight: 200 },
      { product: 'Jagody lub borówki', weight: 50 },
      { product: 'Migdały', weight: 20 },
    ],
    calories: 350,
    glycemicIndex: 40,
  });

  // 🍽️ Analiza chorób i wyników badań
  if (conditions.includes('Cukrzyca') || Number(results?.['HbA1c']) > 6.5) {
    diet.push({
      name: 'Obiad dla cukrzyka',
      ingredients: [
        { product: 'Pierś z kurczaka gotowana', weight: 150 },
        { product: 'Warzywa gotowane na parze', weight: 200 },
        { product: 'Kasza gryczana', weight: 100 },
      ],
      calories: 500,
      glycemicIndex: 45,
    });
  } else if (conditions.includes('Choroba nerek')) {
    diet.push({
      name: 'Obiad dla chorego na nerki',
      ingredients: [
        { product: 'Ryż biały', weight: 150 },
        { product: 'Dorsz pieczony', weight: 120 },
        { product: 'Marchewka duszona', weight: 150 },
      ],
      calories: 480,
      glycemicIndex: 55,
    });
  } else if (conditions.includes('Anemia')) {
    diet.push({
      name: 'Obiad przy anemii',
      ingredients: [
        { product: 'Wątróbka drobiowa', weight: 150 },
        { product: 'Buraczki gotowane', weight: 100 },
        { product: 'Kasza jaglana', weight: 100 },
      ],
      calories: 550,
      glycemicIndex: 50,
    });
  } else if (conditions.includes('Choroba wątroby')) {
    diet.push({
      name: 'Obiad przy chorej wątrobie',
      ingredients: [
        { product: 'Gotowany indyk', weight: 130 },
        { product: 'Puree z ziemniaków', weight: 150 },
        { product: 'Marchew duszona', weight: 100 },
      ],
      calories: 500,
      glycemicIndex: 60,
    });
  } else {
    // 🍗 Standardowy obiad
    diet.push({
      name: 'Obiad standardowy',
      ingredients: [
        { product: 'Kurczak grillowany', weight: 150 },
        { product: 'Ryż basmati', weight: 100 },
        { product: 'Sałatka warzywna', weight: 150 },
      ],
      calories: 600,
      glycemicIndex: 50,
    });
  }

  // 🌙 Kolacja dopasowana do modelu lub celu
  if (goals?.includes('redukcja') || models?.includes('niskowęglowodanowa')) {
    diet.push({
      name: 'Kolacja redukcyjna',
      ingredients: [
        { product: 'Twaróg półtłusty', weight: 100 },
        { product: 'Ogórek zielony', weight: 100 },
      ],
      calories: 200,
      glycemicIndex: 30,
    });
  } else {
    diet.push({
      name: 'Kolacja standardowa',
      ingredients: [
        { product: 'Kanapka z chleba pełnoziarnistego', weight: 150 },
        { product: 'Pomidor', weight: 100 },
      ],
      calories: 300,
      glycemicIndex: 45,
    });
  }

  // 🍴 Bonus według kuchni świata
  if (cuisine === 'Japońska') {
    diet.push({
      name: 'Bonus: przekąska japońska',
      ingredients: [
        { product: 'Sushi z warzywami', weight: 100 },
      ],
      calories: 200,
      glycemicIndex: 45,
    });
  } else if (cuisine === 'Śródziemnomorska') {
    diet.push({
      name: 'Bonus: przekąska śródziemnomorska',
      ingredients: [
        { product: 'Oliwki', weight: 50 },
        { product: 'Ser feta', weight: 50 },
      ],
      calories: 250,
      glycemicIndex: 35,
    });
  }

  return diet;
}
