import { Meal } from '@/types';
import { mealTranslations } from '@/utils/mealNameMap';
import type { LangKey } from './i18n';

type RawMeal = {
  time?: string;
  menu?: string;
  kcal?: number;
  glycemicIndex?: number;
  ingredients?: { product: string; weight: number }[];
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
  };
};

const standardOrder = [
  'Śniadanie',
  'Drugie śniadanie',
  'Obiad',
  'Podwieczorek',
  'Kolacja',
  'Późna kolacja'
];

const dayMap: Record<string, string> = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela'
};

// 🕒 Przypisz nazwę posiłku na podstawie godziny
function getMealNameByTime(time: string): string {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 9) return 'Śniadanie';
  if (hour >= 9 && hour < 12) return 'Drugie śniadanie';
  if (hour >= 12 && hour < 15) return 'Obiad';
  if (hour >= 15 && hour < 18) return 'Podwieczorek';
  if (hour >= 18 && hour < 21) return 'Kolacja';
  if (hour >= 21 && hour <= 23) return 'Późna kolacja';
  return 'Posiłek';
}

export function transformDietPlanToEditableFormat(
  dietPlan: Record<string, Record<string, RawMeal>>,
  lang: LangKey
): Record<string, Meal[]> {
  const result: Record<string, Meal[]> = {};
  const translationMap = mealTranslations[lang] || {};

  console.log('🌍 [Parser] Użyty język:', lang);
  console.log('📚 [Parser] Klucze tłumaczeń posiłków:', Object.keys(translationMap));
  console.log('📅 [Parser] Otrzymane dni:', Object.keys(dietPlan));

  for (const day in dietPlan) {
    const mappedDay = dayMap[day.toLowerCase()] || day;
    const mealsForDay = dietPlan[day];
    const normalizedDay: Meal[] = [];

    for (const rawKey in mealsForDay) {
      const rawMealName = rawKey.trim().toLowerCase();
      const mealData = mealsForDay[rawKey];

      if (!mealData || typeof mealData !== 'object') {
        console.warn(`⛔ Posiłek "${rawKey}" nie ma poprawnej struktury`);
        continue;
      }

      // 🧠 Fallback z godziny lub indeksu
      const index = parseInt(rawKey);
      const isIndex = !isNaN(index);
      let fallbackName = `Posiłek ${index + 1}`;
      if (mealData.time) {
        fallbackName = getMealNameByTime(mealData.time);
      } else if (isIndex && standardOrder[index]) {
        fallbackName = standardOrder[index];
      }

      const mappedMealName = translationMap[rawMealName] || fallbackName;

      if (!standardOrder.includes(mappedMealName)) {
        console.warn(`⚠️ Nierozpoznana nazwa posiłku: "${rawKey}" → "${mappedMealName}" (lang: ${lang})`);
      }

      normalizedDay.push({
        name: mappedMealName,
        menu: mealData?.menu ?? '',
        description: mealData?.menu ?? '',
        time: mealData?.time ?? '',
        ingredients: mealData?.ingredients ?? [],
        calories: mealData?.kcal ?? 0,
        glycemicIndex: mealData?.glycemicIndex ?? 0,
        macros: {
          protein: mealData?.macros?.protein ?? 0,
          carbs: mealData?.macros?.carbs ?? 0,
          fat: mealData?.macros?.fat ?? 0,
          sodium: mealData?.macros?.sodium ?? 0
        }
      });

      console.log(`✅ Dodano posiłek: ${mappedDay} → ${mappedMealName}`);
    }

    normalizedDay.sort((a, b) => {
      const indexA = standardOrder.indexOf(a.name);
      const indexB = standardOrder.indexOf(b.name);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    result[mappedDay] = normalizedDay;

    console.log(`📦 Zapisano dzień: ${mappedDay} — liczba posiłków: ${normalizedDay.length}`);
  }

  return result;
}
