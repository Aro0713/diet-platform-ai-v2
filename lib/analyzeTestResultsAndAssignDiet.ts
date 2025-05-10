import { Meal } from '../types';

interface AnalyzeDietInput {
  conditions: string[];
  results: { [key: string]: string };
  goals?: string[];
  models?: string[];
  cuisine?: string;
}

export function analyzeTestResultsAndAssignDiet({ conditions, results, goals, models, cuisine }: AnalyzeDietInput): Meal[] {
  const diet: Meal[] = [];

  // 🥣 Zawsze zdrowe śniadanie
  diet.push({
    name: 'Śniadanie bazowe',
    ingredients: [
      { product: 'Owsianka na mleku roślinnym', weight: 200 },
      { product: 'Jagody', weight: 50 },
      { product: 'Migdały', weight: 20 },
    ],
    calories: 350,
    glycemicIndex: 40,
  });

  // 🔎 Analiza wyników i chorób
  const hba1c = Number(results['HbA1c']);
  const kreatynina = Number(results['Kreatynina']);
  const cholesterol = Number(results['Cholesterol']);
  const cukrzyca = conditions.includes('Cukrzyca typu 2') || conditions.includes('Cukrzyca typu 1');
  const niewydolnośćNerek = conditions.includes('Przewlekła choroba nerek (PChN)') || kreatynina > 1.3;
  const nadciśnienie = conditions.includes('Nadciśnienie tętnicze');
  const otyłość = conditions.includes('Otyłość');

  if (cukrzyca || hba1c > 6.5) {
    diet.push({
      name: 'Obiad cukrzycowy',
      ingredients: [
        { product: 'Kurczak grillowany', weight: 150 },
        { product: 'Warzywa duszone', weight: 200 },
        { product: 'Kasza gryczana', weight: 100 },
      ],
      calories: 550,
      glycemicIndex: 45,
    });
  } else if (niewydolnośćNerek) {
    diet.push({
      name: 'Obiad nerkowy',
      ingredients: [
        { product: 'Dorsz pieczony', weight: 120 },
        { product: 'Ryż biały', weight: 150 },
        { product: 'Marchew gotowana', weight: 150 },
      ],
      calories: 500,
      glycemicIndex: 55,
    });
  } else if (nadciśnienie || cholesterol > 200) {
    diet.push({
      name: 'Obiad dla nadciśnienia',
      ingredients: [
        { product: 'Indyk gotowany', weight: 150 },
        { product: 'Kasza jęczmienna', weight: 100 },
        { product: 'Brokuły na parze', weight: 150 },
      ],
      calories: 520,
      glycemicIndex: 50,
    });
  } else {
    diet.push({
      name: 'Obiad standardowy',
      ingredients: [
        { product: 'Kurczak grillowany', weight: 150 },
        { product: 'Ryż basmati', weight: 100 },
        { product: 'Sałatka z oliwą', weight: 150 },
      ],
      calories: 600,
      glycemicIndex: 50,
    });
  }

  // 🌙 Kolacja dopasowana do celów
  if (goals?.includes('Odchudzające (redukcja)') || otyłość) {
    diet.push({
      name: 'Kolacja redukcyjna',
      ingredients: [
        { product: 'Twaróg półtłusty', weight: 100 },
        { product: 'Ogórek', weight: 100 },
      ],
      calories: 200,
      glycemicIndex: 30,
    });
  } else {
    diet.push({
      name: 'Kolacja standardowa',
      ingredients: [
        { product: 'Kanapka pełnoziarnista', weight: 150 },
        { product: 'Pomidor', weight: 100 },
      ],
      calories: 300,
      glycemicIndex: 45,
    });
  }

  return diet;
}
