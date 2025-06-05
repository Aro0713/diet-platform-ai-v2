import { LangKey } from '@/utils/i18n';

export const section8: Record<LangKey, any> = {
  pl: {
    title: 'Kobiety – pytania dodatkowe',

    q1: {
      label: 'Czy sex cykle miesiączkowe są regularne?',
      type: 'radio',
      options: ['Tak', 'Nie']
    },

    q2: {
      label: 'Czy sex ma dolegliwości hormonalne (np. PCOS, endometrioza)?',
      type: 'radio',
      options: ['Tak', 'Nie']
    },

    q2_list: {
      label: 'Jakie to zaburzenia hormonalne? (możesz zaznaczyć więcej niż jedną)',
      type: 'select',
      options: [
        'PCOS',
        'Endometrioza',
        'Zespół napięcia przedmiesiączkowego (PMS)',
        'Nieregularna owulacja',
        'Niedoczynność tarczycy',
        'Nadczynność tarczycy',
        'Zespół hiperandrogenizmu',
        'Inne'
      ],
      dependsOn: { question: 'q2', value: 'Tak' }
    },

    q2_list_other: {
      label: 'Inne – proszę dopisać',
      type: 'text',
      dependsOn: { question: 'q2_list', value: 'Inne' }
    },

    q3: {
      label: 'Czy sex jest obecnie w ciąży lub karmi piersią?',
      type: 'radio',
      options: ['Tak, jestem w ciąży', 'Tak, karmię piersią', 'Nie']
    },

    q4: {
      label: 'Czy sex stosuje antykoncepcję hormonalną?',
      type: 'radio',
      options: ['Tak', 'Nie']
    }
  },
en: {
  title: 'Women – additional questions',

  q1: {
    label: 'Are sex’s menstrual cycles regular?',
    type: 'radio',
    options: ['Yes', 'No']
  },

  q2: {
    label: 'Does sex have any hormonal disorders (e.g. PCOS, endometriosis)?',
    type: 'radio',
    options: ['Yes', 'No']
  },

  q2_list: {
    label: 'Which hormonal conditions? (you can select more than one)',
    type: 'select',
    options: [
      'PCOS',
      'Endometriosis',
      'Premenstrual Syndrome (PMS)',
      'Irregular ovulation',
      'Hypothyroidism',
      'Hyperthyroidism',
      'Hyperandrogenism',
      'Other'
    ],
    dependsOn: { question: 'q2', value: 'Yes' }
  },

  q2_list_other: {
    label: 'Other – please specify',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'Other' }
  },

  q3: {
    label: 'Is sex currently pregnant or breastfeeding?',
    type: 'radio',
    options: ['Yes, I’m pregnant', 'Yes, I’m breastfeeding', 'No']
  },

  q4: {
    label: 'Does sex use hormonal contraception?',
    type: 'radio',
    options: ['Yes', 'No']
  }
},
de: {
  title: 'Frauen – zusätzliche Fragen',

  q1: {
    label: 'Sind sex’s Menstruationszyklen regelmäßig?',
    type: 'radio',
    options: ['Ja', 'Nein']
  },

  q2: {
    label: 'Hat sex hormonelle Beschwerden (z. B. PCOS, Endometriose)?',
    type: 'radio',
    options: ['Ja', 'Nein']
  },

  q2_list: {
    label: 'Welche hormonellen Störungen? (Mehrfachauswahl möglich)',
    type: 'select',
    options: [
      'PCOS',
      'Endometriose',
      'PMS (Prämenstruelles Syndrom)',
      'Unregelmäßiger Eisprung',
      'Schilddrüsenunterfunktion',
      'Schilddrüsenüberfunktion',
      'Hyperandrogenismus',
      'Andere'
    ],
    dependsOn: { question: 'q2', value: 'Ja' }
  },

  q2_list_other: {
    label: 'Andere – bitte angeben',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'Andere' }
  },

  q3: {
    label: 'Ist sex aktuell schwanger oder stillend?',
    type: 'radio',
    options: ['Ja, schwanger', 'Ja, stille', 'Nein']
  },

  q4: {
    label: 'Nutzt sex hormonelle Verhütung?',
    type: 'radio',
    options: ['Ja', 'Nein']
  }
},
fr: {
  title: 'Femmes – questions supplémentaires',

  q1: {
    label: 'Les cycles menstruels de sex sont-ils réguliers ?',
    type: 'radio',
    options: ['Oui', 'Non']
  },

  q2: {
    label: 'Sex souffre-t-elle de troubles hormonaux (ex. SOPK, endométriose) ?',
    type: 'radio',
    options: ['Oui', 'Non']
  },

  q2_list: {
    label: 'Quels troubles hormonaux ? (plusieurs choix possibles)',
    type: 'select',
    options: [
      'SOPK',
      'Endométriose',
      'Syndrome prémenstruel (SPM)',
      'Ovulation irrégulière',
      'Hypothyroïdie',
      'Hyperthyroïdie',
      'Hyperandrogénie',
      'Autre'
    ],
    dependsOn: { question: 'q2', value: 'Oui' }
  },

  q2_list_other: {
    label: 'Autre – veuillez préciser',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'Autre' }
  },

  q3: {
    label: 'Sex est-elle actuellement enceinte ou allaite-t-elle ?',
    type: 'radio',
    options: ['Oui, enceinte', 'Oui, allaitante', 'Non']
  },

  q4: {
    label: 'Sex utilise-t-elle une contraception hormonale ?',
    type: 'radio',
    options: ['Oui', 'Non']
  }
},
es: {
  title: 'Mujeres – preguntas adicionales',

  q1: {
    label: '¿Los ciclos menstruales de sex son regulares?',
    type: 'radio',
    options: ['Sí', 'No']
  },

  q2: {
    label: '¿Sex tiene trastornos hormonales (p. ej. SOP, endometriosis)?',
    type: 'radio',
    options: ['Sí', 'No']
  },

  q2_list: {
    label: '¿Qué trastornos hormonales? (puede seleccionar más de uno)',
    type: 'select',
    options: [
      'SOP',
      'Endometriosis',
      'Síndrome premenstrual (SPM)',
      'Ovulación irregular',
      'Hipotiroidismo',
      'Hipertiroidismo',
      'Hiperandrogenismo',
      'Otro'
    ],
    dependsOn: { question: 'q2', value: 'Sí' }
  },

  q2_list_other: {
    label: 'Otro – especifique',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'Otro' }
  },

  q3: {
    label: '¿Sex está embarazada o en período de lactancia?',
    type: 'radio',
    options: ['Sí, embarazada', 'Sí, lactancia', 'No']
  },

  q4: {
    label: '¿Sex usa anticonceptivos hormonales?',
    type: 'radio',
    options: ['Sí', 'No']
  }
},
ua: {
  title: 'Жінки – додаткові запитання',

  q1: {
    label: 'Чи регулярні менструальні цикли у sex?',
    type: 'radio',
    options: ['Так', 'Ні']
  },

  q2: {
    label: 'Чи має sex гормональні порушення (наприклад, СПКЯ, ендометріоз)?',
    type: 'radio',
    options: ['Так', 'Ні']
  },

  q2_list: {
    label: 'Які саме гормональні порушення? (можна вибрати кілька)',
    type: 'select',
    options: [
      'СПКЯ',
      'Ендометріоз',
      'ПМС (передменструальний синдром)',
      'Нерегулярна овуляція',
      'Гіпотиреоз',
      'Гіпертиреоз',
      'Гіперандрогенія',
      'Інше'
    ],
    dependsOn: { question: 'q2', value: 'Так' }
  },

  q2_list_other: {
    label: 'Інше – вкажіть, будь ласка',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'Інше' }
  },

  q3: {
    label: 'Чи sex зараз вагітна або годує грудьми?',
    type: 'radio',
    options: ['Так, вагітна', 'Так, годує', 'Ні']
  },

  q4: {
    label: 'Чи використовує sex гормональну контрацепцію?',
    type: 'radio',
    options: ['Так', 'Ні']
  }
},
ru: {
  title: 'Женщины – дополнительные вопросы',

  q1: {
    label: 'Регулярны ли менструальные циклы у sex?',
    type: 'radio',
    options: ['Да', 'Нет']
  },

  q2: {
    label: 'Есть ли у sex гормональные нарушения (например, СПКЯ, эндометриоз)?',
    type: 'radio',
    options: ['Да', 'Нет']
  },

  q2_list: {
    label: 'Какие гормональные нарушения? (можно выбрать несколько)',
    type: 'select',
    options: [
      'СПКЯ',
      'Эндометриоз',
      'ПМС (предменструальный синдром)',
      'Нерегулярная овуляция',
      'Гипотиреоз',
      'Гипертиреоз',
      'Гиперандрогения',
      'Другое'
    ],
    dependsOn: { question: 'q2', value: 'Да' }
  },

  q2_list_other: {
    label: 'Другое – укажите',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'Другое' }
  },

  q3: {
    label: 'Находится ли sex сейчас в положении или кормит грудью?',
    type: 'radio',
    options: ['Да, беременна', 'Да, кормит грудью', 'Нет']
  },

  q4: {
    label: 'Использует ли sex гормональную контрацепцию?',
    type: 'radio',
    options: ['Да', 'Нет']
  }
},
zh: {
  title: '女性 – 附加问题',

  q1: {
    label: 'sex 的月经周期是否规律？',
    type: 'radio',
    options: ['是', '否']
  },

  q2: {
    label: 'sex 是否有激素相关疾病（如 PCOS、子宫内膜异位）？',
    type: 'radio',
    options: ['是', '否']
  },

  q2_list: {
    label: '有哪些激素疾病？（可多选）',
    type: 'select',
    options: [
      'PCOS',
      '子宫内膜异位症',
      '经前综合症（PMS）',
      '排卵不规律',
      '甲状腺功能减退',
      '甲状腺功能亢进',
      '高雄激素症',
      '其他'
    ],
    dependsOn: { question: 'q2', value: '是' }
  },

  q2_list_other: {
    label: '其他 – 请说明',
    type: 'text',
    dependsOn: { question: 'q2_list', value: '其他' }
  },

  q3: {
    label: 'sex 当前是否怀孕或哺乳？',
    type: 'radio',
    options: ['是，我怀孕了', '是，我在哺乳', '否']
  },

  q4: {
    label: 'sex 是否使用激素避孕方法？',
    type: 'radio',
    options: ['是', '否']
  }
},
hi: {
  title: 'महिलाएं – अतिरिक्त प्रश्न',

  q1: {
    label: 'क्या sex के मासिक धर्म नियमित हैं?',
    type: 'radio',
    options: ['हाँ', 'नहीं']
  },

  q2: {
    label: 'क्या sex को कोई हार्मोनल समस्या है (जैसे PCOS, एंडोमेट्रिओसिस)?',
    type: 'radio',
    options: ['हाँ', 'नहीं']
  },

  q2_list: {
    label: 'कौन-कौन सी समस्याएं? (एक से अधिक चुनें)',
    type: 'select',
    options: [
      'PCOS',
      'एंडोमेट्रिओसिस',
      'PMS (पूर्व-मासिक धर्म सिंड्रोम)',
      'अनियमित ओव्यूलेशन',
      'हाइपोथायरायडिज्म',
      'हाइपरथायरायडिज्म',
      'हाइपरएंड्रोजेनेसिज़्म',
      'अन्य'
    ],
    dependsOn: { question: 'q2', value: 'हाँ' }
  },

  q2_list_other: {
    label: 'अन्य – कृपया लिखें',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'अन्य' }
  },

  q3: {
    label: 'क्या sex वर्तमान में गर्भवती है या स्तनपान करा रही है?',
    type: 'radio',
    options: ['हाँ, गर्भवती हूँ', 'हाँ, स्तनपान करा रही हूँ', 'नहीं']
  },

  q4: {
    label: 'क्या sex हार्मोनल गर्भनिरोधक का उपयोग करती है?',
    type: 'radio',
    options: ['हाँ', 'नहीं']
  }
},
ar: {
  title: 'النساء – أسئلة إضافية',

  q1: {
    label: 'هل دورت sex الشهرية منتظمة؟',
    type: 'radio',
    options: ['نعم', 'لا']
  },

  q2: {
    label: 'هل تعاني sex من اضطرابات هرمونية (مثل PCOS أو الانتباذ البطاني الرحمي)؟',
    type: 'radio',
    options: ['نعم', 'لا']
  },

  q2_list: {
    label: 'ما هي الاضطرابات؟ (يمكن اختيار أكثر من خيار)',
    type: 'select',
    options: [
      'PCOS',
      'الانتباذ البطاني الرحمي',
      'متلازمة ما قبل الحيض (PMS)',
      'إباضة غير منتظمة',
      'قصور الغدة الدرقية',
      'فرط نشاط الغدة الدرقية',
      'فرط الأندروجين',
      'أخرى'
    ],
    dependsOn: { question: 'q2', value: 'نعم' }
  },

  q2_list_other: {
    label: 'أخرى – يرجى التوضيح',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'أخرى' }
  },

  q3: {
    label: 'هل sex حامل حاليًا أو ترضع؟',
    type: 'radio',
    options: ['نعم، أنا حامل', 'نعم، أرضع', 'لا']
  },

  q4: {
    label: 'هل تستخدم sex وسائل منع حمل هرمونية؟',
    type: 'radio',
    options: ['نعم', 'لا']
  }
},
he: {
  title: 'נשים – שאלות נוספות',

  q1: {
    label: 'האם המחזור של sex סדיר?',
    type: 'radio',
    options: ['כן', 'לא']
  },

  q2: {
    label: 'האם sex סובלת מהפרעות הורמונליות (למשל PCOS, אנדומטריוזיס)?',
    type: 'radio',
    options: ['כן', 'לא']
  },

  q2_list: {
    label: 'אילו הפרעות? (ניתן לבחור יותר מאחת)',
    type: 'select',
    options: [
      'PCOS',
      'אנדומטריוזיס',
      'תסמונת קדם וסתית (PMS)',
      'ביוץ לא סדיר',
      'תת פעילות בלוטת התריס',
      'יתר פעילות בלוטת התריס',
      'היפראנדרוגניזם',
      'אחר'
    ],
    dependsOn: { question: 'q2', value: 'כן' }
  },

  q2_list_other: {
    label: 'אחר – נא לפרט',
    type: 'text',
    dependsOn: { question: 'q2_list', value: 'אחר' }
  },

  q3: {
    label: 'האם sex בהריון או מניקה כרגע?',
    type: 'radio',
    options: ['כן, בהריון', 'כן, מניקה', 'לא']
  },

  q4: {
    label: 'האם sex משתמשת באמצעי מניעה הורמונליים?',
    type: 'radio',
    options: ['כן', 'לא']
  }
}
};

export type Section8Key = keyof (typeof section8)['pl'];
