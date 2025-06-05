import { LangKey } from '@/utils/i18n';

export const section9: Record<LangKey, Record<string, any>> = {
  pl: {
    title: 'Motywacja i możliwości',
    q1: {
      label: 'Jak ocenia sex swoją motywację do zmiany nawyków (w skali 1–10)?',
      type: 'select',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    },
    q2: {
      label: 'Czy występują bariery w realizacji diety?',
      type: 'radio',
      options: ['Tak', 'Nie']
    },
    q3: {
      label: 'Jakie bariery? (można zaznaczyć kilka)',
      type: 'select',
      options: ['Brak czasu', 'Praca zmianowa', 'Brak umiejętności kulinarnych', 'Inne'],
      dependsOn: { question: 'q2', value: 'Tak' }
    },
    q3_other: {
      label: 'Inne – proszę dopisać',
      type: 'text',
      dependsOn: { question: 'q3', value: 'Inne' }
    },
    q4: {
      label: 'Ile czasu dziennie sex może przeznaczyć na przygotowywanie posiłków?',
      type: 'select',
      options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
    },
    q5: {
      label: 'Czy sex ma budżetowe ograniczenia dotyczące diety?',
      type: 'radio',
      options: ['Tak', 'Nie']
    },
    q6: {
      label: 'Rodzaj budżetu',
      type: 'select',
      options: ['Dzienny', 'Miesięczny'],
      dependsOn: { question: 'q5', value: 'Tak' }
    },
    q7: {
      label: 'Podaj przybliżoną kwotę (np. 25 zł, 900 zł)',
      type: 'text',
      dependsOn: { question: 'q5', value: 'Tak' }
    }
  },

  en: {
    title: 'Motivation and Possibilities',
    q1: {
      label: 'How does sex rate their motivation to change habits (on a scale of 1–10)?',
      type: 'select',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    },
    q2: {
      label: 'Are there any barriers to following the diet?',
      type: 'radio',
      options: ['Yes', 'No']
    },
    q3: {
      label: 'What are the barriers? (multiple options possible)',
      type: 'select',
      options: ['Lack of time', 'Shift work', 'Lack of cooking skills', 'Other'],
      dependsOn: { question: 'q2', value: 'Yes' }
    },
    q3_other: {
      label: 'Other – please specify',
      type: 'text',
      dependsOn: { question: 'q3', value: 'Other' }
    },
    q4: {
      label: 'How much time per day can sex spend on meal preparation?',
      type: 'select',
      options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
    },
    q5: {
      label: 'Does sex have budget limitations regarding the diet?',
      type: 'radio',
      options: ['Yes', 'No']
    },
    q6: {
      label: 'Type of budget',
      type: 'select',
      options: ['Daily', 'Monthly'],
      dependsOn: { question: 'q5', value: 'Yes' }
    },
    q7: {
      label: 'Provide an approximate amount (e.g., 5 USD, 150 USD)',
      type: 'text',
      dependsOn: { question: 'q5', value: 'Yes' }
    }
  },

  es: {
  title: 'Motivación y posibilidades',
  q1: {
    label: '¿Cómo evalúa sex su motivación para cambiar hábitos (en una escala del 1 al 10)?',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: '¿Existen barreras para seguir la dieta?',
    type: 'radio',
    options: ['Sí', 'No']
  },
  q3: {
    label: '¿Cuáles son las barreras? (se pueden seleccionar varias)',
    type: 'select',
    options: ['Falta de tiempo', 'Trabajo por turnos', 'Falta de habilidades culinarias', 'Otro'],
    dependsOn: { question: 'q2', value: 'Sí' }
  },
  q3_other: {
    label: 'Otro – por favor especifique',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Otro' }
  },
  q4: {
    label: '¿Cuánto tiempo al día puede dedicar sex a la preparación de comidas?',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: '¿Tiene sex limitaciones presupuestarias respecto a la dieta?',
    type: 'radio',
    options: ['Sí', 'No']
  },
  q6: {
    label: 'Tipo de presupuesto',
    type: 'select',
    options: ['Diario', 'Mensual'],
    dependsOn: { question: 'q5', value: 'Sí' }
  },
  q7: {
    label: 'Indique una cantidad aproximada (por ejemplo, 5 €, 150 €)',
    type: 'text',
    dependsOn: { question: 'q5', value: 'Sí' }
  }
},
  fr: {
  title: 'Motivation et possibilités',
  q1: {
    label: 'Comment sex évalue-t-il sa motivation à changer ses habitudes (sur une échelle de 1 à 10) ?',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: 'Y a-t-il des obstacles à suivre le régime alimentaire ?',
    type: 'radio',
    options: ['Oui', 'Non']
  },
  q3: {
    label: 'Quels sont les obstacles ? (plusieurs choix possibles)',
    type: 'select',
    options: ['Manque de temps', 'Travail posté', 'Manque de compétences culinaires', 'Autre'],
    dependsOn: { question: 'q2', value: 'Oui' }
  },
  q3_other: {
    label: 'Autre – veuillez préciser',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Autre' }
  },
  q4: {
    label: 'Combien de temps par jour sex peut-il consacrer à la préparation des repas ?',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: 'Sex a-t-il des contraintes budgétaires concernant le régime ?',
    type: 'radio',
    options: ['Oui', 'Non']
  },
  q6: {
    label: 'Type de budget',
    type: 'select',
    options: ['Quotidien', 'Mensuel'],
    dependsOn: { question: 'q5', value: 'Oui' }
  },
  q7: {
    label: 'Indiquez un montant approximatif (ex. : 5 €, 150 €)',
    type: 'text',
    dependsOn: { question: 'q5', value: 'Oui' }
  }
},
  de: {
  title: 'Motivation und Möglichkeiten',
  q1: {
    label: 'Wie schätzt sex die Motivation ein, Gewohnheiten zu ändern (auf einer Skala von 1–10)?',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: 'Gibt es Hindernisse bei der Umsetzung der Diät?',
    type: 'radio',
    options: ['Ja', 'Nein']
  },
  q3: {
    label: 'Welche Hindernisse? (Mehrfachauswahl möglich)',
    type: 'select',
    options: ['Zeitmangel', 'Schichtarbeit', 'Keine Kochkenntnisse', 'Andere'],
    dependsOn: { question: 'q2', value: 'Ja' }
  },
  q3_other: {
    label: 'Andere – bitte angeben',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Andere' }
  },
  q4: {
    label: 'Wie viel Zeit kann sex täglich für die Zubereitung von Mahlzeiten aufwenden?',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: 'Hat sex Budgetbeschränkungen in Bezug auf die Ernährung?',
    type: 'radio',
    options: ['Ja', 'Nein']
  },
  q6: {
    label: 'Art des Budgets',
    type: 'select',
    options: ['Täglich', 'Monatlich'],
    dependsOn: { question: 'q5', value: 'Ja' }
  },
  q7: {
    label: 'Bitte geben Sie einen ungefähren Betrag an (z. B. 5 €, 150 €)',
    type: 'text',
    dependsOn: { question: 'q5', value: 'Ja' }
  }
},
 ua: {
  title: 'Мотивація та можливості',
  q1: {
    label: 'Як sex оцінює свою мотивацію змінити звички (за шкалою від 1 до 10)?',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: 'Чи є перешкоди для дотримання дієти?',
    type: 'radio',
    options: ['Так', 'Ні']
  },
  q3: {
    label: 'Які саме перешкоди? (можна вибрати кілька)',
    type: 'select',
    options: ['Брак часу', 'Позмінна робота', 'Відсутність кулінарних навичок', 'Інше'],
    dependsOn: { question: 'q2', value: 'Так' }
  },
  q3_other: {
    label: 'Інше – вкажіть, будь ласка',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Інше' }
  },
  q4: {
    label: 'Скільки часу на день sex може приділяти приготуванню їжі?',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: 'Чи має sex бюджетні обмеження щодо дієти?',
    type: 'radio',
    options: ['Так', 'Ні']
  },
  q6: {
    label: 'Тип бюджету',
    type: 'select',
    options: ['Щоденний', 'Місячний'],
    dependsOn: { question: 'q5', value: 'Так' }
  },
  q7: {
    label: 'Вкажіть приблизну суму (наприклад, 150 грн, 600 грн)',
    type: 'text',
    dependsOn: { question: 'q5', value: 'Так' }
  }
},
  ru: {
  title: 'Мотивация и возможности',
  q1: {
    label: 'Как sex оценивает свою мотивацию изменить привычки (по шкале от 1 до 10)?',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: 'Есть ли препятствия для соблюдения диеты?',
    type: 'radio',
    options: ['Да', 'Нет']
  },
  q3: {
    label: 'Какие именно препятствия? (можно выбрать несколько)',
    type: 'select',
    options: ['Недостаток времени', 'Сменная работа', 'Отсутствие кулинарных навыков', 'Другое'],
    dependsOn: { question: 'q2', value: 'Да' }
  },
  q3_other: {
    label: 'Другое – укажите, пожалуйста',
    type: 'text',
    dependsOn: { question: 'q3', value: 'Другое' }
  },
  q4: {
    label: 'Сколько времени в день sex может уделять приготовлению пищи?',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: 'Есть ли у sex финансовые ограничения по питанию?',
    type: 'radio',
    options: ['Да', 'Нет']
  },
  q6: {
    label: 'Тип бюджета',
    type: 'select',
    options: ['Ежедневный', 'Ежемесячный'],
    dependsOn: { question: 'q5', value: 'Да' }
  },
  q7: {
    label: 'Укажите примерную сумму (например, 500 ₽, 3000 ₽)',
    type: 'text',
    dependsOn: { question: 'q5', value: 'Да' }
  }
},
 zh: {
  title: '动机与可能性',
  q1: {
    label: 'sex 评估自己改变习惯的动机程度（1 到 10 分）？',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: '在执行饮食计划方面是否存在障碍？',
    type: 'radio',
    options: ['是', '否']
  },
  q3: {
    label: '有哪些障碍？（可多选）',
    type: 'select',
    options: ['时间不足', '轮班工作', '缺乏烹饪技能', '其他'],
    dependsOn: { question: 'q2', value: '是' }
  },
  q3_other: {
    label: '其他 – 请具体说明',
    type: 'text',
    dependsOn: { question: 'q3', value: '其他' }
  },
  q4: {
    label: 'sex 每天可以花多少时间准备餐食？',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: 'sex 是否在饮食上有预算限制？',
    type: 'radio',
    options: ['是', '否']
  },
  q6: {
    label: '预算类型',
    type: 'select',
    options: ['每日', '每月'],
    dependsOn: { question: 'q5', value: '是' }
  },
  q7: {
    label: '请输入大致金额（例如：¥25, ¥900）',
    type: 'text',
    dependsOn: { question: 'q5', value: '是' }
  }
},
 hi: {
  title: 'प्रेरणा और संभावनाएँ',
  q1: {
    label: 'sex अपनी आदतों को बदलने की प्रेरणा को (1 से 10 के पैमाने पर) कैसे आँकता है?',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: 'क्या आहार का पालन करने में कोई बाधाएँ हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं']
  },
  q3: {
    label: 'कौन-कौन सी बाधाएँ हैं? (कई विकल्प चुन सकते हैं)',
    type: 'select',
    options: ['समय की कमी', 'शिफ्ट में काम', 'खाना पकाने का अनुभव नहीं', 'अन्य'],
    dependsOn: { question: 'q2', value: 'हाँ' }
  },
  q3_other: {
    label: 'अन्य – कृपया विवरण दें',
    type: 'text',
    dependsOn: { question: 'q3', value: 'अन्य' }
  },
  q4: {
    label: 'sex हर दिन भोजन बनाने में कितना समय दे सकता/सकती है?',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: 'क्या sex के पास आहार के लिए बजट सीमाएँ हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं']
  },
  q6: {
    label: 'बजट का प्रकार',
    type: 'select',
    options: ['दैनिक', 'मासिक'],
    dependsOn: { question: 'q5', value: 'हाँ' }
  },
  q7: {
    label: 'कृपया अनुमानित राशि दर्ज करें (उदा.: ₹25, ₹900)',
    type: 'text',
    dependsOn: { question: 'q5', value: 'हाँ' }
  }
},
 ar: {
  title: 'الدافع والإمكانيات',
  q1: {
    label: 'كيف يُقيِّم sex دافعه لتغيير العادات (على مقياس من 1 إلى 10)؟',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: 'هل توجد عوائق في اتباع النظام الغذائي؟',
    type: 'radio',
    options: ['نعم', 'لا']
  },
  q3: {
    label: 'ما هي العوائق؟ (يمكن اختيار أكثر من خيار)',
    type: 'select',
    options: ['قلة الوقت', 'نظام العمل بنوبات', 'عدم وجود مهارات طهي', 'أخرى'],
    dependsOn: { question: 'q2', value: 'نعم' }
  },
  q3_other: {
    label: 'أخرى – يرجى التوضيح',
    type: 'text',
    dependsOn: { question: 'q3', value: 'أخرى' }
  },
  q4: {
    label: 'كم من الوقت يمكن لـ sex تخصيصه يوميًا لتحضير الوجبات؟',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: 'هل لدى sex قيود مالية تتعلق بالنظام الغذائي؟',
    type: 'radio',
    options: ['نعم', 'لا']
  },
  q6: {
    label: 'نوع الميزانية',
    type: 'select',
    options: ['يومي', 'شهري'],
    dependsOn: { question: 'q5', value: 'نعم' }
  },
  q7: {
    label: 'يرجى إدخال المبلغ التقريبي (مثال: 25 ر.س، 900 ر.س)',
    type: 'text',
    dependsOn: { question: 'q5', value: 'نعم' }
  }
},
  he: {
  title: 'מוטיבציה ואפשרויות',
  q1: {
    label: 'איך sex מעריך/ה את המוטיבציה לשנות הרגלים (בסולם של 1–10)?',
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  q2: {
    label: 'האם קיימים חסמים ליישום התפריט התזונתי?',
    type: 'radio',
    options: ['כן', 'לא']
  },
  q3: {
    label: 'אילו חסמים? (ניתן לבחור יותר מאופציה אחת)',
    type: 'select',
    options: ['חוסר זמן', 'עבודה במשמרות', 'חוסר מיומנות בישול', 'אחר'],
    dependsOn: { question: 'q2', value: 'כן' }
  },
  q3_other: {
    label: 'אחר – נא לפרט',
    type: 'text',
    dependsOn: { question: 'q3', value: 'אחר' }
  },
  q4: {
    label: 'כמה זמן ביום sex יכול/ה להקדיש להכנת ארוחות?',
    type: 'select',
    options: ['0.5 h', '1 h', '1.5 h', '2 h', '2.5 h', '3 h', '3.5 h', '4 h', '4.5 h', '5 h', '5.5 h', '6 h', '6.5 h', '7 h', '7.5 h', '8 h', '8.5 h', '9 h', '9.5 h', '10 h']
  },
  q5: {
    label: 'האם יש ל-sex מגבלות תקציב בנוגע לתפריט?',
    type: 'radio',
    options: ['כן', 'לא']
  },
  q6: {
    label: 'סוג התקציב',
    type: 'select',
    options: ['יומי', 'חודשי'],
    dependsOn: { question: 'q5', value: 'כן' }
  },
  q7: {
    label: 'אנא הזן סכום משוער (לדוגמה: ₪25, ₪900)',
    type: 'text',
    dependsOn: { question: 'q5', value: 'כן' }
  }
}
};

