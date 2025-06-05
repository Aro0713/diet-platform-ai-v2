import { LangKey } from '@/utils/i18n';

export const section4: Record<LangKey, any> = {
  pl: {
    title: 'Nawyki żywieniowe',

    q1: {
      label: 'Czy Pani/Pan spożywa regularne posiłki w ciągu dnia?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q2: {
      label: 'O jakich porach dnia najczęściej Pani/Pan je?',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Tak' }
    },

    q3: {
      label: 'Czy pojawia się podjadanie między posiłkami?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Czasami']
    },

    q4: {
      label: 'Czy Pani/Pan regularnie spożywa śniadania?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Rzadko']
    },

    q5: {
      label: 'Czy Pani/Pan często sięga po słodycze lub fast-foody?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Czasami']
    },

    q6: {
      label: 'Czy Pani/Pan wypija co najmniej 1,5–2 litry wody dziennie? (nie licząc kawy, herbaty, soków)',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q7: {
      label: 'Czy Pani/Pan regularnie spożywa nabiał?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Rzadko']
    },

    q8: {
      label: 'Czy Pani/Pan regularnie spożywa mięso?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Rzadko']
    },

    q9: {
      label: 'Czy Pani/Pan regularnie spożywa ryby?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Rzadko']
    },

    q10a: {
      label: 'Czy Pani/Pan regularnie spożywa warzywa?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Rzadko']
    },

    q10b: {
      label: 'Czy Pani/Pan regularnie spożywa owoce?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Rzadko']
    },

    q11: {
      label: 'Czy Pani/Pan spożywa zdrowe tłuszcze (np. oliwa z oliwek, orzechy, awokado)?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Rzadko']
    },

    q12: {
      label: 'Czy Pani/Pan często spożywa żywność przetworzoną?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Czasami']
    },

    q13: {
      label: 'W jakim stopniu przygotowuje Pani/Pan posiłki samodzielnie?',
      type: 'select',
      options: [
        'Zawsze gotuję w domu',
        'Często gotuję, czasem zamawiam/jem na mieście',
        'Często zamawiam/jem na mieście',
        'Nie gotuję wcale'
      ]
    }
  },
  en: {
  title: 'Eating habits',

  q1: {
    label: 'Do you eat meals regularly during the day?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q2: {
    label: 'At what times of the day do you usually eat?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Yes' }
  },

  q3: {
    label: 'Do you snack between meals?',
    type: 'radio',
    options: ['Yes', 'No', 'Sometimes']
  },

  q4: {
    label: 'Do you eat breakfast regularly?',
    type: 'radio',
    options: ['Yes', 'No', 'Rarely']
  },

  q5: {
    label: 'Do you often eat sweets or fast food?',
    type: 'radio',
    options: ['Yes', 'No', 'Sometimes']
  },

  q6: {
    label: 'Do you drink at least 1.5–2 liters of water daily? (not including coffee, tea, juices)',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q7: {
    label: 'Do you consume dairy regularly?',
    type: 'radio',
    options: ['Yes', 'No', 'Rarely']
  },

  q8: {
    label: 'Do you eat meat regularly?',
    type: 'radio',
    options: ['Yes', 'No', 'Rarely']
  },

  q9: {
    label: 'Do you eat fish regularly?',
    type: 'radio',
    options: ['Yes', 'No', 'Rarely']
  },

  q10a: {
    label: 'Do you eat vegetables regularly?',
    type: 'radio',
    options: ['Yes', 'No', 'Rarely']
  },

  q10b: {
    label: 'Do you eat fruit regularly?',
    type: 'radio',
    options: ['Yes', 'No', 'Rarely']
  },

  q11: {
    label: 'Do you consume healthy fats (e.g. olive oil, nuts, avocado)?',
    type: 'radio',
    options: ['Yes', 'No', 'Rarely']
  },

  q12: {
    label: 'Do you often eat processed food?',
    type: 'radio',
    options: ['Yes', 'No', 'Sometimes']
  },

  q13: {
    label: 'How often do you prepare meals at home?',
    type: 'select',
    options: [
      'I always cook at home',
      'I often cook, sometimes eat out/order',
      'I often eat out/order',
      'I never cook'
    ]
  }
},
de: {
  title: 'Ernährungsgewohnheiten',

  q1: {
    label: 'Essen Sie regelmäßig über den Tag verteilt?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q2: {
    label: 'Zu welchen Tageszeiten essen Sie normalerweise?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Ja' }
  },

  q3: {
    label: 'Naschen Sie zwischen den Mahlzeiten?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Manchmal']
  },

  q4: {
    label: 'Frühstücken Sie regelmäßig?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Selten']
  },

  q5: {
    label: 'Greifen Sie häufig zu Süßigkeiten oder Fast Food?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Manchmal']
  },

  q6: {
    label: 'Trinken Sie mindestens 1,5–2 Liter Wasser pro Tag? (ohne Kaffee, Tee oder Säfte)',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q7: {
    label: 'Konsumieren Sie regelmäßig Milchprodukte?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Selten']
  },

  q8: {
    label: 'Essen Sie regelmäßig Fleisch?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Selten']
  },

  q9: {
    label: 'Essen Sie regelmäßig Fisch?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Selten']
  },

  q10a: {
    label: 'Essen Sie regelmäßig Gemüse?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Selten']
  },

  q10b: {
    label: 'Essen Sie regelmäßig Obst?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Selten']
  },

  q11: {
    label: 'Konsumieren Sie gesunde Fette (z. B. Olivenöl, Nüsse, Avocado)?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Selten']
  },

  q12: {
    label: 'Essen Sie häufig verarbeitete Lebensmittel?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Manchmal']
  },

  q13: {
    label: 'Wie oft kochen Sie selbst zu Hause?',
    type: 'select',
    options: [
      'Ich koche immer zu Hause',
      'Ich koche oft, esse aber auch auswärts',
      'Ich esse oft auswärts oder bestelle',
      'Ich koche nie'
    ]
  }
},
fr: {
  title: 'Habitudes alimentaires',

  q1: {
    label: 'Consommez-vous des repas régulièrement pendant la journée ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q2: {
    label: 'À quels moments de la journée mangez-vous le plus souvent ?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Oui' }
  },

  q3: {
    label: 'Grignotez-vous entre les repas ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Parfois']
  },

  q4: {
    label: 'Prenez-vous un petit-déjeuner régulièrement ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Rarement']
  },

  q5: {
    label: 'Consommez-vous souvent des sucreries ou de la restauration rapide ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Parfois']
  },

  q6: {
    label: 'Buvez-vous au moins 1,5 à 2 litres d’eau par jour (hors café, thé, jus) ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q7: {
    label: 'Consommez-vous des produits laitiers régulièrement ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Rarement']
  },

  q8: {
    label: 'Mangez-vous régulièrement de la viande ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Rarement']
  },

  q9: {
    label: 'Mangez-vous régulièrement du poisson ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Rarement']
  },

  q10a: {
    label: 'Mangez-vous régulièrement des légumes ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Rarement']
  },

  q10b: {
    label: 'Mangez-vous régulièrement des fruits ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Rarement']
  },

  q11: {
    label: 'Consommez-vous des graisses saines (ex. huile d’olive, noix, avocat) ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Rarement']
  },

  q12: {
    label: 'Consommez-vous souvent des aliments transformés ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Parfois']
  },

  q13: {
    label: 'À quelle fréquence cuisinez-vous à la maison ?',
    type: 'select',
    options: [
      'Je cuisine toujours à la maison',
      'Je cuisine souvent, mais je commande aussi parfois',
      'Je mange souvent à l’extérieur ou je commande',
      'Je ne cuisine jamais'
    ]
  }
},
es: {
  title: 'Hábitos alimentarios',

  q1: {
    label: '¿Come regularmente durante el día?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q2: {
    label: '¿En qué momentos del día suele comer?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Sí' }
  },

  q3: {
    label: '¿Pica entre comidas?',
    type: 'radio',
    options: ['Sí', 'No', 'A veces']
  },

  q4: {
    label: '¿Desayuna regularmente?',
    type: 'radio',
    options: ['Sí', 'No', 'Rara vez']
  },

  q5: {
    label: '¿Suele consumir dulces o comida rápida?',
    type: 'radio',
    options: ['Sí', 'No', 'A veces']
  },

  q6: {
    label: '¿Bebe al menos 1.5–2 litros de agua al día (sin contar café, té o zumos)?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q7: {
    label: '¿Consume productos lácteos regularmente?',
    type: 'radio',
    options: ['Sí', 'No', 'Rara vez']
  },

  q8: {
    label: '¿Consume carne regularmente?',
    type: 'radio',
    options: ['Sí', 'No', 'Rara vez']
  },

  q9: {
    label: '¿Consume pescado regularmente?',
    type: 'radio',
    options: ['Sí', 'No', 'Rara vez']
  },

  q10a: {
    label: '¿Consume verduras regularmente?',
    type: 'radio',
    options: ['Sí', 'No', 'Rara vez']
  },

  q10b: {
    label: '¿Consume frutas regularmente?',
    type: 'radio',
    options: ['Sí', 'No', 'Rara vez']
  },

  q11: {
    label: '¿Consume grasas saludables (por ejemplo, aceite de oliva, nueces, aguacate)?',
    type: 'radio',
    options: ['Sí', 'No', 'Rara vez']
  },

  q12: {
    label: '¿Suele consumir alimentos procesados?',
    type: 'radio',
    options: ['Sí', 'No', 'A veces']
  },

  q13: {
    label: '¿Con qué frecuencia cocina en casa?',
    type: 'select',
    options: [
      'Siempre cocino en casa',
      'Cocino a menudo, a veces pido/comida fuera',
      'A menudo pido/comida fuera',
      'Nunca cocino'
    ]
  }
},
ua: {
  title: 'Харчові звички',

  q1: {
    label: 'Чи регулярно ви приймаєте їжу протягом дня?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q2: {
    label: 'У який час доби ви зазвичай їсте?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Так' }
  },

  q3: {
    label: 'Чи їсте ви між основними прийомами їжі?',
    type: 'radio',
    options: ['Так', 'Ні', 'Іноді']
  },

  q4: {
    label: 'Чи снідаєте ви регулярно?',
    type: 'radio',
    options: ['Так', 'Ні', 'Рідко']
  },

  q5: {
    label: 'Чи часто ви вживаєте солодощі або фастфуд?',
    type: 'radio',
    options: ['Так', 'Ні', 'Іноді']
  },

  q6: {
    label: 'Чи п’єте ви щонайменше 1,5–2 літри води на день (без чаю, кави, соків)?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q7: {
    label: 'Чи вживаєте ви молочні продукти регулярно?',
    type: 'radio',
    options: ['Так', 'Ні', 'Рідко']
  },

  q8: {
    label: 'Чи вживаєте ви м’ясо регулярно?',
    type: 'radio',
    options: ['Так', 'Ні', 'Рідко']
  },

  q9: {
    label: 'Чи вживаєте ви рибу регулярно?',
    type: 'radio',
    options: ['Так', 'Ні', 'Рідко']
  },

  q10a: {
    label: 'Чи вживаєте ви овочі регулярно?',
    type: 'radio',
    options: ['Так', 'Ні', 'Рідко']
  },

  q10b: {
    label: 'Чи вживаєте ви фрукти регулярно?',
    type: 'radio',
    options: ['Так', 'Ні', 'Рідко']
  },

  q11: {
    label: 'Чи споживаєте ви корисні жири (наприклад, оливкова олія, горіхи, авокадо)?',
    type: 'radio',
    options: ['Так', 'Ні', 'Рідко']
  },

  q12: {
    label: 'Чи часто ви їсте оброблену їжу?',
    type: 'radio',
    options: ['Так', 'Ні', 'Іноді']
  },

  q13: {
    label: 'Як часто ви готуєте їжу вдома?',
    type: 'select',
    options: [
      'Завжди готую вдома',
      'Часто готую, іноді замовляю/їм не вдома',
      'Часто замовляю або їм не вдома',
      'Ніколи не готую'
    ]
  }
},
ru: {
  title: 'Пищевые привычки',

  q1: {
    label: 'Вы регулярно питаетесь в течение дня?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q2: {
    label: 'В какое время дня вы обычно едите?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'Да' }
  },

  q3: {
    label: 'Вы перекусываете между приёмами пищи?',
    type: 'radio',
    options: ['Да', 'Нет', 'Иногда']
  },

  q4: {
    label: 'Вы регулярно завтракаете?',
    type: 'radio',
    options: ['Да', 'Нет', 'Редко']
  },

  q5: {
    label: 'Вы часто едите сладости или фастфуд?',
    type: 'radio',
    options: ['Да', 'Нет', 'Иногда']
  },

  q6: {
    label: 'Вы выпиваете не менее 1,5–2 литров воды в день (не считая чая, кофе, соков)?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q7: {
    label: 'Вы регулярно употребляете молочные продукты?',
    type: 'radio',
    options: ['Да', 'Нет', 'Редко']
  },

  q8: {
    label: 'Вы регулярно употребляете мясо?',
    type: 'radio',
    options: ['Да', 'Нет', 'Редко']
  },

  q9: {
    label: 'Вы регулярно употребляете рыбу?',
    type: 'radio',
    options: ['Да', 'Нет', 'Редко']
  },

  q10a: {
    label: 'Вы регулярно едите овощи?',
    type: 'radio',
    options: ['Да', 'Нет', 'Редко']
  },

  q10b: {
    label: 'Вы регулярно едите фрукты?',
    type: 'radio',
    options: ['Да', 'Нет', 'Редко']
  },

  q11: {
    label: 'Вы употребляете полезные жиры (например, оливковое масло, орехи, авокадо)?',
    type: 'radio',
    options: ['Да', 'Нет', 'Редко']
  },

  q12: {
    label: 'Вы часто употребляете переработанные продукты?',
    type: 'radio',
    options: ['Да', 'Нет', 'Иногда']
  },

  q13: {
    label: 'Как часто вы готовите дома?',
    type: 'select',
    options: [
      'Всегда готовлю дома',
      'Часто готовлю, иногда заказываю/ем вне дома',
      'Часто ем вне дома или заказываю',
      'Никогда не готовлю'
    ]
  }
},
zh: {
  title: '饮食习惯',

  q1: {
    label: '您每天是否规律进餐？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q2: {
    label: '您通常在一天中的哪些时间进餐？',
    type: 'text',
    dependsOn: { question: 'q1', value: '是' }
  },

  q3: {
    label: '您是否在正餐之间加餐？',
    type: 'radio',
    options: ['是', '否', '有时']
  },

  q4: {
    label: '您是否规律吃早餐？',
    type: 'radio',
    options: ['是', '否', '很少']
  },

  q5: {
    label: '您是否经常食用甜食或快餐？',
    type: 'radio',
    options: ['是', '否', '有时']
  },

  q6: {
    label: '您每天是否饮用至少1.5–2升水？（不包括茶、咖啡、果汁）',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q7: {
    label: '您是否定期食用乳制品？',
    type: 'radio',
    options: ['是', '否', '很少']
  },

  q8: {
    label: '您是否定期食用肉类？',
    type: 'radio',
    options: ['是', '否', '很少']
  },

  q9: {
    label: '您是否定期食用鱼类？',
    type: 'radio',
    options: ['是', '否', '很少']
  },

  q10a: {
    label: '您是否定期食用蔬菜？',
    type: 'radio',
    options: ['是', '否', '很少']
  },

  q10b: {
    label: '您是否定期食用水果？',
    type: 'radio',
    options: ['是', '否', '很少']
  },

  q11: {
    label: '您是否食用健康脂肪（例如橄榄油、坚果、鳄梨）？',
    type: 'radio',
    options: ['是', '否', '很少']
  },

  q12: {
    label: '您是否经常食用加工食品？',
    type: 'radio',
    options: ['是', '否', '有时']
  },

  q13: {
    label: '您在家做饭的频率如何？',
    type: 'select',
    options: [
      '总是在家做饭',
      '经常做饭，有时外食/点餐',
      '经常外食/点餐',
      '从不做饭'
    ]
  }
},
hi: {
  title: 'खानपान की आदतें',

  q1: {
    label: 'क्या आप दिन में नियमित रूप से भोजन करते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q2: {
    label: 'आप दिन में आमतौर पर किस समय भोजन करते हैं?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'हाँ' }
  },

  q3: {
    label: 'क्या आप खाने के बीच में स्नैक लेते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q4: {
    label: 'क्या आप नियमित रूप से नाश्ता करते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q5: {
    label: 'क्या आप अक्सर मिठाइयाँ या फास्ट फूड खाते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q6: {
    label: 'क्या आप प्रतिदिन कम से कम 1.5–2 लीटर पानी पीते हैं? (चाय, कॉफी, जूस को छोड़कर)',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q7: {
    label: 'क्या आप नियमित रूप से डेयरी उत्पादों का सेवन करते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q8: {
    label: 'क्या आप नियमित रूप से मांस खाते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q9: {
    label: 'क्या आप नियमित रूप से मछली खाते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q10a: {
    label: 'क्या आप नियमित रूप से सब्जियाँ खाते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q10b: {
    label: 'क्या आप नियमित रूप से फल खाते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q11: {
    label: 'क्या आप स्वस्थ वसा (जैसे जैतून का तेल, नट्स, एवोकाडो) का सेवन करते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q12: {
    label: 'क्या आप अक्सर प्रसंस्कृत खाद्य पदार्थ खाते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'कभी-कभी']
  },

  q13: {
    label: 'आप घर पर कितनी बार खाना बनाते हैं?',
    type: 'select',
    options: [
      'हमेशा घर पर बनाता हूँ',
      'अक्सर बनाता हूँ, कभी-कभी बाहर से मंगवाता/खाता हूँ',
      'अक्सर बाहर खाता हूँ या मंगवाता हूँ',
      'कभी नहीं बनाता'
    ]
  }
},
ar: {
  title: 'العادات الغذائية',

  q1: {
    label: 'هل تتناول وجبات منتظمة خلال اليوم؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q2: {
    label: 'ما هي أوقات تناول الطعام عادة؟',
    type: 'text',
    dependsOn: { question: 'q1', value: 'نعم' }
  },

  q3: {
    label: 'هل تتناول وجبات خفيفة بين الوجبات؟',
    type: 'radio',
    options: ['نعم', 'لا', 'أحياناً']
  },

  q4: {
    label: 'هل تتناول وجبة الإفطار بانتظام؟',
    type: 'radio',
    options: ['نعم', 'لا', 'نادراً']
  },

  q5: {
    label: 'هل تتناول الحلويات أو الوجبات السريعة كثيراً؟',
    type: 'radio',
    options: ['نعم', 'لا', 'أحياناً']
  },

  q6: {
    label: 'هل تشرب ما لا يقل عن 1.5–2 لتر من الماء يوميًا؟ (باستثناء الشاي، القهوة، العصائر)',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q7: {
    label: 'هل تتناول منتجات الألبان بانتظام؟',
    type: 'radio',
    options: ['نعم', 'لا', 'نادراً']
  },

  q8: {
    label: 'هل تتناول اللحوم بانتظام؟',
    type: 'radio',
    options: ['نعم', 'لا', 'نادراً']
  },

  q9: {
    label: 'هل تتناول الأسماك بانتظام؟',
    type: 'radio',
    options: ['نعم', 'لا', 'نادراً']
  },

  q10a: {
    label: 'هل تتناول الخضروات بانتظام؟',
    type: 'radio',
    options: ['نعم', 'لا', 'نادراً']
  },

  q10b: {
    label: 'هل تتناول الفواكه بانتظام؟',
    type: 'radio',
    options: ['نعم', 'لا', 'نادراً']
  },

  q11: {
    label: 'هل تتناول الدهون الصحية (مثل زيت الزيتون، المكسرات، الأفوكادو)؟',
    type: 'radio',
    options: ['نعم', 'لا', 'نادراً']
  },

  q12: {
    label: 'هل تتناول الأطعمة المصنعة كثيراً؟',
    type: 'radio',
    options: ['نعم', 'لا', 'أحياناً']
  },

  q13: {
    label: 'كم مرة تطهو الطعام في المنزل؟',
    type: 'select',
    options: [
      'أطبخ دائماً في المنزل',
      'أطبخ كثيراً، أطلب أو أتناول خارج المنزل أحياناً',
      'أطلب أو أتناول خارج المنزل كثيراً',
      'لا أطبخ أبداً'
    ]
  }
},
he: {
  title: 'הרגלי תזונה',

  q1: {
    label: 'האם אתה אוכל ארוחות באופן קבוע במהלך היום?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q2: {
    label: 'באילו שעות ביום אתה בדרך כלל אוכל?',
    type: 'text',
    dependsOn: { question: 'q1', value: 'כן' }
  },

  q3: {
    label: 'האם אתה אוכל בין הארוחות?',
    type: 'radio',
    options: ['כן', 'לא', 'לפעמים']
  },

  q4: {
    label: 'האם אתה אוכל ארוחת בוקר באופן קבוע?',
    type: 'radio',
    options: ['כן', 'לא', 'לעיתים נדירות']
  },

  q5: {
    label: 'האם אתה אוכל הרבה ממתקים או ג’אנק פוד?',
    type: 'radio',
    options: ['כן', 'לא', 'לפעמים']
  },

  q6: {
    label: 'האם אתה שותה לפחות 1.5–2 ליטר מים ביום? (ללא תה, קפה, מיצים)',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q7: {
    label: 'האם אתה צורך מוצרי חלב באופן קבוע?',
    type: 'radio',
    options: ['כן', 'לא', 'לעיתים נדירות']
  },

  q8: {
    label: 'האם אתה אוכל בשר באופן קבוע?',
    type: 'radio',
    options: ['כן', 'לא', 'לעיתים נדירות']
  },

  q9: {
    label: 'האם אתה אוכל דגים באופן קבוע?',
    type: 'radio',
    options: ['כן', 'לא', 'לעיתים נדירות']
  },

  q10a: {
    label: 'האם אתה אוכל ירקות באופן קבוע?',
    type: 'radio',
    options: ['כן', 'לא', 'לעיתים נדירות']
  },

  q10b: {
    label: 'האם אתה אוכל פירות באופן קבוע?',
    type: 'radio',
    options: ['כן', 'לא', 'לעיתים נדירות']
  },

  q11: {
    label: 'האם אתה צורך שומנים בריאים (כמו שמן זית, אגוזים, אבוקדו)?',
    type: 'radio',
    options: ['כן', 'לא', 'לעיתים נדירות']
  },

  q12: {
    label: 'האם אתה אוכל הרבה מזון מעובד?',
    type: 'radio',
    options: ['כן', 'לא', 'לפעמים']
  },

  q13: {
    label: 'באיזו תדירות אתה מבשל בבית?',
    type: 'select',
    options: [
      'תמיד מבשל בבית',
      'מבשל לעיתים קרובות, לפעמים מזמין/אוכל בחוץ',
      'לעיתים קרובות מזמין או אוכל בחוץ',
      'אף פעם לא מבשל'
    ]
  }
}
};

export type Section4Key = keyof (typeof section4)['pl'];