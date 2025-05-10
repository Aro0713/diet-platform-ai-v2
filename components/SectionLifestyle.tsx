import { LangKey, getTranslation } from '../utils/i18n';
import { section3 } from '../components/utils/translations/interview/section3';

interface Section3LifestyleData {
  activity: string;
  sleep: string;
  stress: string;
  smoking: string;
  alcohol: string;
  caffeine: string;
}

interface Props {
  data: Section3LifestyleData;
  onChange: (key: keyof Section3LifestyleData, value: string) => void;
  lang: LangKey;
}

export default function SectionLifestyle({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section3) => getTranslation(section3, key, lang);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-bold">{t('section3_title')}</h3>

      <div>
        <label className="block font-semibold">{t('q3_1')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.activity}
          onChange={(e) => onChange('activity', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q3_2')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.sleep}
          onChange={(e) => onChange('sleep', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q3_3')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.stress}
          onChange={(e) => onChange('stress', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q3_4')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.smoking}
          onChange={(e) => onChange('smoking', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q3_5')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.alcohol}
          onChange={(e) => onChange('alcohol', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q3_6')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.caffeine}
          onChange={(e) => onChange('caffeine', e.target.value)}
        />
      </div>
    </div>
  );
}
