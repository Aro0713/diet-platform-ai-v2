import { LangKey } from '@/utils/i18n';

export const section2: Record<LangKey, any> = {
  pl: {
    title: 'Stan zdrowia',

    q1: {
      label: 'Czy choruje Pani/Pan na choroby przewlekłe?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q2: {
      label: 'Jakie choroby przewlekłe?',
      type: 'select',
      options: ['Cukrzyca', 'Nadciśnienie', 'Tarczyca', 'PCOS', 'Inne'],
      dependsOn: { question: 'q1', value: 'Tak' }
    },

    q2_other: {
      label: 'Inne choroby przewlekłe – doprecyzuj',
      type: 'text',
      dependsOn: { question: 'q2', value: 'Inne' }
    },

    q3: {
      label: 'Czy były diagnozowane choroby dietozależne?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q4: {
      label: 'Jakie choroby dietozależne?',
      type: 'select',
      options: ['Insulinooporność', 'Hipercholesterolemia', 'Inne'],
      dependsOn: { question: 'q3', value: 'Tak' }
    },

    q4_other: {
      label: 'Inne choroby dietozależne – doprecyzuj',
      type: 'text',
      dependsOn: { question: 'q4', value: 'Inne' }
    },

    q5: {
      label: 'Czy występują problemy żołądkowo-jelitowe?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q6: {
      label: 'Jakie problemy żołądkowo-jelitowe występują?',
      type: 'select',
      options: ['Wzdęcia', 'Zaparcia', 'Biegunki', 'Refluks', 'Inne'],
      dependsOn: { question: 'q5', value: 'Tak' }
    },

    q6_other: {
      label: 'Inne problemy żołądkowo-jelitowe – doprecyzuj',
      type: 'text',
      dependsOn: { question: 'q6', value: 'Inne' }
    },

    q7: {
      label: 'Czy ma Pani/Pan alergie lub nietolerancje pokarmowe?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q8: {
      label: 'Jakie alergie lub nietolerancje?',
      type: 'text',
      dependsOn: { question: 'q7', value: 'Tak' }
    },

    q9: {
      label: 'Czy przyjmuje Pani/Pan leki na stałe?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q10: {
      label: 'Jakie leki?',
      type: 'text',
      dependsOn: { question: 'q9', value: 'Tak' }
    },

    q11: {
      label: 'Czy stosuje Pani/Pan suplementy diety?',
      type: 'radio',
      options: ['Tak', 'Nie', 'Nie wiem']
    },

    q12: {
      label: 'Jakie suplementy?',
      type: 'text',
      dependsOn: { question: 'q11', value: 'Tak' }
    },

    q13: {
  label: 'Jak ocenia Pani/Pan poziom stresu?',
  type: 'select',
  options: ['Niski', 'Średni', 'Wysoki', 'Bardzo wysoki']
},

  q14: {
    label: 'Jak ocenia Pani/Pan jakość snu?',
    type: 'select',
    options: [
      'Bardzo zła (częste wybudzenia)',
      'Średnia (sen przerywany)',
      'Dobra',
      'Bardzo dobra (śpię jak suseł 💤)'
    ]
  },
},
 en: {
  title: 'Health status',

  q1: {
    label: 'Do you suffer from chronic diseases?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q2: {
    label: 'Which chronic diseases?',
    type: 'select',
    options: ['Diabetes', 'Hypertension', 'Thyroid', 'PCOS', 'Other'],
    dependsOn: { question: 'q1', value: 'Yes' }
  },

  q2_other: {
    label: 'Other chronic diseases – please specify',
    type: 'text',
    dependsOn: { question: 'q2', value: 'Other' }
  },

  q3: {
    label: 'Have diet-related diseases been diagnosed?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q4: {
    label: 'Which diet-related diseases?',
    type: 'select',
    options: ['Insulin resistance', 'Hypercholesterolemia', 'Other'],
    dependsOn: { question: 'q3', value: 'Yes' }
  },

  q4_other: {
    label: 'Other diet-related diseases – please specify',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Other' }
  },

  q5: {
    label: 'Do you experience gastrointestinal issues?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q6: {
    label: 'Which gastrointestinal issues?',
    type: 'select',
    options: ['Bloating', 'Constipation', 'Diarrhea', 'Reflux', 'Other'],
    dependsOn: { question: 'q5', value: 'Yes' }
  },

  q6_other: {
    label: 'Other gastrointestinal issues – please specify',
    type: 'text',
    dependsOn: { question: 'q6', value: 'Other' }
  },

  q7: {
    label: 'Do you have any food allergies or intolerances?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q8: {
    label: 'Which allergies or intolerances?',
    type: 'text',
    dependsOn: { question: 'q7', value: 'Yes' }
  },

  q9: {
    label: 'Do you take any medications regularly?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q10: {
    label: 'Which medications?',
    type: 'text',
    dependsOn: { question: 'q9', value: 'Yes' }
  },

  q11: {
    label: 'Do you take dietary supplements?',
    type: 'radio',
    options: ['Yes', 'No', 'I don’t know']
  },

  q12: {
    label: 'Which supplements?',
    type: 'text',
    dependsOn: { question: 'q11', value: 'Yes' }
  },

  q13: {
    label: 'How do you assess your stress level?',
    type: 'select',
    options: ['Low', 'Medium', 'High', 'Very high']
  },

  q14: {
    label: 'How do you assess your sleep quality?',
    type: 'select',
    options: [
      'Very poor (frequent waking)',
      'Average (interrupted sleep)',
      'Good',
      'Very good (sleeping like a baby 💤)'
    ]
  }
},
de: {
  title: 'Gesundheitszustand',

  q1: {
    label: 'Leiden Sie an chronischen Erkrankungen?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q2: {
    label: 'Welche chronischen Erkrankungen?',
    type: 'select',
    options: ['Diabetes', 'Bluthochdruck', 'Schilddrüse', 'PCOS', 'Andere'],
    dependsOn: { question: 'q1', value: 'Ja' }
  },

  q2_other: {
    label: 'Andere chronische Erkrankungen – bitte angeben',
    type: 'text',
    dependsOn: { question: 'q2', value: 'Andere' }
  },

  q3: {
    label: 'Wurden ernährungsbedingte Erkrankungen diagnostiziert?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q4: {
    label: 'Welche ernährungsbedingten Erkrankungen?',
    type: 'select',
    options: ['Insulinresistenz', 'Hypercholesterinämie', 'Andere'],
    dependsOn: { question: 'q3', value: 'Ja' }
  },

  q4_other: {
    label: 'Andere ernährungsbedingte Erkrankungen – bitte angeben',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Andere' }
  },

  q5: {
    label: 'Haben Sie Magen-Darm-Beschwerden?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q6: {
    label: 'Welche Magen-Darm-Beschwerden?',
    type: 'select',
    options: ['Blähungen', 'Verstopfung', 'Durchfall', 'Reflux', 'Andere'],
    dependsOn: { question: 'q5', value: 'Ja' }
  },

  q6_other: {
    label: 'Andere Magen-Darm-Beschwerden – bitte angeben',
    type: 'text',
    dependsOn: { question: 'q6', value: 'Andere' }
  },

  q7: {
    label: 'Haben Sie Nahrungsmittelallergien oder -unverträglichkeiten?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q8: {
    label: 'Welche Allergien oder Unverträglichkeiten?',
    type: 'text',
    dependsOn: { question: 'q7', value: 'Ja' }
  },

  q9: {
    label: 'Nehmen Sie regelmäßig Medikamente ein?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q10: {
    label: 'Welche Medikamente?',
    type: 'text',
    dependsOn: { question: 'q9', value: 'Ja' }
  },

  q11: {
    label: 'Nehmen Sie Nahrungsergänzungsmittel ein?',
    type: 'radio',
    options: ['Ja', 'Nein', 'Ich weiß nicht']
  },

  q12: {
    label: 'Welche Nahrungsergänzungsmittel?',
    type: 'text',
    dependsOn: { question: 'q11', value: 'Ja' }
  },

  q13: {
    label: 'Wie schätzen Sie Ihr Stressniveau ein?',
    type: 'select',
    options: ['Niedrig', 'Mittel', 'Hoch', 'Sehr hoch']
  },

  q14: {
    label: 'Wie schätzen Sie Ihre Schlafqualität ein?',
    type: 'select',
    options: [
      'Sehr schlecht (häufiges Aufwachen)',
      'Durchschnittlich (unterbrochener Schlaf)',
      'Gut',
      'Sehr gut (schlafe wie ein Baby 💤)'
    ]
  }
},
fr: {
  title: 'État de santé',

  q1: {
    label: 'Souffrez-vous de maladies chroniques ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q2: {
    label: 'Quelles maladies chroniques ?',
    type: 'select',
    options: ['Diabète', 'Hypertension', 'Thyroïde', 'SOPK', 'Autre'],
    dependsOn: { question: 'q1', value: 'Oui' }
  },

  q2_other: {
    label: 'Autres maladies chroniques – précisez',
    type: 'text',
    dependsOn: { question: 'q2', value: 'Autre' }
  },

  q3: {
    label: 'Des maladies liées à l’alimentation ont-elles été diagnostiquées ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q4: {
    label: 'Lesquelles ?',
    type: 'select',
    options: ['Résistance à l’insuline', 'Hypercholestérolémie', 'Autre'],
    dependsOn: { question: 'q3', value: 'Oui' }
  },

  q4_other: {
    label: 'Autres maladies liées à l’alimentation – précisez',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Autre' }
  },

  q5: {
    label: 'Avez-vous des troubles gastro-intestinaux ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q6: {
    label: 'Lesquels ?',
    type: 'select',
    options: ['Ballonnements', 'Constipation', 'Diarrhée', 'Reflux', 'Autre'],
    dependsOn: { question: 'q5', value: 'Oui' }
  },

  q6_other: {
    label: 'Autres troubles gastro-intestinaux – précisez',
    type: 'text',
    dependsOn: { question: 'q6', value: 'Autre' }
  },

  q7: {
    label: 'Avez-vous des allergies ou intolérances alimentaires ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q8: {
    label: 'Lesquelles ?',
    type: 'text',
    dependsOn: { question: 'q7', value: 'Oui' }
  },

  q9: {
    label: 'Prenez-vous des médicaments régulièrement ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q10: {
    label: 'Lesquels ?',
    type: 'text',
    dependsOn: { question: 'q9', value: 'Oui' }
  },

  q11: {
    label: 'Prenez-vous des compléments alimentaires ?',
    type: 'radio',
    options: ['Oui', 'Non', 'Je ne sais pas']
  },

  q12: {
    label: 'Lesquels ?',
    type: 'text',
    dependsOn: { question: 'q11', value: 'Oui' }
  },

  q13: {
    label: 'Comment évaluez-vous votre niveau de stress ?',
    type: 'select',
    options: ['Faible', 'Moyen', 'Élevé', 'Très élevé']
  },

  q14: {
    label: 'Comment évaluez-vous la qualité de votre sommeil ?',
    type: 'select',
    options: [
      'Très mauvaise (réveils fréquents)',
      'Moyenne (sommeil interrompu)',
      'Bonne',
      'Très bonne (je dors comme un loir 💤)'
    ]
  }
},
es: {
  title: 'Estado de salud',

  q1: {
    label: '¿Tiene enfermedades crónicas?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q2: {
    label: '¿Qué enfermedades crónicas?',
    type: 'select',
    options: ['Diabetes', 'Hipertensión', 'Tiroides', 'SOP', 'Otra'],
    dependsOn: { question: 'q1', value: 'Sí' }
  },

  q2_other: {
    label: 'Otras enfermedades crónicas – especifique',
    type: 'text',
    dependsOn: { question: 'q2', value: 'Otra' }
  },

  q3: {
    label: '¿Se le han diagnosticado enfermedades relacionadas con la dieta?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q4: {
    label: '¿Cuáles?',
    type: 'select',
    options: ['Resistencia a la insulina', 'Hipercolesterolemia', 'Otra'],
    dependsOn: { question: 'q3', value: 'Sí' }
  },

  q4_other: {
    label: 'Otras enfermedades dietéticas – especifique',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Otra' }
  },

  q5: {
    label: '¿Tiene problemas gastrointestinales?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q6: {
    label: '¿Cuáles?',
    type: 'select',
    options: ['Hinchazón', 'Estreñimiento', 'Diarrea', 'Reflujo', 'Otra'],
    dependsOn: { question: 'q5', value: 'Sí' }
  },

  q6_other: {
    label: 'Otros problemas gastrointestinales – especifique',
    type: 'text',
    dependsOn: { question: 'q6', value: 'Otra' }
  },

  q7: {
    label: '¿Tiene alergias o intolerancias alimentarias?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q8: {
    label: '¿Cuáles?',
    type: 'text',
    dependsOn: { question: 'q7', value: 'Sí' }
  },

  q9: {
    label: '¿Toma medicamentos de forma regular?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q10: {
    label: '¿Cuáles?',
    type: 'text',
    dependsOn: { question: 'q9', value: 'Sí' }
  },

  q11: {
    label: '¿Toma suplementos nutricionales?',
    type: 'radio',
    options: ['Sí', 'No', 'No lo sé']
  },

  q12: {
    label: '¿Cuáles?',
    type: 'text',
    dependsOn: { question: 'q11', value: 'Sí' }
  },

  q13: {
    label: '¿Cómo evalúa su nivel de estrés?',
    type: 'select',
    options: ['Bajo', 'Medio', 'Alto', 'Muy alto']
  },

  q14: {
    label: '¿Cómo evalúa la calidad de su sueño?',
    type: 'select',
    options: [
      'Muy mala (despertares frecuentes)',
      'Media (sueño interrumpido)',
      'Buena',
      'Muy buena (duermo como un bebé 💤)'
    ]
  }
},
ua: {
  title: 'Стан здоров’я',

  q1: {
    label: 'Чи страждаєте ви на хронічні захворювання?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q2: {
    label: 'Які саме хронічні захворювання?',
    type: 'select',
    options: ['Діабет', 'Гіпертонія', 'Щитоподібна залоза', 'СПКЯ', 'Інше'],
    dependsOn: { question: 'q1', value: 'Так' }
  },

  q2_other: {
    label: 'Інші хронічні захворювання – уточніть',
    type: 'text',
    dependsOn: { question: 'q2', value: 'Інше' }
  },

  q3: {
    label: 'Чи були діагностовані захворювання, пов’язані з харчуванням?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q4: {
    label: 'Які саме?',
    type: 'select',
    options: ['Інсулінорезистентність', 'Гіперхолестеринемія', 'Інше'],
    dependsOn: { question: 'q3', value: 'Так' }
  },

  q4_other: {
    label: 'Інші захворювання – уточніть',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Інше' }
  },

  q5: {
    label: 'Чи є проблеми з травленням?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q6: {
    label: 'Які саме?',
    type: 'select',
    options: ['Здуття', 'Закреп', 'Діарея', 'Рефлюкс', 'Інше'],
    dependsOn: { question: 'q5', value: 'Так' }
  },

  q6_other: {
    label: 'Інші проблеми – уточніть',
    type: 'text',
    dependsOn: { question: 'q6', value: 'Інше' }
  },

  q7: {
    label: 'Чи є у вас алергії або непереносимості їжі?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q8: {
    label: 'Які саме?',
    type: 'text',
    dependsOn: { question: 'q7', value: 'Так' }
  },

  q9: {
    label: 'Чи приймаєте ви постійно ліки?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q10: {
    label: 'Які саме?',
    type: 'text',
    dependsOn: { question: 'q9', value: 'Так' }
  },

  q11: {
    label: 'Чи приймаєте ви харчові добавки?',
    type: 'radio',
    options: ['Так', 'Ні', 'Не знаю']
  },

  q12: {
    label: 'Які саме?',
    type: 'text',
    dependsOn: { question: 'q11', value: 'Так' }
  },

  q13: {
    label: 'Як ви оцінюєте рівень стресу?',
    type: 'select',
    options: ['Низький', 'Середній', 'Високий', 'Дуже високий']
  },

  q14: {
    label: 'Як ви оцінюєте якість сну?',
    type: 'select',
    options: [
      'Дуже погана (часті пробудження)',
      'Середня (переривчастий сон)',
      'Добра',
      'Дуже добра (сплю як немовля 💤)'
    ]
  }
},
ru: {
  title: 'Состояние здоровья',

  q1: {
    label: 'Есть ли у вас хронические заболевания?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q2: {
    label: 'Какие хронические заболевания?',
    type: 'select',
    options: ['Диабет', 'Гипертония', 'Щитовидка', 'СПКЯ', 'Другое'],
    dependsOn: { question: 'q1', value: 'Да' }
  },

  q2_other: {
    label: 'Другие хронические заболевания – уточните',
    type: 'text',
    dependsOn: { question: 'q2', value: 'Другое' }
  },

  q3: {
    label: 'Были ли диагностированы диетозависимые заболевания?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q4: {
    label: 'Какие?',
    type: 'select',
    options: ['Инсулинорезистентность', 'Гиперхолестеринемия', 'Другое'],
    dependsOn: { question: 'q3', value: 'Да' }
  },

  q4_other: {
    label: 'Другие заболевания – уточните',
    type: 'text',
    dependsOn: { question: 'q4', value: 'Другое' }
  },

  q5: {
    label: 'Есть ли проблемы с пищеварением?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q6: {
    label: 'Какие проблемы?',
    type: 'select',
    options: ['Вздутие', 'Запоры', 'Диарея', 'Рефлюкс', 'Другое'],
    dependsOn: { question: 'q5', value: 'Да' }
  },

  q6_other: {
    label: 'Другие проблемы – уточните',
    type: 'text',
    dependsOn: { question: 'q6', value: 'Другое' }
  },

  q7: {
    label: 'Есть ли у вас пищевая аллергия или непереносимость?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q8: {
    label: 'Какая?',
    type: 'text',
    dependsOn: { question: 'q7', value: 'Да' }
  },

  q9: {
    label: 'Принимаете ли вы лекарства на постоянной основе?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q10: {
    label: 'Какие лекарства?',
    type: 'text',
    dependsOn: { question: 'q9', value: 'Да' }
  },

  q11: {
    label: 'Принимаете ли вы пищевые добавки?',
    type: 'radio',
    options: ['Да', 'Нет', 'Не знаю']
  },

  q12: {
    label: 'Какие добавки?',
    type: 'text',
    dependsOn: { question: 'q11', value: 'Да' }
  },

  q13: {
    label: 'Как вы оцениваете уровень стресса?',
    type: 'select',
    options: ['Низкий', 'Средний', 'Высокий', 'Очень высокий']
  },

  q14: {
    label: 'Как вы оцениваете качество сна?',
    type: 'select',
    options: [
      'Очень плохое (частые пробуждения)',
      'Среднее (прерывистый сон)',
      'Хорошее',
      'Очень хорошее (сплю как младенец 💤)'
    ]
  }
},
zh: {
  title: '健康状况',

  q1: {
    label: '您是否患有慢性疾病？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q2: {
    label: '哪些慢性疾病？',
    type: 'select',
    options: ['糖尿病', '高血压', '甲状腺', '多囊卵巢', '其他'],
    dependsOn: { question: 'q1', value: '是' }
  },

  q2_other: {
    label: '其他慢性疾病 – 请说明',
    type: 'text',
    dependsOn: { question: 'q2', value: '其他' }
  },

  q3: {
    label: '是否被诊断为饮食相关疾病？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q4: {
    label: '哪些？',
    type: 'select',
    options: ['胰岛素抵抗', '高胆固醇血症', '其他'],
    dependsOn: { question: 'q3', value: '是' }
  },

  q4_other: {
    label: '其他疾病 – 请说明',
    type: 'text',
    dependsOn: { question: 'q4', value: '其他' }
  },

  q5: {
    label: '是否有胃肠问题？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q6: {
    label: '哪些问题？',
    type: 'select',
    options: ['腹胀', '便秘', '腹泻', '反流', '其他'],
    dependsOn: { question: 'q5', value: '是' }
  },

  q6_other: {
    label: '其他问题 – 请说明',
    type: 'text',
    dependsOn: { question: 'q6', value: '其他' }
  },

  q7: {
    label: '是否有食物过敏或不耐受？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q8: {
    label: '哪些？',
    type: 'text',
    dependsOn: { question: 'q7', value: '是' }
  },

  q9: {
    label: '您是否长期服用药物？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q10: {
    label: '哪些药物？',
    type: 'text',
    dependsOn: { question: 'q9', value: '是' }
  },

  q11: {
    label: '您是否服用膳食补充剂？',
    type: 'radio',
    options: ['是', '否', '不确定']
  },

  q12: {
    label: '哪些补充剂？',
    type: 'text',
    dependsOn: { question: 'q11', value: '是' }
  },

  q13: {
    label: '您如何评估自己的压力水平？',
    type: 'select',
    options: ['低', '中等', '高', '非常高']
  },

  q14: {
    label: '您如何评估自己的睡眠质量？',
    type: 'select',
    options: [
      '非常差（经常醒来）',
      '一般（睡眠中断）',
      '良好',
      '非常好（睡得像婴儿 💤）'
    ]
  }
},
hi: {
  title: 'स्वास्थ्य स्थिति',

  q1: {
    label: 'क्या आप किसी पुरानी बीमारी से ग्रसित हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q2: {
    label: 'कौन सी बीमारियाँ?',
    type: 'select',
    options: ['डायबिटीज', 'हाई ब्लड प्रेशर', 'थायरॉइड', 'PCOS', 'अन्य'],
    dependsOn: { question: 'q1', value: 'हाँ' }
  },

  q2_other: {
    label: 'अन्य पुरानी बीमारियाँ – कृपया स्पष्ट करें',
    type: 'text',
    dependsOn: { question: 'q2', value: 'अन्य' }
  },

  q3: {
    label: 'क्या आहार से जुड़ी बीमारियों का निदान किया गया है?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q4: {
    label: 'कौन सी?',
    type: 'select',
    options: ['इंसुलिन प्रतिरोध', 'हाइपरकोलेस्ट्रोलेमिया', 'अन्य'],
    dependsOn: { question: 'q3', value: 'हाँ' }
  },

  q4_other: {
    label: 'अन्य बीमारियाँ – कृपया स्पष्ट करें',
    type: 'text',
    dependsOn: { question: 'q4', value: 'अन्य' }
  },

  q5: {
    label: 'क्या आपको पाचन संबंधी समस्याएँ हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q6: {
    label: 'कौन सी समस्याएँ?',
    type: 'select',
    options: ['गैस', 'कब्ज', 'दस्त', 'एसिडिटी', 'अन्य'],
    dependsOn: { question: 'q5', value: 'हाँ' }
  },

  q6_other: {
    label: 'अन्य समस्याएँ – कृपया स्पष्ट करें',
    type: 'text',
    dependsOn: { question: 'q6', value: 'अन्य' }
  },

  q7: {
    label: 'क्या आपको किसी खाद्य पदार्थ से एलर्जी या असहिष्णुता है?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q8: {
    label: 'कौन सी?',
    type: 'text',
    dependsOn: { question: 'q7', value: 'हाँ' }
  },

  q9: {
    label: 'क्या आप नियमित रूप से दवाएं लेते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q10: {
    label: 'कौन सी दवाएं?',
    type: 'text',
    dependsOn: { question: 'q9', value: 'हाँ' }
  },

  q11: {
    label: 'क्या आप सप्लीमेंट लेते हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं', 'पता नहीं']
  },

  q12: {
    label: 'कौन से सप्लीमेंट?',
    type: 'text',
    dependsOn: { question: 'q11', value: 'हाँ' }
  },

  q13: {
    label: 'आप तनाव स्तर को कैसे आंकते हैं?',
    type: 'select',
    options: ['कम', 'मध्यम', 'ज्यादा', 'बहुत ज्यादा']
  },

  q14: {
    label: 'आप नींद की गुणवत्ता को कैसे आंकते हैं?',
    type: 'select',
    options: [
      'बहुत खराब (बार-बार नींद खुलना)',
      'औसत (टूटी-फूटी नींद)',
      'अच्छी',
      'बहुत अच्छी (बिलकुल आरामदायक 💤)'
    ]
  }
},
ar: {
  title: 'الحالة الصحية',

  q1: {
    label: 'هل تعاني من أمراض مزمنة؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q2: {
    label: 'ما هي الأمراض المزمنة؟',
    type: 'select',
    options: ['السكري', 'ارتفاع ضغط الدم', 'الغدة الدرقية', 'تكيس المبايض', 'أخرى'],
    dependsOn: { question: 'q1', value: 'نعم' }
  },

  q2_other: {
    label: 'أمراض أخرى – يرجى التوضيح',
    type: 'text',
    dependsOn: { question: 'q2', value: 'أخرى' }
  },

  q3: {
    label: 'هل تم تشخيص أمراض متعلقة بالغذاء؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q4: {
    label: 'ما هي؟',
    type: 'select',
    options: ['مقاومة الإنسولين', 'فرط كوليسترول الدم', 'أخرى'],
    dependsOn: { question: 'q3', value: 'نعم' }
  },

  q4_other: {
    label: 'أمراض أخرى – يرجى التوضيح',
    type: 'text',
    dependsOn: { question: 'q4', value: 'أخرى' }
  },

  q5: {
    label: 'هل تعاني من مشاكل في الجهاز الهضمي؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q6: {
    label: 'ما هي؟',
    type: 'select',
    options: ['انتفاخ', 'إمساك', 'إسهال', 'ارتجاع', 'أخرى'],
    dependsOn: { question: 'q5', value: 'نعم' }
  },

  q6_other: {
    label: 'مشاكل أخرى – يرجى التوضيح',
    type: 'text',
    dependsOn: { question: 'q6', value: 'أخرى' }
  },

  q7: {
    label: 'هل لديك أي حساسية أو عدم تحمل غذائي؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q8: {
    label: 'ما هي؟',
    type: 'text',
    dependsOn: { question: 'q7', value: 'نعم' }
  },

  q9: {
    label: 'هل تتناول أدوية بانتظام؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q10: {
    label: 'ما هي الأدوية؟',
    type: 'text',
    dependsOn: { question: 'q9', value: 'نعم' }
  },

  q11: {
    label: 'هل تستخدم مكملات غذائية؟',
    type: 'radio',
    options: ['نعم', 'لا', 'لا أعلم']
  },

  q12: {
    label: 'ما هي المكملات؟',
    type: 'text',
    dependsOn: { question: 'q11', value: 'نعم' }
  },

  q13: {
    label: 'كيف تقيم مستوى التوتر لديك؟',
    type: 'select',
    options: ['منخفض', 'متوسط', 'مرتفع', 'مرتفع جداً']
  },

  q14: {
    label: 'كيف تقيم جودة نومك؟',
    type: 'select',
    options: [
      'سيئة جداً (الاستيقاظ المتكرر)',
      'متوسطة (نوم متقطع)',
      'جيدة',
      'جيدة جداً (أنام كطفل 💤)'
    ]
  }
},
he: {
  title: 'מצב בריאותי',

  q1: {
    label: 'האם אתה סובל ממחלות כרוניות?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q2: {
    label: 'אילו מחלות כרוניות?',
    type: 'select',
    options: ['סוכרת', 'יתר לחץ דם', 'בלוטת התריס', 'שחלות פוליציסטיות', 'אחר'],
    dependsOn: { question: 'q1', value: 'כן' }
  },

  q2_other: {
    label: 'מחלות אחרות – פרט',
    type: 'text',
    dependsOn: { question: 'q2', value: 'אחר' }
  },

  q3: {
    label: 'האם אובחנת במחלות הקשורות לתזונה?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q4: {
    label: 'אילו?',
    type: 'select',
    options: ['תנגודת לאינסולין', 'כולסטרול גבוה', 'אחר'],
    dependsOn: { question: 'q3', value: 'כן' }
  },

  q4_other: {
    label: 'מחלות אחרות – פרט',
    type: 'text',
    dependsOn: { question: 'q4', value: 'אחר' }
  },

  q5: {
    label: 'האם יש לך בעיות במערכת העיכול?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q6: {
    label: 'אילו בעיות?',
    type: 'select',
    options: ['נפיחות', 'עצירות', 'שלשול', 'ריפלוקס', 'אחר'],
    dependsOn: { question: 'q5', value: 'כן' }
  },

  q6_other: {
    label: 'בעיות אחרות – פרט',
    type: 'text',
    dependsOn: { question: 'q6', value: 'אחר' }
  },

  q7: {
    label: 'האם יש לך אלרגיות או רגישויות למזון?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q8: {
    label: 'אילו?',
    type: 'text',
    dependsOn: { question: 'q7', value: 'כן' }
  },

  q9: {
    label: 'האם אתה נוטל תרופות באופן קבוע?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q10: {
    label: 'אילו תרופות?',
    type: 'text',
    dependsOn: { question: 'q9', value: 'כן' }
  },

  q11: {
    label: 'האם אתה נוטל תוספי תזונה?',
    type: 'radio',
    options: ['כן', 'לא', 'לא יודע']
  },

  q12: {
    label: 'אילו תוספים?',
    type: 'text',
    dependsOn: { question: 'q11', value: 'כן' }
  },

  q13: {
    label: 'איך אתה מעריך את רמת הלחץ שלך?',
    type: 'select',
    options: ['נמוך', 'בינוני', 'גבוה', 'גבוה מאוד']
  },

  q14: {
    label: 'איך אתה מעריך את איכות השינה שלך?',
    type: 'select',
    options: [
      'גרועה מאוד (התעוררויות תכופות)',
      'בינונית (שינה מופרעת)',
      'טובה',
      'טובה מאוד (ישן כמו תינוק 💤)'
    ]
  }
}
};




