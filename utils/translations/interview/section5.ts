import { LangKey } from '@/utils/i18n';

export const section5: Record<LangKey, any> = {
pl: {
  title: 'Preferencje i nietolerancje pokarmowe',

  q1: {
    label: 'Jakie produkty Pani/Pan lubi najbardziej?',
    type: 'text'
  },

  q2: {
    label: 'Jakich produktów Pani/Pan nie toleruje lub nie lubi?',
    type: 'text'
  },

  q3: {
    label: 'Jak wygląda apetyt w ciągu dnia?',
    type: 'select',
    options: [
      'Prawidłowy',
      'Zwiększony apetyt',
      'Zmniejszony apetyt',
      'Brak apetytu rano',
      'Napady głodu',
      'Brak łaknienia w stresie',
      'Inne'
    ]
  }
},
en: {
  title: 'Food preferences and intolerances',

  q1: {
    label: 'Which foods do you like the most?',
    type: 'text'
  },

  q2: {
    label: 'Which foods do you dislike or are intolerant to?',
    type: 'text'
  },

  q3: {
    label: 'What is your appetite like during the day?',
    type: 'select',
    options: [
      'Normal',
      'Increased appetite',
      'Decreased appetite',
      'No appetite in the morning',
      'Sudden hunger attacks',
      'Lack of appetite under stress',
      'Other'
    ]
  }
},
de: {
  title: 'Essensvorlieben und Unverträglichkeiten',

  q1: {
    label: 'Welche Lebensmittel mögen Sie am liebsten?',
    type: 'text'
  },

  q2: {
    label: 'Welche Lebensmittel mögen Sie nicht oder vertragen Sie nicht?',
    type: 'text'
  },

  q3: {
    label: 'Wie ist Ihr Appetit im Laufe des Tages?',
    type: 'select',
    options: [
      'Normal',
      'Erhöhter Appetit',
      'Verminderter Appetit',
      'Kein Appetit am Morgen',
      'Heißhungerattacken',
      'Appetitlosigkeit bei Stress',
      'Sonstiges'
    ]
  }
},
fr: {
  title: 'Préférences et intolérances alimentaires',

  q1: {
    label: 'Quels aliments aimez-vous le plus ?',
    type: 'text'
  },

  q2: {
    label: 'Quels aliments n’aimez-vous pas ou ne tolérez-vous pas ?',
    type: 'text'
  },

  q3: {
    label: 'Comment est votre appétit au cours de la journée ?',
    type: 'select',
    options: [
      'Normal',
      'Appétit accru',
      'Appétit diminué',
      'Pas d’appétit le matin',
      'Accès de faim',
      'Perte d’appétit en cas de stress',
      'Autre'
    ]
  }
},
es: {
  title: 'Preferencias e intolerancias alimentarias',

  q1: {
    label: '¿Qué alimentos le gustan más?',
    type: 'text'
  },

  q2: {
    label: '¿Qué alimentos no le gustan o no tolera?',
    type: 'text'
  },

  q3: {
    label: '¿Cómo es su apetito durante el día?',
    type: 'select',
    options: [
      'Normal',
      'Apetito aumentado',
      'Apetito reducido',
      'Sin apetito por la mañana',
      'Ataques de hambre',
      'Falta de apetito por estrés',
      'Otro'
    ]
  }
},
ua: {
  title: 'Харчові вподобання та непереносимості',

  q1: {
    label: 'Які продукти ви найбільше любите?',
    type: 'text'
  },

  q2: {
    label: 'Які продукти ви не любите або не переносите?',
    type: 'text'
  },

  q3: {
    label: 'Який у вас апетит протягом дня?',
    type: 'select',
    options: [
      'Нормальний',
      'Підвищений апетит',
      'Знижений апетит',
      'Відсутність апетиту вранці',
      'Приступи голоду',
      'Відсутність апетиту під час стресу',
      'Інше'
    ]
  }
},
ru: {
  title: 'Пищевые предпочтения и непереносимости',

  q1: {
    label: 'Какие продукты вы любите больше всего?',
    type: 'text'
  },

  q2: {
    label: 'Какие продукты вы не любите или не переносите?',
    type: 'text'
  },

  q3: {
    label: 'Каков ваш аппетит в течение дня?',
    type: 'select',
    options: [
      'Нормальный',
      'Повышенный аппетит',
      'Пониженный аппетит',
      'Нет аппетита по утрам',
      'Приступы голода',
      'Нет аппетита при стрессе',
      'Другое'
    ]
  }
},
zh: {
  title: '饮食偏好与不耐受',

  q1: {
    label: '您最喜欢哪些食物？',
    type: 'text'
  },

  q2: {
    label: '您不喜欢或不耐受哪些食物？',
    type: 'text'
  },

  q3: {
    label: '您白天的食欲如何？',
    type: 'select',
    options: [
      '正常',
      '食欲增加',
      '食欲减退',
      '早上没有食欲',
      '暴饮暴食',
      '压力大时没有食欲',
      '其他'
    ]
  }
},
hi: {
  title: 'खाद्य वरीयताएँ और असहिष्णुताएँ',

  q1: {
    label: 'आपको कौन-कौन से खाद्य पदार्थ सबसे अधिक पसंद हैं?',
    type: 'text'
  },

  q2: {
    label: 'कौन-कौन से खाद्य पदार्थ आपको पसंद नहीं हैं या जिन्हें आप सहन नहीं कर पाते?',
    type: 'text'
  },

  q3: {
    label: 'दिन के दौरान आपकी भूख कैसी रहती है?',
    type: 'select',
    options: [
      'सामान्य',
      'भूख अधिक लगती है',
      'भूख कम लगती है',
      'सुबह भूख नहीं लगती',
      'भूख के झटके आते हैं',
      'तनाव में भूख नहीं लगती',
      'अन्य'
    ]
  }
},
ar: {
  title: 'تفضيلات الطعام وعدم التحمل',

  q1: {
    label: 'ما هي الأطعمة التي تحبها أكثر؟',
    type: 'text'
  },

  q2: {
    label: 'ما هي الأطعمة التي لا تحبها أو لا تتحملها؟',
    type: 'text'
  },

  q3: {
    label: 'كيف هو شهيتك خلال اليوم؟',
    type: 'select',
    options: [
      'طبيعية',
      'شهية زائدة',
      'شهية منخفضة',
      'لا شهية في الصباح',
      'نوبات جوع مفاجئة',
      'فقدان الشهية عند التوتر',
      'أخرى'
    ]
  }
},
he: {
  title: 'העדפות תזונתיות ורגישויות',

  q1: {
    label: 'אילו מאכלים אתה הכי אוהב?',
    type: 'text'
  },

  q2: {
    label: 'אילו מאכלים אתה לא אוהב או רגיש אליהם?',
    type: 'text'
  },

  q3: {
    label: 'איך התיאבון שלך במהלך היום?',
    type: 'select',
    options: [
      'תקין',
      'תיאבון מוגבר',
      'תיאבון מופחת',
      'חוסר תיאבון בבוקר',
      'התקפי רעב',
      'אין תיאבון במצבי לחץ',
      'אחר'
    ]
  }
}
};

export type Section5Key = keyof (typeof section5)['pl'];
