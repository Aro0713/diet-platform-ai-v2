import { LangKey, getTranslation } from '../utils/i18n';
import { section4 } from '../components/utils/translations/interview/section4';

interface Section4FoodHabitsData {
  mealsPerDay: string;
  mealTimes: string;
  waterIntake: string;
  sugarCravings: string;
  fastFoodFrequency: string;
  excludedFoods: string;
}

interface Props {
  data: Section4FoodHabitsData;
  onChange: (key: keyof Section4FoodHabitsData, value: string) => void;
  lang: LangKey;
}

export default function SectionFoodHabits({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section4) => getTranslation(section4, key, lang);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-bold">{t('section4_title')}</h3>

      <div>
        <label className="block font-semibold">{t('q4_1')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.mealsPerDay}
          onChange={(e) => onChange('mealsPerDay', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q4_2')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.mealTimes}
          onChange={(e) => onChange('mealTimes', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q4_6')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.waterIntake}
          onChange={(e) => onChange('waterIntake', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q4_3')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.sugarCravings}
          onChange={(e) => onChange('sugarCravings', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q4_5')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.fastFoodFrequency}
          onChange={(e) => onChange('fastFoodFrequency', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q4_9')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.excludedFoods}
          onChange={(e) => onChange('excludedFoods', e.target.value)}
        />
      </div>
    </div>
  );
}
