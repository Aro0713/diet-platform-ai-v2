import { LangKey, getTranslation } from '../utils/i18n';
import { section5 } from '../components/utils/translations/interview/section5';

interface Section5PreferencesData {
  likedFoods: string;
  dislikedFoods: string;
  intolerances: string;
  allergies: string;
  supplements: string;
  medications: string;
}

interface Props {
  data: Section5PreferencesData;
  onChange: (key: keyof Section5PreferencesData, value: string) => void;
  lang: LangKey;
}

export default function SectionPreferences({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section5) => getTranslation(section5, key, lang);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-bold">{t('section5_title')}</h3>

      <div>
        <label className="block font-semibold">{t('q5_1')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.likedFoods}
          onChange={(e) => onChange('likedFoods', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q5_2')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.dislikedFoods}
          onChange={(e) => onChange('dislikedFoods', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q5_3')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.intolerances}
          onChange={(e) => onChange('intolerances', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q5_4')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.allergies}
          onChange={(e) => onChange('allergies', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q5_5')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.supplements}
          onChange={(e) => onChange('supplements', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q5_6')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.medications}
          onChange={(e) => onChange('medications', e.target.value)}
        />
      </div>
    </div>
  );
}
