import { LangKey, getTranslation } from '../utils/i18n';
import { section8 } from '../components/utils/translations/interview/section8';

interface Section8MotivationData {
  motivation: string;
  barriers: string;
  supportSystem: string;
  expectations: string;
}

interface Props {
  data: Section8MotivationData;
  onChange: (key: keyof Section8MotivationData, value: string) => void;
  lang: LangKey;
}

export default function SectionMotivation({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section8) => getTranslation(section8, key, lang);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-bold">{t('section8_title')}</h3>

      <div>
        <label className="block font-semibold">{t('q8_1')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.motivation}
          onChange={(e) => onChange('motivation', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q8_2')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.barriers}
          onChange={(e) => onChange('barriers', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q8_3')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.supportSystem}
          onChange={(e) => onChange('supportSystem', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q8_4')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.expectations}
          onChange={(e) => onChange('expectations', e.target.value)}
        />
      </div>
    </div>
  );
}
