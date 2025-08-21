import { LangKey } from '@/utils/i18n';

export const section7: Record<LangKey, any> = {
  pl: {
    title: 'Problemy trawienne i jelitowe',

    q1: {
      label: 'Czy często doświadczasz wzdęć?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q2: {
      label: 'Czy często masz zaparcia?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q3: {
      label: 'Czy często masz biegunki?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q4: {
      label: 'Czy często masz refluksu?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q4_details: {
      label: 'Jak często występuje refluks i w jakich sytuacjach? (np. po posiłku, stresie, wysiłku)',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Tak' }
    },

    q5: {
      label: 'Czy odczuwasz ból brzucha po posiłkach?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

      q6: {
      label: 'Ile razy dziennie się wypróżniasz?',
      type: 'select',
      options: [
        '0 – mam problem z zaparciami',
        '1',
        '2',
        '3',
        '4 i więcej'
      ]
    },
    q7: {
      label: 'Czy masz zdiagnozowane choroby jelit (IBS, SIBO, celiakia)?',
      type: 'radio',
      options: ['Tak', 'Nie']
    },

    q7_list: {
      label: 'Jakie choroby? (możesz zaznaczyć więcej niż jedną)',
      type: 'multiselect',
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
  label: 'How many times per day does sex have a bowel movement?',
  options: [
    '0 – I have constipation issues',
    '1',
    '2',
    '3',
    '4 or more'
  ]
},
q7: {
  label: 'Has sex been diagnosed with any intestinal diseases (IBS, SIBO, celiac disease)?',
  options: ['Yes', 'No']
},
q7_list: {
  label: 'Which conditions? (you can select more than one)',
  options: ['IBS', 'SIBO', 'Celiac disease', 'Other']
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
  label: 'Wie oft hat sex pro Tag Stuhlgang?',
  options: [
    '0 – Ich habe Probleme mit Verstopfung',
    '1',
    '2',
    '3',
    '4 oder mehr'
  ]
},
q7: {
  label: 'Wurde bei sex eine Darmerkrankung diagnostiziert (IBS, SIBO, Zöliakie)?',
  options: ['Ja', 'Nein']
},
q7_list: {
  label: 'Welche Erkrankungen? (mehrere möglich)',
  options: ['IBS', 'SIBO', 'Zöliakie', 'Andere']
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
  label: 'Combien de fois par jour sex a-t-il des selles ?',
  options: [
    '0 – J’ai des problèmes de constipation',
    '1',
    '2',
    '3',
    '4 ou plus'
  ]
},
q7: {
  label: 'Est-ce que sex a été diagnostiqué avec des maladies intestinales (SII, SIBO, maladie cœliaque) ?',
  options: ['Oui', 'Non']
},
q7_list: {
  label: 'Quelles maladies ? (vous pouvez en sélectionner plusieurs)',
  options: ['SII', 'SIBO', 'Maladie cœliaque', 'Autre']
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
  label: '¿Cuántas veces al día sex defeca?',
  options: [
    '0 – Tengo problemas de estreñimiento',
    '1',
    '2',
    '3',
    '4 o más'
  ]
},
q7: {
  label: '¿A sex le han diagnosticado enfermedades intestinales (SII, SIBO, celiaquía)?',
  options: ['Sí', 'No']
},
q7_list: {
  label: '¿Qué enfermedades? (puedes seleccionar más de una)',
  options: ['SII', 'SIBO', 'Celiaquía', 'Otra']
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
  label: 'Скільки разів на день sex має випорожнення?',
  options: [
    '0 – маю проблеми з запорами',
    '1',
    '2',
    '3',
    '4 і більше'
  ]
},
q7: {
  label: 'Чи було у sex діагностовано захворювання кишківника (СРК, SIBO, целіакія)?',
  options: ['Так', 'Ні']
},
q7_list: {
  label: 'Які захворювання? (можна обрати кілька)',
  options: ['СРК', 'SIBO', 'Целіакія', 'Інше']
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
  label: 'Сколько раз в день sex испражняется?',
  options: [
    '0 – есть проблемы с запорами',
    '1',
    '2',
    '3',
    '4 и более'
  ]
},
q7: {
  label: 'Были ли у sex диагностированы кишечные заболевания (СРК, SIBO, целиакия)?',
  options: ['Да', 'Нет']
},
q7_list: {
  label: 'Какие заболевания? (можно выбрать несколько)',
  options: ['СРК', 'SIBO', 'Целиакия', 'Другое']
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
  label: 'sex 每天排便多少次？',
  options: [
    '0 – 有便秘问题',
    '1',
    '2',
    '3',
    '4 次或更多'
  ]
},
q7: {
  label: 'sex 是否被诊断出肠道疾病（IBS、SIBO、乳糜泻）？',
  options: ['是', '否']
},
q7_list: {
  label: '哪些疾病？（可多选）',
  options: ['IBS', 'SIBO', '乳糜泻', '其他']
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
  label: 'sex दिन में कितनी बार मल त्याग करता/करती है?',
  options: [
    '0 – कब्ज की समस्या है',
    '1',
    '2',
    '3',
    '4 या अधिक'
  ]
},
q7: {
  label: 'क्या sex को आंतों की बीमारियाँ (IBS, SIBO, सीलिएक रोग) डायग्नोज़ हुई हैं?',
  options: ['हाँ', 'नहीं']
},
q7_list: {
  label: 'कौन-कौन सी बीमारियाँ? (एक से अधिक चुन सकते हैं)',
  options: ['IBS', 'SIBO', 'सीलिएक', 'अन्य']
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
  label: 'كم مرة يتغوط sex في اليوم؟',
  options: [
    '0 – أعاني من الإمساك',
    '1',
    '2',
    '3',
    '4 أو أكثر'
  ]
},
q7: {
  label: 'هل تم تشخيص sex بأمراض الأمعاء (IBS، SIBO، الداء البطني)؟',
  options: ['نعم', 'لا']
},
q7_list: {
  label: 'ما هي الأمراض؟ (يمكن اختيار أكثر من واحد)',
  options: ['IBS', 'SIBO', 'الداء البطني', 'أخرى']
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
  label: 'כמה פעמים ביום sex מתפנה?',
  options: [
    '0 – יש לי בעיה של עצירות',
    '1',
    '2',
    '3',
    '4 או יותר'
  ]
},
q7: {
  label: 'האם sex אובחן/ה עם מחלות מעיים (IBS, SIBO, צליאק)?',
  options: ['כן', 'לא']
},
q7_list: {
  label: 'אילו מחלות? (ניתן לבחור יותר מאחת)',
  options: ['IBS', 'SIBO', 'צליאק', 'אחר']
}

}

};

export type Section7Key = keyof (typeof section7)['pl'];

