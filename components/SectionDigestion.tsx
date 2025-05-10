import { LangKey, getTranslation } from '../utils/i18n';
import { section7 } from '../components/utils/translations/interview/section7';

interface Section7DigestionData {
  digestion: string;
  bloating: string;
  constipation: string;
  diarrhea: string;
  heartburn: string;
  other: string;
}

interface Props {
  data: Section7DigestionData;
  onChange: (key: keyof Section7DigestionData, value: string) => void;
  lang: LangKey;
}

export default function SectionDigestion({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section7) => getTranslation(section7, key, lang);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-bold">{t('section7_title')}</h3>

      <div>
        <label className="block font-semibold">{t('q7_1')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.digestion}
          onChange={(e) => onChange('digestion', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q7_2')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.bloating}
          onChange={(e) => onChange('bloating', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q7_3')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.constipation}
          onChange={(e) => onChange('constipation', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q7_4')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.diarrhea}
          onChange={(e) => onChange('diarrhea', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q7_5')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.heartburn}
          onChange={(e) => onChange('heartburn', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q7_6')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.other}
          onChange={(e) => onChange('other', e.target.value)}
        />
      </div>
    </div>
  );
}
