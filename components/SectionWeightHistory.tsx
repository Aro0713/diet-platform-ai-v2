import { LangKey, getTranslation } from '../utils/i18n';
import { section6 } from '../components/utils/translations/interview/section6';

interface Section6WeightHistoryData {
  weightChange: string;
  weightProblems: string;
  weightLossAttempts: string;
}

interface Props {
  data: Section6WeightHistoryData;
  onChange: (key: keyof Section6WeightHistoryData, value: string) => void;
  lang: LangKey;
}

export default function SectionWeightHistory({ data, onChange, lang }: Props) {
  const t = (key: keyof typeof section6) => getTranslation(section6, key, lang);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-bold">{t('section6_title')}</h3>

      <div>
        <label className="block font-semibold">{t('q6_3')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.weightChange}
          onChange={(e) => onChange('weightChange', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q6_4')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.weightProblems}
          onChange={(e) => onChange('weightProblems', e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold">{t('q6_5')}</label>
        <textarea
          className="w-full border px-2 py-1"
          value={data.weightLossAttempts}
          onChange={(e) => onChange('weightLossAttempts', e.target.value)}
        />
      </div>
    </div>
  );
}
