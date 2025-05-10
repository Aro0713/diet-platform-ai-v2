import { LangKey, getTranslation } from '../utils/i18n';
import { section9 } from '../components/utils/translations/interview/section9';

interface Section9WomenOnlyData {
  menstrualCycle: string;
  hormonalIssues: string;
  pregnancy: string;
  breastfeeding: string;
  contraception: string;
}

interface Props {
  data: Section9WomenOnlyData;
  onChange: (key: keyof Section9WomenOnlyData, value: string) => void;
  lang: LangKey;
}

export default function SectionWomenOnly({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section9) => getTranslation(section9, key, lang);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-bold">{t('section9_title')}</h3>

      <div>
        <label className="block font-semibold">{t('q9_1')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.menstrualCycle}
          onChange={(e) => onChange('menstrualCycle', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q9_2')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.hormonalIssues}
          onChange={(e) => onChange('hormonalIssues', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q9_3')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.pregnancy}
          onChange={(e) => onChange('pregnancy', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q9_4')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.breastfeeding}
          onChange={(e) => onChange('breastfeeding', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q9_5')}</label>
        <input
          type="text"
          className="w-full border px-2 py-1"
          value={data.contraception}
          onChange={(e) => onChange('contraception', e.target.value)}
        />
      </div>
    </div>
  );
}
