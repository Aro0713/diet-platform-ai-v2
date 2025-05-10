[{
	"resource": "/c:/Users/a4pem/diet-platform/components/utils/translations/interview/section1.ts",
	"owner": "typescript",
	"code": "2307",
	"severity": 8,
	"message": "Cannot find module '../../translations' or its corresponding type declarations.",
	"source": "ts",
	"startLineNumber": 1,
	"startColumn": 25,
	"endLineNumber": 1,
	"endColumn": 45
}]


export const section1 = {
  section1_title: {
    pl: 'Dane podstawowe i cel wizyty',
    en: 'Basic data and purpose of visit',
    es: 'Datos básicos y propósito de la visita',
    fr: 'Données de base et objectif de la visite',
    de: 'Grunddaten und Besuchszweck',
    ua: 'Основні дані та мета візиту',
    ru: 'Основные данные и цель визита',
    zh: '基本资料与就诊目的',
    hi: 'मूल जानकारी और मुलाक़ात का उद्देश्य',
    ar: 'البيانات الأساسية وهدف الزيارة',
    he: 'נתונים בסיסיים ומטרת הביקור'
  },
  q1_1: {
    pl: 'Jakie są Pani/Pana oczekiwania względem współpracy dietetycznej?',
    en: 'What are your expectations regarding dietary cooperation?',
    es: '¿Cuáles son sus expectativas respecto a la colaboración dietética?',
    fr: 'Quelles sont vos attentes concernant la collaboration diététique ?',
    de: 'Was sind Ihre Erwartungen an die diätetische Zusammenarbeit?',
    ua: 'Які Ваші очікування щодо дієтологічної співпраці?',
    ru: 'Каковы ваши ожидания от диетологического сотрудничества?',
    zh: '您对营养合作的期望是什么？',
    hi: 'आहार सहयोग को लेकर आपकी क्या अपेक्षाएँ हैं?',
    ar: 'ما هي توقعاتك بشأن التعاون الغذائي؟',
    he: 'מהן הציפיות שלך לגבי שיתוף פעולה תזונתי?'
  },
  q1_2: {
    pl: 'Czy była Pani/Pan wcześniej na diecie? Jakie były efekty?',
    en: 'Have you been on a diet before? What were the results?',
    es: '¿Ha estado anteriormente en una dieta? ¿Cuáles fueron los resultados?',
    fr: 'Avez-vous déjà suivi un régime ? Quels en ont été les résultats ?',
    de: 'Haben Sie schon einmal eine Diät gemacht? Welche Ergebnisse hatten Sie?',
    ua: 'Чи дотримувалися Ви раніше дієти? Які були результати?',
    ru: 'Были ли вы ранее на диете? Каковы были результаты?',
    zh: '您以前节食过吗？效果如何？',
    hi: 'क्या आप पहले कभी डाइट पर रहे हैं? परिणाम क्या थे?',
    ar: 'هل اتبعت نظامًا غذائيًا من قبل؟ ما هي النتائج؟',
    he: 'האם היית בדיאטה בעבר? מה היו התוצאות?'
  },
  q1_3: {
    pl: 'Czy obecnie korzysta Pani/Pan z jakiejkolwiek diety lub planu żywieniowego?',
    en: 'Are you currently following any diet or nutrition plan?',
    es: '¿Sigue actualmente alguna dieta o plan de nutrición?',
    fr: 'Suivez-vous actuellement un régime ou un plan nutritionnel ?',
    de: 'Folgen Sie derzeit einem Ernährungsplan oder einer Diät?',
    ua: 'Чи дотримуєтесь Ви наразі дієти або плану харчування?',
    ru: 'Следуете ли вы сейчас какой-либо диете или плану питания?',
    zh: '您目前是否遵循某种饮食或营养计划？',
    hi: 'क्या आप वर्तमान में किसी डाइट या पोषण योजना का पालन कर रहे हैं?',
    ar: 'هل تتبع حاليًا نظامًا غذائيًا أو خطة تغذية؟',
    he: 'האם אתה כרגע עוקב אחר דיאטה או תכנית תזונתית?'
  },
  q1_4: {
    pl: 'Czy ma Pani/Pan konkretne cele? (np. redukcja masy ciała, poprawa wyników, wsparcie w chorobie, przyrost masy mięśniowej)',
    en: 'Do you have specific goals? (e.g. weight loss, improved results, health support, muscle gain)',
    es: '¿Tiene objetivos específicos? (p. ej., pérdida de peso, mejora de resultados, apoyo en enfermedad, ganancia muscular)',
    fr: 'Avez-vous des objectifs spécifiques ? (p. ex. perte de poids, amélioration des résultats, soutien en cas de maladie, gain musculaire)',
    de: 'Haben Sie spezifische Ziele? (z. B. Gewichtsreduktion, Ergebnisverbesserung, gesundheitliche Unterstützung, Muskelaufbau)',
    ua: 'Чи маєте Ви конкретні цілі? (напр. схуднення, покращення показників, підтримка при хворобі, набір м’язової маси)',
    ru: 'Есть ли у вас конкретные цели? (например, похудение, улучшение показателей, поддержка при болезни, набор мышечной массы)',
    zh: '您有具体目标吗？（如减肥、改善指标、健康支持、增加肌肉）',
    hi: 'क्या आपके कुछ विशिष्ट लक्ष्य हैं? (जैसे वजन घटाना, परिणामों में सुधार, बीमारी में समर्थन, मांसपेशियों का विकास)',
    ar: 'هل لديك أهداف محددة؟ (مثل فقدان الوزن، تحسين النتائج، الدعم في المرض، زيادة الكتلة العضلية)',
    he: 'האם יש לך מטרות ספציפיות? (כגון ירידה במשקל, שיפור תוצאות, תמיכה במחלה, עלייה במסה שרירית)'
  }
} as const;

export type Section1Key = keyof typeof section1;
