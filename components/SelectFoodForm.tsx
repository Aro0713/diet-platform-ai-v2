import React from 'react';
import { LangKey, getTranslation } from '../utils/i18n';
import { foodPreferencesLabels } from '../components/utils/translations/interview/foodPreferences';

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
  'highProtein'
] as const;

export const SelectFoodForm: React.FC<Props> = ({ selected, onChange, lang }) => {
  const toggle = (key: string) => {
    const updated = selected.includes(key)
      ? selected.filter((f) => f !== key)
      : [...selected, key];
    onChange(updated);
  };

  const t = (key: keyof typeof foodPreferencesLabels) =>
    getTranslation(foodPreferencesLabels, key, lang);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {t('title')}
      </label>
      <div className="flex flex-wrap gap-2">
        {foodPreferencesKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`px-3 py-1 rounded border ${
              selected.includes(key) ? 'bg-green-100 border-green-500' : 'bg-white'
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SelectFoodForm;
