export const foodPreferencesLabels = {
    title: {
      pl: 'Preferencje żywieniowe',
      en: 'Food preferences',
      es: 'Preferencias alimentarias',
      fr: 'Préférences alimentaires',
      de: 'Ernährungspräferenzen',
      ua: 'Харчові уподобання',
      ru: 'Пищевые предпочтения',
      zh: '饮食偏好',
      hi: 'खाद्य प्राथमिकताएँ',
      ar: 'التفضيلات الغذائية',
      he: 'העדפות תזונה'
    },
    vegetarian: {
      pl: 'wegetariańska',
      en: 'vegetarian',
      es: 'vegetariana',
      fr: 'végétarienne',
      de: 'vegetarisch',
      ua: 'вегетаріанська',
      ru: 'вегетарианская',
      zh: '素食',
      hi: 'शाकाहारी',
      ar: 'نباتية',
      he: 'צמחונית'
    },
    vegan: {
      pl: 'wegańska',
      en: 'vegan',
      es: 'vegana',
      fr: 'végétalienne',
      de: 'vegan',
      ua: 'веганська',
      ru: 'веганская',
      zh: '纯素',
      hi: 'पूर्ण शाकाहारी',
      ar: 'نباتية صارمة',
      he: 'טבעונית'
    },
    glutenFree: {
      pl: 'bezglutenowa',
      en: 'gluten-free',
      es: 'sin gluten',
      fr: 'sans gluten',
      de: 'glutenfrei',
      ua: 'безглютенова',
      ru: 'безглютеновая',
      zh: '无麸质',
      hi: 'ग्लूटेन मुक्त',
      ar: 'خالٍ من الغلوتين',
      he: 'ללא גלוטן'
    },
    lactoseFree: {
      pl: 'bezlaktozowa',
      en: 'lactose-free',
      es: 'sin lactosa',
      fr: 'sans lactose',
      de: 'laktosefrei',
      ua: 'безлактозна',
      ru: 'безлактозная',
      zh: '无乳糖',
      hi: 'लैक्टोज मुक्त',
      ar: 'خالٍ من اللاكتوز',
      he: 'ללא לקטוז'
    },
    lowCarb: {
      pl: 'niskowęglowodanowa',
      en: 'low-carb',
      es: 'baja en carbohidratos',
      fr: 'pauvre en glucides',
      de: 'kohlenhydratarm',
      ua: 'низьковуглеводна',
      ru: 'низкоуглеводная',
      zh: '低碳水',
      hi: 'कम कार्बोहाइड्रेट',
      ar: 'منخفضة الكربوهيدرات',
      he: 'דלת פחמימות'
    },
    highProtein: {
      pl: 'wysokobiałkowa',
      en: 'high-protein',
      es: 'alta en proteínas',
      fr: 'riche en protéines',
      de: 'eiweißreich',
      ua: 'білкова',
      ru: 'высокобелковая',
      zh: '高蛋白',
      hi: 'उच्च प्रोटीन',
      ar: 'عالية البروتين',
      he: 'עשירה בחלבון'
    }
  } as const;
  
  export type FoodPreferenceKey = keyof typeof foodPreferencesLabels;
  
