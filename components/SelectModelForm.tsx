import React, { useState } from 'react';
import PanelCard from './PanelCard';
import { LangKey, tUI } from '../utils/i18n';

interface Props {
  onChange: (model: string) => void;
  lang: LangKey;
}

const modelTitle: Record<LangKey, string> = {
  pl: 'Model diety',
  en: 'Diet model',
  ua: 'Модель дієти',
  es: 'Modelo de dieta',
  fr: 'Modèle de régime',
  de: 'Diätmodell',
  ru: 'Модель диеты',
  zh: '饮食模型',
  hi: 'आहार मॉडल',
  ar: 'نموذج النظام الغذائي',
  he: 'מודל תזונה'
};
const models: Record<string, Record<LangKey, string>> = {
  diabetic: { 
    pl: 'Dieta cukrzycowa',
    en: 'Diabetic diet',
    ua: 'Дієта при діабеті',
    es: 'Dieta para la diabetes',
    fr: 'Régime pour diabétiques',
    de: 'Diabetische Diät',
    ru: 'Диета при диабете',
    zh: '糖尿病饮食',
    hi: 'मधुमेह आहार',
    ar: 'نظام غذائي لمرضى السكري',
    he: 'תפריט לסוכרת'
  },
  insulin: {
    pl: 'Dieta w insulinooporności',
    en: 'Insulin resistance diet',
    ua: 'Дієта при інсулінорезистентності',
    es: 'Dieta para resistencia a la insulina',
    fr: 'Régime résistance à l’insuline',
    de: 'Insulinresistenz-Diät',
    ru: 'Диета при инсулинорезистентности',
    zh: '胰尘类抵抗饮食',
    hi: 'इंसुलिन रेजिस्टेंस आहार',
    ar: 'نظام مقاومة الأنسولين',
    he: 'תפריט לתנגודת אינסולין'
  },
  dash: {
    pl: 'Dieta w nadciśnieniu (DASH)',
    en: 'Hypertension diet (DASH)',
    ua: 'Дієта при гіпертонії (DASH)',
    ru: 'Диета при гипертонии (DASH)',
    es: 'Dieta para la hipertensión (DASH)',
    fr: 'Régime contre l’hypertension (DASH)',
    de: 'Bluthochdruck-Diät (DASH)',
    zh: '高血压饮食（DASH）',
    hi: 'उच्च रक्तचाप आहार (DASH)',
    ar: 'حمية ارتفاع ضغط الدم (DASH)',
    he: 'תפריט ליתר לחץ דם (DASH)'
  },
  
  glutenfree: {
    pl: 'Dieta bezglutenowa',
    en: 'Gluten-free diet',
    ua: 'Безглютенова дієта',
    ru: 'Безглютеновая диета',
    es: 'Dieta sin gluten',
    fr: 'Régime sans gluten',
    de: 'Glutenfreie Diät',
    zh: '无麸质饮食',
    hi: 'ग्लूटेन मुक्त आहार',
    ar: 'حمية خالية من الغلوتين',
    he: 'תפריט ללא גלוטן'
  },
  
  lowfodmap: {
    pl: 'Dieta FODMAP (przy IBS)',
    en: 'Low FODMAP diet (for IBS)',
    ua: 'Дієта FODMAP (при СРК)',
    ru: 'Диета FODMAP (при СРК)',
    es: 'Dieta baja en FODMAP (para SII)',
    fr: 'Régime pauvre en FODMAP (pour le SCI)',
    de: 'FODMAP-arme Diät (bei Reizdarm)',
    zh: '低FODMAP饮食（用于IBS）',
    hi: 'लो FODMAP आहार (IBS के लिए)',
    ar: 'حمية منخفضة الفودماب (لمتلازمة القولون العصبي)',
    he: 'תפריט דל FODMAP (ל-IBS)'
  },
  
  vegan: {
    pl: 'Dieta wegańska',
    en: 'Vegan diet',
    ua: 'Веганська дієта',
    ru: 'Веганская диета',
    es: 'Dieta vegana',
    fr: 'Régime végan',
    de: 'Vegan-Diät',
    zh: '纯素饮食',
    hi: 'शाकाहारी (वीगन) आहार',
    ar: 'حمية نباتية (فيغان)',
    he: 'תפריט טבעוני'
  },
  
  vegetarian: {
    pl: 'Dieta wegetariańska',
    en: 'Vegetarian diet',
    ua: 'Вегетаріанська дієта',
    ru: 'Вегетарианская диета',
    es: 'Dieta vegetariana',
    fr: 'Régime végétarien',
    de: 'Vegetarische Diät',
    zh: '素食饮食',
    hi: 'शाकाहारी आहार',
    ar: 'حمية نباتية',
    he: 'תפריט צמחוני'
  },
  keto: {
    pl: 'Dieta ketogeniczna',
    en: 'Ketogenic diet',
    ua: 'Кетогенна дієта',
    ru: 'Кетогенная диета',
    es: 'Dieta cetogénica',
    fr: 'Régime cétogène',
    de: 'Ketogene Diät',
    zh: '生酮饮食',
    hi: 'कीटोजेनिक आहार',
    ar: 'حمية كيتونية',
    he: 'תפריט קטוגני'
  },
  mediterranean: {
    pl: 'Dieta śródziemnomorska',
    en: 'Mediterranean diet',
    ua: 'Середземноморська дієта',
    ru: 'Средиземноморская диета',
    es: 'Dieta mediterránea',
    fr: 'Régime méditerranéen',
    de: 'Mittelmeerdiät',
    zh: '地中海饮食',
    hi: 'भूमध्यसागरीय आहार',
    ar: 'حمية البحر الأبيض المتوسط',
    he: 'תפריט ים תיכוני'
  },
  paleo: {
    pl: 'Dieta paleolityczna',
    en: 'Paleo diet',
    ua: 'Палеодієта',
    ru: 'Палеодиета',
    es: 'Dieta paleo',
    fr: 'Régime paléo',
    de: 'Paläo-Diät',
    zh: '古饮食法（Paleo）',
    hi: 'पालेओ आहार',
    ar: 'حمية باليو',
    he: 'תפריט פלאוליתי'
  },
  lowcarb: {
    pl: 'Dieta niskowęglowodanowa',
    en: 'Low-carb diet',
    ua: 'Низьковуглеводна дієта',
    ru: 'Низкоуглеводная диета',
    es: 'Dieta baja en carbohidratos',
    fr: 'Régime pauvre en glucides',
    de: 'Kohlenhydratarme Diät',
    zh: '低碳水饮食',
    hi: 'लो-कार्ब आहार',
    ar: 'حمية منخفضة الكربوهيدرات',
    he: 'תפריט דל פחמימות'
  },highprotein: {
    pl: 'Dieta wysokobiałkowa',
    en: 'High-protein diet',
    ua: 'Білкова дієта',
    ru: 'Белковая диета',
    es: 'Dieta rica en proteínas',
    fr: 'Régime riche en protéines',
    de: 'Eiweißreiche Diät',
    zh: '高蛋白饮食',
    hi: 'उच्च प्रोटीन आहार',
    ar: 'حمية غنية بالبروتين',
    he: 'תפריט עשיר בחלבון'
  },
  renal: {
    pl: 'Dieta nerkowa',
    en: 'Renal diet',
    ua: 'Ниркова дієта',
    ru: 'Почечная диета',
    es: 'Dieta renal',
    fr: 'Régime rénal',
    de: 'Nierendiät',
    zh: '肾脏饮食',
    hi: 'गुर्दा आहार',
    ar: 'حمية الكلى',
    he: 'תפריט לכליות'
  },liver: {
    pl: 'Dieta wątrobowa',
    en: 'Liver-support diet',
    ua: 'Дієта при захворюваннях печінки',
    ru: 'Диета при заболеваниях печени',
    es: 'Dieta para el hígado',
    fr: 'Régime pour le foie',
    de: 'Leberdiät',
    zh: '肝脏支持饮食',
    hi: 'जिगर आहार',
    ar: 'حمية الكبد',
    he: 'תפריט לכבד'
  },
  antiinflammatory: {
    pl: 'Dieta przeciwzapalna',
    en: 'Anti-inflammatory diet',
    ua: 'Протизапальна дієта',
    ru: 'Противовоспалительная диета',
    es: 'Dieta antiinflamatoria',
    fr: 'Régime anti-inflammatoire',
    de: 'Entzündungshemmende Diät',
    zh: '抗炎饮食',
    hi: 'सूजन रोधी आहार',
    ar: 'حمية مضادة للالتهابات',
    he: 'תפריט אנטי-דלקתי'
  },
  autoimmune: {
    pl: 'Dieta autoimmunologiczna',
    en: 'Autoimmune protocol (AIP)',
    ua: 'Аутоімунна дієта',
    ru: 'Аутоиммунная диета',
    es: 'Protocolo autoinmune (AIP)',
    fr: 'Protocole auto-immun (AIP)',
    de: 'Autoimmunprotokoll (AIP)',
    zh: '自身免疫饮食',
    hi: 'ऑटोइम्यून प्रोटोकॉल (AIP)',
    ar: 'البروتوكول المناعي الذاتي (AIP)',
    he: 'פרוטוקול אוטואימוני (AIP)'
  },
  intermittent_fasting: {
    pl: 'Post przerywany',
    en: 'Intermittent fasting',
    ua: 'Переривчасте голодування',
    ru: 'Прерывистое голодание',
    es: 'Ayuno intermitente',
    fr: 'Jeûne intermittent',
    de: 'Intervallfasten',
    zh: '间歇性禁食',
    hi: 'आंतरायिक उपवास',
    ar: 'الصيام المتقطع',
    he: 'צום לסירוגין'
  },
  lowfat: {
    pl: 'Dieta niskotłuszczowa',
    en: 'Low-fat diet',
    ua: 'Нежирна дієта',
    ru: 'Низкожировая диета',
    es: 'Dieta baja en grasas',
    fr: 'Régime pauvre en graisses',
    de: 'Fettarme Diät',
    zh: '低脂饮食',
    hi: 'लो-फैट आहार',
    ar: 'حمية منخفضة الدهون',
    he: 'תפריט דל שומן'
  },
  lowsugar: {
    pl: 'Dieta niskocukrowa',
    en: 'Low-sugar diet',
    ua: 'Дієта з низьким вмістом цукру',
    ru: 'Диета с низким содержанием сахара',
    es: 'Dieta baja en azúcar',
    fr: 'Régime pauvre en sucre',
    de: 'Zuckerarme Diät',
    zh: '低糖饮食',
    hi: 'कम चीनी वाला आहार',
    ar: 'حمية منخفضة السكر',
    he: 'תפריט דל סוכר'
  },
  lowsodium: {
    pl: 'Dieta niskosodowa',
    en: 'Low-sodium diet',
    ua: 'Дієта з низьким вмістом натрію',
    ru: 'Диета с низким содержанием натрия',
    es: 'Dieta baja en sodio',
    fr: 'Régime pauvre en sodium',
    de: 'Natriumarme Diät',
    zh: '低钠饮食',
    hi: 'लो-सोडियम आहार',
    ar: 'حمية منخفضة الصوديوم',
    he: 'תפריט דל נתרן'
  },
  mind: {
    pl: 'Dieta MIND (dla mózgu)',
    en: 'MIND diet (for brain health)',
    ua: 'Дієта MIND (для мозку)',
    ru: 'Диета MIND (для мозга)',
    es: 'Dieta MIND (para la salud cerebral)',
    fr: 'Régime MIND (pour le cerveau)',
    de: 'MIND-Diät (für das Gehirn)',
    zh: 'MIND饮食（脑部健康）',
    hi: 'MIND डाइट (मस्तिष्क के लिए)',
    ar: 'حمية MIND (لصحة الدماغ)',
    he: 'תפריט MIND (למוח)'
  },
  elimination: {
    pl: 'Dieta eliminacyjna',
    en: 'Elimination diet',
    ua: 'Елімінаційна дієта',
    ru: 'Элиминационная диета',
    es: 'Dieta de eliminación',
    fr: 'Régime d’élimination',
    de: 'Ausschlussdiät',
    zh: '排除饮食',
    hi: 'एलिमिनेशन डाइट',
    ar: 'حمية الإقصاء',
    he: 'תפריט אלימינציה'
  },
  pcos: {
    pl: 'Dieta przy insulinooporności i PCOS',
    en: 'Diet for insulin resistance and PCOS',
    ua: 'Дієта при інсулінорезистентності та СПКЯ',
    ru: 'Диета при инсулинорезистентности и СПКЯ',
    es: 'Dieta para resistencia a la insulina y SOP',
    fr: 'Régime pour résistance à l’insuline et SOPK',
    de: 'Diät bei Insulinresistenz und PCOS',
    zh: '胰岛素抵抗与多囊卵巢综合征饮食',
    hi: 'इंसुलिन प्रतिरोध और पीसीओएस के लिए आहार',
    ar: 'حمية مقاومة الأنسولين ومتلازمة تكيس المبايض',
    he: 'תפריט לעמידות לאינסולין ותסמונת השחלות הפוליציסטיות'
  },
  light: {
    pl: 'Dieta lekkostrawna',
    en: 'Light (easily digestible) diet',
    ua: 'Легкозасвоювана дієта',
    ru: 'Легкоперевариваемая диета',
    es: 'Dieta ligera',
    fr: 'Régime léger',
    de: 'Leicht verdauliche Diät',
    zh: '易消化饮食',
    hi: 'हल्का पचने वाला आहार',
    ar: 'حمية خفيفة سهلة الهضم',
    he: 'תפריט קל לעיכול'
  },
  };

export default function SelectModelForm({ onChange, lang }: Props) {
  const [selected, setSelected] = useState('');

  const tLabel = tUI('selectModel', lang);
  const tTitle = modelTitle[lang] || modelTitle.pl;

  return (
    <PanelCard title={`🍽️ ${tTitle}`} className="h-full">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-black dark:text-white">
          {tLabel}
        </label>

        <select
          className="w-full rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            onChange(e.target.value);
          }}
        >
          <option value="">{`-- ${tLabel} --`}</option>
          {Object.entries(models).map(([key, labels]) => (
            <option key={key} value={key}>
              {labels[lang] || labels.pl}
            </option>
          ))}
        </select>
      </div>
    </PanelCard>
  );
}

