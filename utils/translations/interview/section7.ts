import { LangKey } from '@/utils/i18n';

export const section7: Record<LangKey, any> = {
  pl: {
    title: 'Problemy trawienne i jelitowe',

    q1: {
      label: 'Czy sex często doświadcza wzdęć?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q2: {
      label: 'Czy sex często ma zaparcia?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q3: {
      label: 'Czy sex często ma biegunki?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q4: {
      label: 'Czy sex często doświadcza refluksu?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q4_details: {
      label: 'Jak często występuje refluks i w jakich sytuacjach? (np. po posiłku, stresie, wysiłku)',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Tak' }
    },

    q5: {
      label: 'Czy sex odczuwa ból brzucha po posiłkach?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q6: {
      label: 'Ile razy dziennie/tygodniowo sex się wypróżnia?',
      type: 'select',
      options: ['1', '2', '3', '4 i więcej']
    },

    q7: {
      label: 'Czy u sex zdiagnozowano choroby jelit (IBS, SIBO, celiakia)?',
      type: 'radio',
      options: ['Tak', 'Nie']
    },

    q7_list: {
      label: 'Jakie choroby? (możesz zaznaczyć więcej niż jedną)',
      type: 'select',
      options: ['IBS', 'SIBO', 'Celiakia', 'Inne'],
      dependsOn: { question: 'q7', value: 'Tak' }
    }
  },
en: {
  title: 'Digestive and intestinal issues',

  q1: {
    label: 'Does sex frequently experience bloating?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q2: {
    label: 'Does sex frequently experience constipation?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q3: {
    label: 'Does sex frequently experience diarrhea?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q4: {
    label: 'Does sex frequently experience acid reflux?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q4_details: {
    label: 'How often does reflux occur and in what situations? (e.g. after meals, stress, exercise)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Yes' }
  },

  q5: {
    label: 'Does sex feel abdominal pain after meals?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q6: {
    label: 'How many times per day/week does sex have bowel movements?',
    type: 'select',
    options: ['1', '2', '3', '4 or more']
  },

  q7: {
    label: 'Has sex been diagnosed with any intestinal diseases (IBS, SIBO, celiac)?',
    type: 'radio',
    options: ['Yes', 'No']
  },

  q7_list: {
    label: 'Which diseases? (you can select more than one)',
    type: 'select',
    options: ['IBS', 'SIBO', 'Celiac disease', 'Other'],
    dependsOn: { question: 'q7', value: 'Yes' }
  }
},
de: {
  title: 'Verdauungs- und Darmprobleme',

  q1: {
    label: 'Hat sex häufig Blähungen?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q2: {
    label: 'Hat sex häufig Verstopfung?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q3: {
    label: 'Hat sex häufig Durchfall?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q4: {
    label: 'Hat sex häufig Sodbrennen?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q4_details: {
    label: 'Wie oft tritt Sodbrennen auf und in welchen Situationen? (z. B. nach dem Essen, Stress, Bewegung)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Ja' }
  },

  q5: {
    label: 'Hat sex nach den Mahlzeiten Bauchschmerzen?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q6: {
    label: 'Wie oft pro Tag/Woche hat sex Stuhlgang?',
    type: 'select',
    options: ['1', '2', '3', '4 oder mehr']
  },

  q7: {
    label: 'Wurde bei sex eine Darmerkrankung diagnostiziert (IBS, SIBO, Zöliakie)?',
    type: 'radio',
    options: ['Ja', 'Nein']
  },

  q7_list: {
    label: 'Welche Erkrankungen? (Mehrfachauswahl möglich)',
    type: 'select',
    options: ['IBS', 'SIBO', 'Zöliakie', 'Andere'],
    dependsOn: { question: 'q7', value: 'Ja' }
  }
},
fr: {
  title: 'Problèmes digestifs et intestinaux',

  q1: {
    label: 'Sex souffre-t-il souvent de ballonnements ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q2: {
    label: 'Sex souffre-t-il souvent de constipation ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q3: {
    label: 'Sex souffre-t-il souvent de diarrhée ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q4: {
    label: 'Sex souffre-t-il souvent de reflux gastrique ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q4_details: {
    label: 'À quelle fréquence et dans quelles situations ? (ex : après les repas, stress, effort)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Oui' }
  },

  q5: {
    label: 'Sex a-t-il des douleurs abdominales après les repas ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q6: {
    label: 'Combien de fois par jour/semaine sex a-t-il des selles ?',
    type: 'select',
    options: ['1', '2', '3', '4 ou plus']
  },

  q7: {
    label: 'Sex a-t-il été diagnostiqué avec une maladie intestinale (SII, SIBO, maladie cœliaque) ?',
    type: 'radio',
    options: ['Oui', 'Non']
  },

  q7_list: {
    label: 'Lesquelles ? (vous pouvez en cocher plusieurs)',
    type: 'select',
    options: ['SII', 'SIBO', 'Maladie cœliaque', 'Autre'],
    dependsOn: { question: 'q7', value: 'Oui' }
  }
},
es: {
  title: 'Problemas digestivos e intestinales',

  q1: {
    label: '¿Sex sufre frecuentemente de hinchazón?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q2: {
    label: '¿Sex sufre frecuentemente de estreñimiento?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q3: {
    label: '¿Sex sufre frecuentemente de diarrea?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q4: {
    label: '¿Sex sufre frecuentemente de reflujo ácido?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q4_details: {
    label: '¿Con qué frecuencia ocurre el reflujo y en qué situaciones? (p. ej., después de comer, estrés, ejercicio)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Sí' }
  },

  q5: {
    label: '¿Sex siente dolor abdominal después de comer?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q6: {
    label: '¿Cuántas veces al día/semana tiene evacuaciones intestinales sex?',
    type: 'select',
    options: ['1', '2', '3', '4 o más']
  },

  q7: {
    label: '¿Le han diagnosticado a sex enfermedades intestinales (SII, SIBO, celiaquía)?',
    type: 'radio',
    options: ['Sí', 'No']
  },

  q7_list: {
    label: '¿Cuáles? (puede seleccionar más de una)',
    type: 'select',
    options: ['SII', 'SIBO', 'Celiaquía', 'Otro'],
    dependsOn: { question: 'q7', value: 'Sí' }
  }
},
ua: {
  title: 'Проблеми з травленням та кишечником',

  q1: {
    label: 'Чи часто sex відчуває здуття живота?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q2: {
    label: 'Чи часто sex має запори?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q3: {
    label: 'Чи часто sex має діарею?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q4: {
    label: 'Чи часто sex відчуває печію (рефлюкс)?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q4_details: {
    label: 'Як часто виникає рефлюкс і в яких ситуаціях? (наприклад, після їжі, стресу, фізичних навантажень)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Так' }
  },

  q5: {
    label: 'Чи відчуває sex біль у животі після їжі?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q6: {
    label: 'Скільки разів на день/тиждень sex випорожнюється?',
    type: 'select',
    options: ['1', '2', '3', '4 і більше']
  },

  q7: {
    label: 'Чи діагностували у sex захворювання кишечника (IBS, SIBO, целіакія)?',
    type: 'radio',
    options: ['Так', 'Ні']
  },

  q7_list: {
    label: 'Які саме? (можна вибрати декілька варіантів)',
    type: 'select',
    options: ['IBS', 'SIBO', 'Целіакія', 'Інше'],
    dependsOn: { question: 'q7', value: 'Так' }
  }
},
ru: {
  title: 'Пищеварительные и кишечные проблемы',

  q1: {
    label: 'Часто ли sex испытывает вздутие живота?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q2: {
    label: 'Часто ли sex страдает от запоров?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q3: {
    label: 'Часто ли sex страдает от диареи?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q4: {
    label: 'Часто ли у sex возникает изжога (рефлюкс)?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q4_details: {
    label: 'Как часто возникает рефлюкс и в каких ситуациях? (например, после еды, при стрессе, физической нагрузке)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Да' }
  },

  q5: {
    label: 'Чувствует ли sex боль в животе после еды?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q6: {
    label: 'Сколько раз в день/неделю у sex бывает стул?',
    type: 'select',
    options: ['1', '2', '3', '4 и более']
  },

  q7: {
    label: 'Диагностировали ли у sex кишечные заболевания (СРК, SIBO, целиакия)?',
    type: 'radio',
    options: ['Да', 'Нет']
  },

  q7_list: {
    label: 'Какие именно? (можно выбрать несколько вариантов)',
    type: 'select',
    options: ['СРК', 'SIBO', 'Целиакия', 'Другое'],
    dependsOn: { question: 'q7', value: 'Да' }
  }
},
zh: {
  title: '消化与肠道问题',

  q1: {
    label: 'sex 是否经常出现腹胀？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q2: {
    label: 'sex 是否经常便秘？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q3: {
    label: 'sex 是否经常腹泻？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q4: {
    label: 'sex 是否经常有胃酸反流？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q4_details: {
    label: '反流多久发生一次？在什么情况下？（如饭后、压力、运动）',
    type: 'text',
    dependsOn: { question: 'q4', value: '是' }
  },

  q5: {
    label: 'sex 是否在饭后感到腹痛？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q6: {
    label: 'sex 每天/每周排便多少次？',
    type: 'select',
    options: ['1', '2', '3', '4 次或更多']
  },

  q7: {
    label: 'sex 是否被诊断患有肠道疾病（IBS、SIBO、乳糜泻）？',
    type: 'radio',
    options: ['是', '否']
  },

  q7_list: {
    label: '有哪些？（可多选）',
    type: 'select',
    options: ['IBS', 'SIBO', '乳糜泻', '其他'],
    dependsOn: { question: 'q7', value: '是' }
  }
},
hi: {
  title: 'पाचन और आंत संबंधी समस्याएं',

  q1: {
    label: 'क्या sex को अक्सर पेट फूलने की समस्या होती है?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q2: {
    label: 'क्या sex को अक्सर कब्ज की शिकायत होती है?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q3: {
    label: 'क्या sex को अक्सर दस्त होते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q4: {
    label: 'क्या sex को अक्सर एसिड रिफ्लक्स की शिकायत होती है?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q4_details: {
    label: 'रिफ्लक्स कितनी बार होता है और किस स्थिति में? (जैसे भोजन के बाद, तनाव में, व्यायाम के बाद)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'हाँ' }
  },

  q5: {
    label: 'क्या sex को खाने के बाद पेट दर्द होता है?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q6: {
    label: 'sex दिन/सप्ताह में कितनी बार मल त्याग करता है?',
    type: 'select',
    options: ['1', '2', '3', '4 या अधिक']
  },

  q7: {
    label: 'क्या sex को आंतों की कोई बीमारी (IBS, SIBO, सीलिएक) का निदान हुआ है?',
    type: 'radio',
    options: ['हाँ', 'नहीं']
  },

  q7_list: {
    label: 'कौन-कौन सी? (एक से अधिक चुन सकते हैं)',
    type: 'select',
    options: ['IBS', 'SIBO', 'सीलिएक', 'अन्य'],
    dependsOn: { question: 'q7', value: 'हाँ' }
  }
},
ar: {
  title: 'مشاكل الجهاز الهضمي والأمعاء',

  q1: {
    label: 'هل يعاني sex من الانتفاخ بشكل متكرر؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q2: {
    label: 'هل يعاني sex من الإمساك بشكل متكرر؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q3: {
    label: 'هل يعاني sex من الإسهال بشكل متكرر؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q4: {
    label: 'هل يعاني sex من الارتجاع الحمضي بشكل متكرر؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q4_details: {
    label: 'كم مرة يحدث الارتجاع وفي أي مواقف؟ (مثل بعد الطعام، التوتر، الجهد البدني)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'نعم' }
  },

  q5: {
    label: 'هل يعاني sex من آلام في البطن بعد الأكل؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q6: {
    label: 'كم مرة في اليوم/الأسبوع يتغوط sex؟',
    type: 'select',
    options: ['1', '2', '3', '4 أو أكثر']
  },

  q7: {
    label: 'هل تم تشخيص sex بأمراض الأمعاء (IBS، SIBO، الداء الزلاقي)؟',
    type: 'radio',
    options: ['نعم', 'لا']
  },

  q7_list: {
    label: 'ما هي الأمراض؟ (يمكن اختيار أكثر من خيار)',
    type: 'select',
    options: ['IBS', 'SIBO', 'الداء الزلاقي', 'أخرى'],
    dependsOn: { question: 'q7', value: 'نعم' }
  }
},
he: {
  title: 'בעיות עיכול ומעיים',

  q1: {
    label: 'האם sex חווה נפיחות לעיתים קרובות?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q2: {
    label: 'האם sex סובל מעצירות לעיתים קרובות?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q3: {
    label: 'האם sex סובל משלשולים לעיתים קרובות?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q4: {
    label: 'האם sex סובל מצרבת או ריפלוקס לעיתים קרובות?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q4_details: {
    label: 'באיזו תדירות ובאילו מצבים זה קורה? (למשל אחרי אוכל, לחץ, פעילות גופנית)',
    type: 'text',
    dependsOn: { question: 'q4', value: 'כן' }
  },

  q5: {
    label: 'האם sex מרגיש כאבי בטן לאחר ארוחות?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q6: {
    label: 'כמה פעמים sex מתפנה ביום/שבוע?',
    type: 'select',
    options: ['1', '2', '3', '4 או יותר']
  },

  q7: {
    label: 'האם אובחנו אצל sex מחלות מעיים (IBS, SIBO, צליאק)?',
    type: 'radio',
    options: ['כן', 'לא']
  },

  q7_list: {
    label: 'אילו מחלות? (ניתן לבחור יותר מאחת)',
    type: 'select',
    options: ['IBS', 'SIBO', 'צליאק', 'אחר'],
    dependsOn: { question: 'q7', value: 'כן' }
  }
}

};

export type Section7Key = keyof (typeof section7)['pl'];

