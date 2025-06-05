import { LangKey } from '../i18n';

export const calculationBlock = {
  bmi: {
    pl: 'BMI (wskaźnik masy ciała)',
    en: 'BMI (Body Mass Index)',
    es: 'IMC (Índice de Masa Corporal)',
    fr: 'IMC (Indice de Masse Corporelle)',
    de: 'BMI (Body-Mass-Index)',
    ua: 'ІМТ (індекс маси тіла)',
    ru: 'ИМТ (индекс массы тела)',
    zh: 'BMI（身体质量指数）',
    hi: 'बीएमआई (बॉडी मास इंडेक्स)',
    ar: 'مؤشر كتلة الجسم (BMI)',
    he: 'BMI (מדד מסת גוף)'
  },
  ppm: {
    pl: 'PPM (podstawowa przemiana materii)',
    en: 'BMR (Basal Metabolic Rate)',
    es: 'TMB (Tasa Metabólica Basal)',
    fr: 'MB (Métabolisme de Base)',
    de: 'BMR (Grundumsatz)',
    ua: 'БМР (базальний обмін речовин)',
    ru: 'ОБМ (основной обмен веществ)',
    zh: '基础代谢率 (BMR)',
    hi: 'बीएमआर (बेसल मेटाबोलिक रेट)',
    ar: 'معدل الأيض الأساسي (BMR)',
    he: 'BMR (קצב חילוף חומרים בסיסי)'
  },
  cpm: {
    pl: 'CPM (całkowita przemiana materii)',
    en: 'TDEE (Total Daily Energy Expenditure)',
    es: 'GET (Gasto Energético Total)',
    fr: 'DÉJ (Dépense Énergétique Journalière)',
    de: 'TDEE (Gesamttäglicher Energieverbrauch)',
    ua: 'ЗЕП (загальні енерговитрати)',
    ru: 'СЭП (суточные энергозатраты)',
    zh: '每日总能量消耗 (TDEE)',
    hi: 'टीडीईई (कुल दैनिक ऊर्जा व्यय)',
    ar: 'إجمالي الإنفاق اليومي للطاقة (TDEE)',
    he: 'TDEE (הוצאה אנרגטית יומית כוללת)'
  },
  pal: {
    pl: 'PAL (współczynnik aktywności fizycznej)',
    en: 'PAL (Physical Activity Level)',
    es: 'NAP (Nivel de Actividad Física)',
    fr: 'NAP (Niveau d’Activité Physique)',
    de: 'PAL (körperliches Aktivitätsniveau)',
    ua: 'РФА (рівень фізичної активності)',
    ru: 'УФА (уровень физической активности)',
    zh: '身体活动等级 (PAL)',
    hi: 'पीएएल (शारीरिक गतिविधि स्तर)',
    ar: 'PAL (مستوى النشاط البدني)',
    he: 'PAL (רמת פעילות גופנית)'
  },
  broca: {
    pl: 'NMC (norma masy ciała – wzór Broca)',
    en: 'IBW (Ideal Body Weight – Broca)',
    es: 'PNI (Peso Normal Ideal – Broca)',
    fr: 'PNI (Poids Normal Idéal – Broca)',
    de: 'IBW (Idealgewicht – Broca)',
    ua: 'ІМТ (ідеальна вага – Брока)',
    ru: 'ИДВ (идеальный вес – Брока)',
    zh: '理想体重（Broca）',
    hi: 'आदर्श वजन (Broca सूत्र)',
    ar: 'الوزن المثالي (Broca)',
    he: 'משקל אידיאלי (Broca)'
  },
  lorentz: {
    pl: 'NMC (norma masy ciała – wzór Lorentza)',
    en: 'IBW (Ideal Body Weight – Lorentz)',
    es: 'PNI (Peso Normal Ideal – Lorentz)',
    fr: 'PNI (Poids Normal Idéal – Lorentz)',
    de: 'IBW (Idealgewicht – Lorentz)',
    ua: 'ІМТ (ідеальна вага – Лоренц)',
    ru: 'ИДВ (идеальный вес – Лоренц)',
    zh: '理想体重（Lorentz）',
    hi: 'आदर्श वजन (Lorentz सूत्र)',
    ar: 'الوزن المثالي (Lorentz)',
    he: 'משקל אידיאלי (Lorentz)'
  },
  interpretation: {
    pl: 'Interpretacja wyników',
    en: 'Results interpretation',
    es: 'Interpretación de resultados',
    fr: 'Interprétation des résultats',
    de: 'Ergebnisinterpretation',
    ua: 'Інтерпретація результатів',
    ru: 'Интерпретация результатов',
    zh: '结果解读',
    hi: 'परिणामों की व्याख्या',
    ar: 'تفسير النتائج',
    he: 'פירוש תוצאות'
  },
  alertHighCPMLowPAL: {
    pl: '⚠️ CPM jest wysokie, mimo niskiego PAL. Rozważ błędne dane lub zaniżony PAL.',
    en: '⚠️ CPM is high despite low PAL. Check for input errors or underestimated PAL.',
    es: '⚠️ El GET es alto a pesar de un NAP bajo. Verifique errores o subestimación.',
    fr: '⚠️ DÉJ élevé malgré un NAP faible. Vérifiez les données ou une sous-estimation.',
    de: '⚠️ Hohes TDEE trotz niedrigem PAL. Daten prüfen oder PAL zu niedrig.',
    ua: '⚠️ Високий ЗЕП при низькому РФА. Перевірте дані або занижений РФА.',
    ru: '⚠️ Высокий СЭП при низком УФА. Проверьте данные или УФА занижен.',
    zh: '⚠️ 尽管 PAL 较低，但 CPM 较高。检查是否有错误或 PAL 估算过低。',
    hi: '⚠️ PAL कम होने के बावजूद CPM उच्च है। इनपुट या PAL की जाँच करें।',
    ar: '⚠️ الإنفاق عالي رغم انخفاض PAL. تحقق من البيانات أو PAL منخفض جداً.',
    he: '⚠️ TDEE גבוה למרות PAL נמוך. בדוק שגיאות קלט או PAL נמוך מדי.'
  }
};
