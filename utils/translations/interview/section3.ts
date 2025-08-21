import { LangKey } from '@/utils/i18n';

export const section3: Record<LangKey, any> = {
  pl: {
    title: 'Styl życia',

    q1: {
      label: 'Czy podejmujesz aktywność fizyczną?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q2: {
      label: 'Jaki rodzaj aktywności fizycznej?',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Tak' }
    },

    q3: {
      label: 'Czy charakter pracy wpływa na zdrowie?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q4: {
      label: 'Jaki jest charakter pracy?',
      type: 'text',
      dependsOn: { question: 'q3', value: 'Tak' }
    },

    q5: {
      label: 'Czy palisz papierosy?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Okazjonalnie']
    },

    q6: {
      label: 'Czy spożywasz alkohol?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Okazjonalnie']
    },

    q7: {
      label: 'Czy pijesz kawę lub herbatę?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Okazjonalnie']
    },

    q7_details: {
      label: 'Ile filiżanek kawy dziennie?',
      type: 'select',
      options: ['1', '2', '3', '4', '5 lub więcej'],
      dependsOn: { question: 'q7', value: 'Tak' }
    },

    q7b_details: {
      label: 'Ile filiżanek herbaty dziennie?',
      type: 'select',
      options: ['1', '2', '3', '4', '5 lub więcej'],
      dependsOn: { question: 'q7', value: 'Tak' }
    },

    q8: {
      label: 'Czy pijesz napoje energetyczne?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Okazjonalnie']
    },

    q8_details: {
      label: 'Jakie napoje energetyczne?',
      type: 'text',
      dependsOn: { question: 'q8', value: 'Tak' }
    }
  },
en: {
  title: 'Lifestyle',

  q1: {
    label: 'Do you engage in physical activity?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q2: {
    label: 'What type of physical activity?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Yes' }
  },

  q3: {
    label: 'Does your type of work affect your health?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q4: {
    label: 'What kind of work do you do?',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Yes' }
  },

  q5: {
    label: 'Do you smoke cigarettes?',
    type: 'radio',
    options: ['Yes', 'No', 'Occasionally']
  },

  q6: {
    label: 'Do you consume alcohol?',
    type: 'radio',
    options: ['Yes', 'No', 'Occasionally']
  },

  q7: {
    label: 'Do you drink coffee or tea?',
    type: 'radio',
    options: ['Yes', 'No', 'Occasionally']
  },

  q7_details: {
    label: 'How many cups of coffee per day?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 or more'],
    dependsOn: { question: 'q7', value: 'Yes' }
  },

  q7b_details: {
    label: 'How many cups of tea per day?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 or more'],
    dependsOn: { question: 'q7', value: 'Yes' }
  },

  q8: {
    label: 'Do you drink energy drinks?',
    type: 'radio',
    options: ['Yes', 'No', 'Occasionally']
  },

  q8_details: {
    label: 'Which energy drinks?',
    type: 'text',
    dependsOn: { question: 'q8', value: 'Yes' }
  }
},
de: {
  title: 'Lebensstil',

  q1: {
    label: 'Betreiben Sie körperliche Aktivität?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q2: {
    label: 'Welche Art von körperlicher Aktivität?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Ja' }
  },

  q3: {
    label: 'Hat Ihre Arbeit Auswirkungen auf Ihre Gesundheit?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q4: {
    label: 'Welche Art von Arbeit üben Sie aus?',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Ja' }
  },

  q5: {
    label: 'Rauchen Sie Zigaretten?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Gelegentlich']
  },

  q6: {
    label: 'Konsumieren Sie Alkohol?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Gelegentlich']
  },

  q7: {
    label: 'Trinken Sie Kaffee oder Tee?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Gelegentlich']
  },

  q7_details: {
    label: 'Wie viele Tassen Kaffee pro Tag?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 oder mehr'],
    dependsOn: { question: 'q7', value: 'Ja' }
  },

  q7b_details: {
    label: 'Wie viele Tassen Tee pro Tag?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 oder mehr'],
    dependsOn: { question: 'q7', value: 'Ja' }
  },

  q8: {
    label: 'Trinken Sie Energydrinks?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Gelegentlich']
  },

  q8_details: {
    label: 'Welche Energydrinks?',
    type: 'text',
    dependsOn: { question: 'q8', value: 'Ja' }
  }
},
fr: {
  title: 'Mode de vie',

  q1: {
    label: 'Pratiquez-vous une activité physique ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q2: {
    label: 'Quel type d’activité physique ?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Oui' }
  },

  q3: {
    label: 'Votre travail affecte-t-il votre santé ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q4: {
    label: 'Quel type de travail effectuez-vous ?',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Oui' }
  },

  q5: {
    label: 'Fumez-vous des cigarettes ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Occasionnellement']
  },

  q6: {
    label: 'Consommez-vous de l’alcool ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Occasionnellement']
  },

  q7: {
    label: 'Buvez-vous du café ou du thé ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Occasionnellement']
  },

  q7_details: {
    label: 'Combien de tasses de café par jour ?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 ou plus'],
    dependsOn: { question: 'q7', value: 'Oui' }
  },

  q7b_details: {
    label: 'Combien de tasses de thé par jour ?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 ou plus'],
    dependsOn: { question: 'q7', value: 'Oui' }
  },

  q8: {
    label: 'Buvez-vous des boissons énergisantes ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Occasionnellement']
  },

  q8_details: {
    label: 'Lesquelles ?',
    type: 'text',
    dependsOn: { question: 'q8', value: 'Oui' }
  }
},
es: {
  title: 'Estilo de vida',

  q1: {
    label: '¿Realiza actividad física?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q2: {
    label: '¿Qué tipo de actividad física?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Sí' }
  },

  q3: {
    label: '¿Su trabajo influye en su salud?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q4: {
    label: '¿Qué tipo de trabajo realiza?',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Sí' }
  },

  q5: {
    label: '¿Fuma cigarrillos?',
    type: 'radio',
    options: ['Sí', 'No', 'Ocasionalmente']
  },

  q6: {
    label: '¿Consume alcohol?',
    type: 'radio',
    options: ['Sí', 'No', 'Ocasionalmente']
  },

  q7: {
    label: '¿Bebe café o té?',
    type: 'radio',
    options: ['Sí', 'No', 'Ocasionalmente']
  },

  q7_details: {
    label: '¿Cuántas tazas de café al día?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 o más'],
    dependsOn: { question: 'q7', value: 'Sí' }
  },

  q7b_details: {
    label: '¿Cuántas tazas de té al día?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 o más'],
    dependsOn: { question: 'q7', value: 'Sí' }
  },

  q8: {
    label: '¿Bebe bebidas energéticas?',
    type: 'radio',
    options: ['Sí', 'No', 'Ocasionalmente']
  },

  q8_details: {
    label: '¿Cuáles?',
    type: 'text',
    dependsOn: { question: 'q8', value: 'Sí' }
  }
},
ua: {
  title: 'Спосіб життя',

  q1: {
    label: 'Чи займаєтесь ви фізичною активністю?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q2: {
    label: 'Який вид фізичної активності?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Так' }
  },

  q3: {
    label: 'Чи впливає характер роботи на здоров’я?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q4: {
    label: 'Який характер роботи?',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Так' }
  },

  q5: {
    label: 'Чи палите ви сигарети?',
    type: 'radio',
    options: ['Так', 'Ні', 'Іноді']
  },

  q6: {
    label: 'Чи вживаєте ви алкоголь?',
    type: 'radio',
    options: ['Так', 'Ні', 'Іноді']
  },

  q7: {
    label: 'Чи п’єте ви каву або чай?',
    type: 'radio',
    options: ['Так', 'Ні', 'Іноді']
  },

  q7_details: {
    label: 'Скільки чашок кави на день?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 або більше'],
    dependsOn: { question: 'q7', value: 'Так' }
  },

  q7b_details: {
    label: 'Скільки чашок чаю на день?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 або більше'],
    dependsOn: { question: 'q7', value: 'Так' }
  },

  q8: {
    label: 'Чи п’єте ви енергетичні напої?',
    type: 'radio',
    options: ['Так', 'Ні', 'Іноді']
  },

  q8_details: {
    label: 'Які саме?',
    type: 'text',
    dependsOn: { question: 'q8', value: 'Так' }
  }
},
ru: {
  title: 'Образ жизни',

  q1: {
    label: 'Занимаетесь ли вы физической активностью?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q2: {
    label: 'Какой вид физической активности?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Да' }
  },

  q3: {
    label: 'Влияет ли характер вашей работы на здоровье?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q4: {
    label: 'Какой у вас характер работы?',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Да' }
  },

  q5: {
    label: 'Вы курите сигареты?',
    type: 'radio',
    options: ['Да', 'Нет', 'Иногда']
  },

  q6: {
    label: 'Вы употребляете алкоголь?',
    type: 'radio',
    options: ['Да', 'Нет', 'Иногда']
  },

  q7: {
    label: 'Вы пьёте кофе или чай?',
    type: 'radio',
    options: ['Да', 'Нет', 'Иногда']
  },

  q7_details: {
    label: 'Сколько чашек кофе в день?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 или больше'],
    dependsOn: { question: 'q7', value: 'Да' }
  },

  q7b_details: {
    label: 'Сколько чашек чая в день?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 или больше'],
    dependsOn: { question: 'q7', value: 'Да' }
  },

  q8: {
    label: 'Пьёте ли вы энергетики?',
    type: 'radio',
    options: ['Да', 'Нет', 'Иногда']
  },

  q8_details: {
    label: 'Какие именно?',
    type: 'text',
    dependsOn: { question: 'q8', value: 'Да' }
  }
},
zh: {
  title: '生活方式',

  q1: {
    label: '您是否进行体育锻炼？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q2: {
    label: '什么类型的体育活动？',
    type: 'text',
    dependsOn: { question: 'q1', value: '是' }
  },

  q3: {
    label: '您的工作性质是否影响健康？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q4: {
    label: '您的工作性质是？',
    type: 'text',
    dependsOn: { question: 'q3', value: '是' }
  },

  q5: {
    label: '您是否吸烟？',
    type: 'radio',
    options: ['是', '否', '偶尔']
  },

  q6: {
    label: '您是否饮酒？',
    type: 'radio',
    options: ['是', '否', '偶尔']
  },

  q7: {
    label: '您是否喝咖啡或茶？',
    type: 'radio',
    options: ['是', '否', '偶尔']
  },

  q7_details: {
    label: '每天喝几杯咖啡？',
    type: 'select',
    options: ['1', '2', '3', '4', '5杯以上'],
    dependsOn: { question: 'q7', value: '是' }
  },

  q7b_details: {
    label: '每天喝几杯茶？',
    type: 'select',
    options: ['1', '2', '3', '4', '5杯以上'],
    dependsOn: { question: 'q7', value: '是' }
  },

  q8: {
    label: '您是否饮用能量饮料？',
    type: 'radio',
    options: ['是', '否', '偶尔']
  },

  q8_details: {
    label: '哪些能量饮料？',
    type: 'text',
    dependsOn: { question: 'q8', value: '是' }
  }
},
hi: {
  title: 'जीवन शैली',

  q1: {
    label: 'क्या आप शारीरिक गतिविधि करते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q2: {
    label: 'कौन सी शारीरिक गतिविधि?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'हाँ' }
  },

  q3: {
    label: 'क्या आपकी नौकरी का स्वास्थ पर असर पड़ता है?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q4: {
    label: 'आपकी नौकरी का प्रकार क्या है?',
    type: 'text',
    dependsOn: { question: 'q3', value: 'हाँ' }
  },

  q5: {
    label: 'क्या आप सिगरेट पीते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q6: {
    label: 'क्या आप शराब पीते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q7: {
    label: 'क्या आप चाय या कॉफी पीते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q7_details: {
    label: 'प्रतिदिन कितने कप कॉफी पीते हैं?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 या अधिक'],
    dependsOn: { question: 'q7', value: 'हाँ' }
  },

  q7b_details: {
    label: 'प्रतिदिन कितने कप चाय पीते हैं?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 या अधिक'],
    dependsOn: { question: 'q7', value: 'हाँ' }
  },

  q8: {
    label: 'क्या आप एनर्जी ड्रिंक पीते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q8_details: {
    label: 'कौन से एनर्जी ड्रिंक?',
    type: 'text',
    dependsOn: { question: 'q8', value: 'हाँ' }
  }
},
ar: {
  title: 'نمط الحياة',

  q1: {
    label: 'هل تمارس نشاطًا بدنيًا؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q2: {
    label: 'ما نوع النشاط البدني؟',
    type: 'text',
    dependsOn: { question: 'q1', value: 'نعم' }
  },

  q3: {
    label: 'هل يؤثر نوع عملك على صحتك؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q4: {
    label: 'ما نوع العمل الذي تقوم به؟',
    type: 'text',
    dependsOn: { question: 'q3', value: 'نعم' }
  },

  q5: {
    label: 'هل تدخن السجائر؟',
    type: 'radio',
    options: ['نعم', 'لا', 'أحيانًا']
  },

  q6: {
    label: 'هل تتناول الكحول؟',
    type: 'radio',
    options: ['نعم', 'لا', 'أحيانًا']
  },

  q7: {
    label: 'هل تشرب القهوة أو الشاي؟',
    type: 'radio',
    options: ['نعم', 'لا', 'أحيانًا']
  },

  q7_details: {
    label: 'كم عدد أكواب القهوة في اليوم؟',
    type: 'select',
    options: ['1', '2', '3', '4', '5 أو أكثر'],
    dependsOn: { question: 'q7', value: 'نعم' }
  },

  q7b_details: {
    label: 'كم عدد أكواب الشاي في اليوم؟',
    type: 'select',
    options: ['1', '2', '3', '4', '5 أو أكثر'],
    dependsOn: { question: 'q7', value: 'نعم' }
  },

  q8: {
    label: 'هل تشرب مشروبات طاقة؟',
    type: 'radio',
    options: ['نعم', 'لا', 'أحيانًا']
  },

  q8_details: {
    label: 'ما هي هذه المشروبات؟',
    type: 'text',
    dependsOn: { question: 'q8', value: 'نعم' }
  }
},
he: {
  title: 'אורח חיים',

  q1: {
    label: 'האם אתה עוסק בפעילות גופנית?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q2: {
    label: 'איזה סוג פעילות גופנית?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'כן' }
  },

  q3: {
    label: 'האם סוג העבודה שלך משפיע על הבריאות?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q4: {
    label: 'מה סוג העבודה שלך?',
    type: 'text',
    dependsOn: { question: 'q3', value: 'כן' }
  },

  q5: {
    label: 'האם אתה מעשן סיגריות?',
    type: 'radio',
    options: ['כן', 'לא', 'לפעמים']
  },

  q6: {
    label: 'האם אתה שותה אלכוהול?',
    type: 'radio',
    options: ['כן', 'לא', 'לפעמים']
  },

  q7: {
    label: 'האם אתה שותה קפה או תה?',
    type: 'radio',
    options: ['כן', 'לא', 'לפעמים']
  },

  q7_details: {
    label: 'כמה כוסות קפה ביום?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 או יותר'],
    dependsOn: { question: 'q7', value: 'כן' }
  },

  q7b_details: {
    label: 'כמה כוסות תה ביום?',
    type: 'select',
    options: ['1', '2', '3', '4', '5 או יותר'],
    dependsOn: { question: 'q7', value: 'כן' }
  },

  q8: {
    label: 'האם אתה שותה משקאות אנרגיה?',
    type: 'radio',
    options: ['כן', 'לא', 'לפעמים']
  },

  q8_details: {
    label: 'אילו משקאות?',
    type: 'text',
    dependsOn: { question: 'q8', value: 'כן' }
  }
}

};

export type Section3Key = keyof (typeof section3)['pl'];
