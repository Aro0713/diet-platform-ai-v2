import { LangKey } from '@/utils/i18n';

export const section10: Record<LangKey, Record<string, any>> = {
  pl: {
    title: 'Inne',
    q1: {
      label: 'Czy są inne ważne informacje, które nie są zawarte w wywiadzie, a mają znaczenie w ułożeniu diety?',
      type: 'radio',
      options: ['Tak', 'Nie']
    },
    q1_details: {
      label: 'Wpisz dodatkowe informacje:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Tak' }
    }
  },
  en: {
    title: 'Other',
    q1: {
      label: 'Are there any other important details not covered in the interview that are relevant for creating the diet?',
      type: 'radio',
      options: ['Yes', 'No']
    },
    q1_details: {
      label: 'Enter additional information:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Yes' }
    }
  },
  es: {
    title: 'Otros',
    q1: {
      label: '¿Hay otras informaciones importantes que no se cubren en la entrevista y que son relevantes para crear la dieta?',
      type: 'radio',
      options: ['Sí', 'No']
    },
    q1_details: {
      label: 'Ingrese información adicional:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Sí' }
    }
  },
  fr: {
    title: 'Autres',
    q1: {
      label: 'Y a-t-il d’autres informations importantes non abordées dans l’entretien et utiles pour établir le régime ?',
      type: 'radio',
      options: ['Oui', 'Non']
    },
    q1_details: {
      label: 'Entrez des informations supplémentaires :',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Oui' }
    }
  },
  de: {
    title: 'Sonstiges',
    q1: {
      label: 'Gibt es weitere wichtige Informationen, die im Interview nicht enthalten sind, aber für die Erstellung der Diät relevant sind?',
      type: 'radio',
      options: ['Ja', 'Nein']
    },
    q1_details: {
      label: 'Zusätzliche Informationen eingeben:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Ja' }
    }
  },
  ua: {
    title: 'Інше',
    q1: {
      label: 'Чи є інша важлива інформація, не зазначена у формі, яка може бути важливою для складання раціону?',
      type: 'radio',
      options: ['Так', 'Ні']
    },
    q1_details: {
      label: 'Введіть додаткову інформацію:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Так' }
    }
  },
  ru: {
    title: 'Другое',
    q1: {
      label: 'Есть ли другая важная информация, не указанная в анкете, но важная для составления диеты?',
      type: 'radio',
      options: ['Да', 'Нет']
    },
    q1_details: {
      label: 'Введите дополнительную информацию:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'Да' }
    }
  },
  zh: {
    title: '其他',
    q1: {
      label: '是否有其他未在问卷中提及、但对制定饮食计划很重要的信息？',
      type: 'radio',
      options: ['是', '否']
    },
    q1_details: {
      label: '请输入补充信息：',
      type: 'text',
      dependsOn: { question: 'q1', value: '是' }
    }
  },
  hi: {
    title: 'अन्य',
    q1: {
      label: 'क्या कोई अन्य महत्वपूर्ण जानकारी है जो इंटरव्यू में शामिल नहीं है लेकिन डाइट प्लान के लिए ज़रूरी है?',
      type: 'radio',
      options: ['हाँ', 'नहीं']
    },
    q1_details: {
      label: 'अतिरिक्त जानकारी दर्ज करें:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'हाँ' }
    }
  },
  ar: {
    title: 'أخرى',
    q1: {
      label: 'هل هناك معلومات مهمة أخرى لم يتم ذكرها في المقابلة وتؤثر على إعداد النظام الغذائي؟',
      type: 'radio',
      options: ['نعم', 'لا']
    },
    q1_details: {
      label: 'يرجى إدخال معلومات إضافية:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'نعم' }
    }
  },
  he: {
    title: 'אחר',
    q1: {
      label: 'האם יש מידע חשוב נוסף שלא נכלל בשאלון ושחשוב לתכנון התזונה?',
      type: 'radio',
      options: ['כן', 'לא']
    },
    q1_details: {
      label: 'אנא הזן מידע נוסף:',
      type: 'text',
      dependsOn: { question: 'q1', value: 'כן' }
    }
  }
};
