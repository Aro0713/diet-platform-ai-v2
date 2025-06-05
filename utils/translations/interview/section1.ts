import { LangKey } from '@/utils/i18n';

export const section1: Record<LangKey, any> = {
  pl: {
    title: 'Dane podstawowe i cel wizyty',
    q1: {
      label: 'Jakie są Pani/Pana oczekiwania względem współpracy dietetycznej?',
      type: 'select',
      options: [
        'Redukcja masy ciała',
        'Poprawa wyników badań',
        'Wsparcie w chorobie',
        'Przyrost masy mięśniowej',
        'Edukacja żywieniowa',
        'Utrzymanie masy ciała',
        'Inne'
      ]
    },
    q1_other: {
      label: 'Inne – doprecyzuj',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Inne' }
    },
    q2: {
      label: 'Czy była Pani/Pan wcześniej na diecie?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },
    q3: {
      label: 'Jeśli tak, to na jakiej diecie była Pani/Pan i jakie były efekty?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'Tak' }
    },
    q4: {
      label: 'Czy obecnie korzysta Pani/Pan z jakiejkolwiek diety lub planu żywieniowego?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },
    q4_details: {
      label: 'Jeśli tak, to proszę opisać stosowaną dietę:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Tak' }
    }
  },

  en: {
    title: 'Basic information and purpose of the visit',
    q1: {
      label: 'What are your expectations regarding dietary cooperation?',
      type: 'select',
      options: [
        'Weight loss',
        'Improved test results',
        'Support in disease',
        'Muscle mass gain',
        'Nutritional education',
        'Weight maintenance',
        'Other'
      ]
    },
    q1_other: {
      label: 'Other – please specify',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Other' }
    },
    q2: {
      label: 'Have you been on a diet before?',
      type: 'radio',
      options: ['Yes', 'No', 'I don’t know']
    },
    q3: {
      label: 'If yes, what diet and what were the results?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'Yes' }
    },
    q4: {
      label: 'Are you currently following any diet or nutrition plan?',
      type: 'radio',
      options: ['Yes', 'No', 'I don’t know']
    },
    q4_details: {
      label: 'If yes, please describe the diet:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Yes' }
    }
  },
  ua: {
    title: 'Основна інформація та мета візиту',
    q1: {
      label: 'Які ваші очікування щодо дієтичної співпраці?',
      type: 'select',
      options: [
        'Зниження ваги',
        'Покращення результатів аналізів',
        'Підтримка при захворюваннях',
        'Нарощування м’язової маси',
        'Освіта з харчування',
        'Підтримка ваги',
        'Інше'
      ]
    },
    q1_other: {
      label: 'Інше – уточніть',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Інше' }
    },
    q2: {
      label: 'Чи дотримувалися ви раніше дієти?',
      type: 'radio',
      options: ['Так', 'Ні', 'Не знаю']
    },
    q3: {
      label: 'Якщо так, яку дієту ви дотримувалися і які були результати?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'Так' }
    },
    q4: {
      label: 'Чи дотримуєтеся ви зараз якоїсь дієти або харчового плану?',
      type: 'radio',
      options: ['Так', 'Ні', 'Не знаю']
    },
    q4_details: {
      label: 'Якщо так, будь ласка, опишіть дієту:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Так' }
    }
  },

  es: {
    title: 'Datos básicos y objetivo de la visita',
    q1: {
      label: '¿Cuáles son sus expectativas respecto a la cooperación dietética?',
      type: 'select',
      options: [
        'Pérdida de peso',
        'Mejora de resultados médicos',
        'Apoyo en enfermedad',
        'Aumento de masa muscular',
        'Educación nutricional',
        'Mantenimiento del peso',
        'Otro'
      ]
    },
    q1_other: {
      label: 'Otro – especifique',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Otro' }
    },
    q2: {
      label: '¿Ha seguido alguna dieta anteriormente?',
      type: 'radio',
      options: ['Sí', 'No', 'No lo sé']
    },
    q3: {
      label: 'Si es así, ¿qué dieta y cuáles fueron los resultados?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'Sí' }
    },
    q4: {
      label: '¿Actualmente sigue alguna dieta o plan de alimentación?',
      type: 'radio',
      options: ['Sí', 'No', 'No lo sé']
    },
    q4_details: {
      label: 'Si es así, describa la dieta:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Sí' }
    }
  },

  fr: {
    title: 'Informations de base et objectif de la visite',
    q1: {
      label: 'Quelles sont vos attentes en matière de suivi diététique ?',
      type: 'select',
      options: [
        'Perte de poids',
        'Amélioration des résultats médicaux',
        'Soutien en cas de maladie',
        'Prise de masse musculaire',
        'Éducation nutritionnelle',
        'Maintien du poids',
        'Autre'
      ]
    },
    q1_other: {
      label: 'Autre – précisez',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Autre' }
    },
    q2: {
      label: 'Avez-vous déjà suivi un régime ?',
      type: 'radio',
      options: ['Oui', 'Non', 'Je ne sais pas']
    },
    q3: {
      label: 'Si oui, quel régime et quels ont été les résultats ?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'Oui' }
    },
    q4: {
      label: 'Suivez-vous actuellement un régime ou un plan alimentaire ?',
      type: 'radio',
      options: ['Oui', 'Non', 'Je ne sais pas']
    },
    q4_details: {
      label: 'Si oui, décrivez le régime :',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Oui' }
    }
  },

  de: {
    title: 'Grunddaten und Ziel des Besuchs',
    q1: {
      label: 'Was sind Ihre Erwartungen an die Ernährungsberatung?',
      type: 'select',
      options: [
        'Gewichtsreduktion',
        'Verbesserung der Blutwerte',
        'Unterstützung bei Krankheit',
        'Muskelaufbau',
        'Ernährungsbildung',
        'Gewichtserhaltung',
        'Andere'
      ]
    },
    q1_other: {
      label: 'Andere – bitte angeben',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Andere' }
    },
    q2: {
      label: 'Waren Sie schon einmal auf Diät?',
      type: 'radio',
      options: ['Ja', 'Nein', 'Ich weiß nicht']
    },
    q3: {
      label: 'Wenn ja, welche Diät und mit welchem Erfolg?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'Ja' }
    },
    q4: {
      label: 'Befolgen Sie aktuell eine Diät oder einen Ernährungsplan?',
      type: 'radio',
      options: ['Ja', 'Nein', 'Ich weiß nicht']
    },
    q4_details: {
      label: 'Wenn ja, beschreiben Sie die Diät bitte:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Ja' }
    }
  },

  ru: {
    title: 'Основная информация и цель визита',
    q1: {
      label: 'Каковы ваши ожидания от диетологической консультации?',
      type: 'select',
      options: [
        'Снижение веса',
        'Улучшение анализов',
        'Поддержка при заболевании',
        'Набор мышечной массы',
        'Питательная грамотность',
        'Поддержание веса',
        'Другое'
      ]
    },
    q1_other: {
      label: 'Другое – уточните',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Другое' }
    },
    q2: {
      label: 'Вы ранее придерживались диеты?',
      type: 'radio',
      options: ['Да', 'Нет', 'Не знаю']
    },
    q3: {
      label: 'Если да, какой диеты и каков был результат?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'Да' }
    },
    q4: {
      label: 'Вы сейчас придерживаетесь какой-либо диеты?',
      type: 'radio',
      options: ['Да', 'Нет', 'Не знаю']
    },
    q4_details: {
      label: 'Если да, опишите, пожалуйста, диету:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Да' }
    }
  },
  zh: {
    title: '基本信息和就诊目的',
    q1: {
      label: '您对营养咨询有哪些期望？',
      type: 'select',
      options: [
        '减重',
        '改善化验结果',
        '疾病支持',
        '增加肌肉质量',
        '营养教育',
        '维持体重',
        '其他'
      ]
    },
    q1_other: {
      label: '其他 – 请说明',
      type: 'text',
      dependsOn: { question: 'q1', value: '其他' }
    },
    q2: {
      label: '您以前有过饮食计划吗？',
      type: 'radio',
      options: ['是', '否', '不确定']
    },
    q3: {
      label: '如果是，请说明您采用的饮食方式及其效果：',
      type: 'text',
      dependsOn: { question: 'q2', value: '是' }
    },
    q4: {
      label: '您目前是否在遵循某种饮食或营养计划？',
      type: 'radio',
      options: ['是', '否', '不确定']
    },
    q4_details: {
      label: '如果是，请描述您目前的饮食：',
      type: 'text',
      dependsOn: { question: 'q4', value: '是' }
    }
  },

  hi: {
    title: 'मूल जानकारी और परामर्श का उद्देश्य',
    q1: {
      label: 'आपको आहार संबंधी परामर्श से क्या अपेक्षाएँ हैं?',
      type: 'select',
      options: [
        'वज़न घटाना',
        'रिपोर्ट में सुधार',
        'बीमारी में सहायता',
        'मांसपेशियों का विकास',
        'पोषण शिक्षा',
        'वज़न बनाए रखना',
        'अन्य'
      ]
    },
    q1_other: {
      label: 'अन्य – कृपया स्पष्ट करें',
      type: 'text',
      dependsOn: { question: 'q1', value: 'अन्य' }
    },
    q2: {
      label: 'क्या आपने पहले कभी कोई डाइट फॉलो की है?',
      type: 'radio',
      options: ['हाँ', 'नहीं', 'पता नहीं']
    },
    q3: {
      label: 'अगर हाँ, तो कौन सी डाइट और क्या परिणाम रहे?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'हाँ' }
    },
    q4: {
      label: 'क्या आप वर्तमान में किसी डाइट या पोषण योजना का पालन कर रहे हैं?',
      type: 'radio',
      options: ['हाँ', 'नहीं', 'पता नहीं']
    },
    q4_details: {
      label: 'अगर हाँ, तो कृपया डाइट का विवरण दें:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'हाँ' }
    }
  },

  ar: {
    title: 'المعلومات الأساسية وهدف الزيارة',
    q1: {
      label: 'ما هي توقعاتك من التعاون الغذائي؟',
      type: 'select',
      options: [
        'إنقاص الوزن',
        'تحسين نتائج التحاليل',
        'الدعم في حالة المرض',
        'زيادة الكتلة العضلية',
        'التثقيف الغذائي',
        'الحفاظ على الوزن',
        'أخرى'
      ]
    },
    q1_other: {
      label: 'أخرى – يرجى التوضيح',
      type: 'text',
      dependsOn: { question: 'q1', value: 'أخرى' }
    },
    q2: {
      label: 'هل سبق لك اتباع حمية غذائية؟',
      type: 'radio',
      options: ['نعم', 'لا', 'لا أعلم']
    },
    q3: {
      label: 'إذا نعم، ما هي الحمية وما كانت نتائجها؟',
      type: 'text',
      dependsOn: { question: 'q2', value: 'نعم' }
    },
    q4: {
      label: 'هل تتبع حاليًا أي نظام غذائي أو خطة تغذية؟',
      type: 'radio',
      options: ['نعم', 'لا', 'لا أعلم']
    },
    q4_details: {
      label: 'إذا نعم، يرجى وصف النظام الغذائي:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'نعم' }
    }
  },

  he: {
    title: 'מידע בסיסי ומטרת הביקור',
    q1: {
      label: 'מה הציפיות שלך משיתוף פעולה תזונתי?',
      type: 'select',
      options: [
        'הפחתת משקל',
        'שיפור תוצאות בדיקות',
        'תמיכה במצב רפואי',
        'עלייה במסת שריר',
        'חינוך תזונתי',
        'שימור משקל',
        'אחר'
      ]
    },
    q1_other: {
      label: 'אחר – נא לפרט',
      type: 'text',
      dependsOn: { question: 'q1', value: 'אחר' }
    },
    q2: {
      label: 'האם היית בעבר בדיאטה?',
      type: 'radio',
      options: ['כן', 'לא', 'לא יודע']
    },
    q3: {
      label: 'אם כן, איזו דיאטה ואילו היו התוצאות?',
      type: 'text',
      dependsOn: { question: 'q2', value: 'כן' }
    },
    q4: {
      label: 'האם אתה עוקב כרגע אחרי דיאטה או תוכנית תזונה כלשהי?',
      type: 'radio',
      options: ['כן', 'לא', 'לא יודע']
    },
    q4_details: {
      label: 'אם כן, נא לתאר את הדיאטה:',
      type: 'text',
      dependsOn: { question: 'q4', value: 'כן' }
    }
  }
};
