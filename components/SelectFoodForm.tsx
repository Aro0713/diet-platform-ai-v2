import React from 'react';
import { LangKey, getTranslation } from '@/utils/i18n';
import { foodPreferencesLabels } from '@/utils/translations/interview/foodPreferences';

type Props = {
  selected: string[];
  onChange: (selected: string[]) => void;
  lang: LangKey;
};

const foodPreferencesKeys = [
  'vegetarian',
  'vegan',
  'glutenFree',
  'lactoseFree',
  'lowCarb',
  'highProtein',
] as const;

type FoodPreferenceKey = keyof typeof foodPreferencesLabels;

export const SelectFoodForm: React.FC<Props> = ({ selected, onChange, lang }) => {
  const toggle = (key: string) => {
    const updated = selected.includes(key)
      ? selected.filter((f) => f !== key)
      : [...selected, key];
    onChange(updated);
  };

  const t = (key: FoodPreferenceKey) =>
    getTranslation(foodPreferencesLabels, key, lang);

  return (
    <div className="mb-4 w-full text-black dark:text-white">

      <label className="block text-sm md:text-base font-medium text-gray-700 dark:text-white mb-1">

        {t('title')}
      </label>
      <div className="flex flex-wrap gap-2 md:gap-3">

        {foodPreferencesKeys.map((key) => {
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`px-3 py-2 text-sm md:text-base rounded-md border transition-colors duration-200 ${
                isSelected
                  ? 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-300 text-black dark:text-white'
                  : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-black dark:text-white'
              }`}
              aria-pressed={isSelected}
            >
              {t(key as FoodPreferenceKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SelectFoodForm;
