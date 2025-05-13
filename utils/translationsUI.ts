import { LangKey } from './i18n';

export const translationsUI: Record<string, Record<LangKey, string>> = {
  // Zaczynamy od głównych nagłówków i UI
  title: {
    pl: 'Panel Lekarza / Dietetyka',
    en: 'Doctor / Dietitian Panel',
    de: 'Arzt / Diätetiker Panel',
    ua: 'Панель лікаря / дієтолога',
    ru: 'Панель врача / диетолога',
    zh: '医生/营养师面板',
    hi: 'डॉक्टर / आहार विशेषज्ञ पैनल',
    ar: 'لوحة الطبيب / أخصائي التغذية',
    he: 'פאנל רופא / דיאטן',
    es: 'Panel de Médico / Dietista',
    fr: 'Panneau Médecin / Diététicien'
  },
  subtitle: {
    pl: 'Wprowadź dane pacjenta i wygeneruj dietę',
    en: 'Enter patient data and generate a diet',
    es: 'Ingrese los datos del paciente y genere una dieta',
    fr: 'Entrez les données du patient et générez un régime',
    de: 'Geben Sie Patientendaten ein und erstellen Sie eine Diät',
    ua: 'Введіть дані пацієнта та створіть дієту',
    ru: 'Введите данные пациента и создайте диету',
    zh: '输入患者数据并生成饮食',
    hi: 'रोगी का डेटा दर्ज करें और एक डाइट जनरेट करें',
    ar: 'أدخل بيانات المريض وقم بإنشاء نظام غذائي',
    he: 'הזן את נתוני המטופל וצור תפריט'
  },
  welcome: {
  pl: 'Witaj',
  en: 'Welcome',
  es: 'Bienvenido',
  fr: 'Bienvenue',
  de: 'Willkommen',
  ua: 'Ласкаво просимо',
  ru: 'Добро пожаловать',
  zh: '欢迎',
  hi: 'स्वागत है',
  ar: 'مرحبًا',
  he: 'ברוך הבא'
},
  slogan: {
    pl: 'Twoja dieta. Twoje zdrowie. Twój plan.\nDiet Care Platform pomaga Ci otrzymać jadłospis dopasowany do Twojego stanu zdrowia, stylu życia i celów.\nTworzony przez specjalistów, wspierany technologią — z myślą o Tobie.',
    en: 'Your diet. Your health. Your plan.\nDiet Care Platform helps you get a meal plan tailored to your health, lifestyle, and goals.\nCreated by professionals, powered by technology — designed for you.',
    ua: 'Твоя дієта. Твоє здоров\'я. Твій план.\nDiet Care Platform допомагає отримати індивідуальне меню відповідно до твого стану здоров\'я, стилю життя та цілей.',
    es: 'Tu dieta. Tu salud. Tu plan.\nDiet Care Platform te ayuda a obtener un plan de comidas adaptado a tu salud, estilo de vida y objetivos.',
    fr: 'Votre régime. Votre santé. Votre plan.\nDiet Care Platform vous aide à obtenir un menu adapté à votre santé, votre style de vie et vos objectifs.',
    de: 'Deine Ernährung. Deine Gesundheit. Dein Plan.\nDiet Care Platform hilft dir, einen auf dich zugeschnittenen Ernährungsplan zu erhalten.',
    ru: 'Твоя диета. Твоё здоровье. Твой план.\nDiet Care Platform помогает получить меню, соответствующее твоему здоровью, образу жизни и целям.',
    zh: '你的饮食。你的健康。你的计划。\nDiet Care Platform 帮助你获得符合你健康状况、生活方式和目标的膳食计划。',
    hi: 'आपका आहार। आपकी सेहत। आपकी योजना।\nDiet Care Platform आपकी सेहत, जीवनशैली और लक्ष्यों के अनुसार भोजन योजना प्रदान करता है।',
    ar: 'نظامك الغذائي. صحتك. خطتك.\nتساعدك Diet Care Platform في الحصول على خطة وجبات مناسبة لصحتك وأسلوب حياتك وأهدافك.',
    he: 'התזונה שלך. הבריאות שלך. התוכנית שלך.\nDiet Care Platform עוזרת לך לקבל תוכנית תזונה מותאמת אישית לבריאותך, סגנון חייך ומטרותיך.'
  },
  signature: {
    pl: 'Rekomenduję Edyta Sroczyńska',
    en: 'Recommended by Edyta Sroczyńska',
    ua: 'Рекомендує Едита Срощинська',
    es: 'Recomendado por Edyta Sroczyńska',
    fr: 'Recommandé par Edyta Sroczyńska',
    de: 'Empfohlen von Edyta Sroczyńska',
    ru: 'Рекомендует Эдита Срощинская',
    zh: '推荐人 Edyta Sroczyńska',
    hi: 'अनुशंसा: Edyta Sroczyńska',
    ar: 'موصى بها من قبل Edyta Sroczyńska',
    he: 'מומלץ על ידי Edyta Sroczyńska'
  },

  enterAsDoctor: {
    pl: 'Wejdź jako lekarz',
    en: 'Enter as Doctor',
    ua: 'Увійти як лікар',
    es: 'Entrar como médico',
    fr: 'Entrer comme médecin',
    de: 'Als Arzt einloggen',
    ru: 'Войти как врач',
    zh: '以医生身份进入',
    hi: 'डॉक्टर के रूप में प्रवेश करें',
    ar: 'الدخول كطبيب',
    he: 'כניסה כרופא'
  },

  enterAsPatient: {
    pl: 'Wejdź jako pacjent',
    en: 'Enter as Patient',
    ua: 'Увійти як пацієнт',
    es: 'Entrar como paciente',
    fr: 'Entrer comme patient',
    de: 'Als Patient einloggen',
    ru: 'Войти как пациент',
    zh: '以患者身份进入',
    hi: 'मरीज के रूप में प्रवेश करें',
    ar: 'الدخول كمريض',
    he: 'כניסה כמטופל'
  },
   age: {
      pl: 'Wiek',
      en: 'Age',
      es: 'Edad',
      fr: 'Âge',
      de: 'Alter',
      ua: 'Вік',
      ru: 'Возраст',
      zh: '年龄',
      hi: 'आयु',
      ar: 'العمر',
      he: 'גיל'
    },
    sex: {
      pl: 'Płeć',
      en: 'sex',
      es: 'Género',
      fr: 'Sexe',
      de: 'Geschlecht',
      ua: 'Стать',
      ru: 'Пол',
      zh: '性别',
      hi: 'लिंग',
      ar: 'الجنس',
      he: 'מין'
    },
    female: {
      pl: 'Kobieta',
      en: 'Female',
      es: 'Mujer',
      fr: 'Femme',
      de: 'Frau',
      ua: 'Жінка',
      ru: 'Женщина',
      zh: '女性',
      hi: 'महिला',
      ar: 'أنثى',
      he: 'אישה'
    },
    male: {
      pl: 'Mężczyzna',
      en: 'Male',
      es: 'Hombre',
      fr: 'Homme',
      de: 'Mann',
      ua: 'Чоловік',
      ru: 'Мужчина',
      zh: '男性',
      hi: 'पुरुष',
      ar: 'ذكر',
      he: 'גבר'
    },
    weight: {
      pl: 'Waga (kg)',
      en: 'Weight (kg)',
      es: 'Peso (kg)',
      fr: 'Poids (kg)',
      de: 'Gewicht (kg)',
      ua: 'Вага (кг)',
      ru: 'Вес (кг)',
      zh: '体重 (公斤)',
      hi: 'वजन (किग्रा)',
      ar: 'الوزن (كجم)',
      he: 'משקל (ק״ג)'
    },
    height: {
      pl: 'Wzrost (cm)',
      en: 'Height (cm)',
      es: 'Altura (cm)',
      fr: 'Taille (cm)',
      de: 'Größe (cm)',
      ua: 'Зріст (см)',
      ru: 'Рост (см)',
      zh: '身高 (厘米)',
      hi: 'ऊंचाई (सेमी)',
      ar: 'الطول (سم)',
      he: 'גובה (ס״מ)'
    },
    allergies: {
      pl: 'Alergie pokarmowe',
      en: 'Food allergies',
      es: 'Alergias alimentarias',
      fr: 'Allergies alimentaires',
      de: 'Nahrungsmittelallergien',
      ua: 'Алергії на їжу',
      ru: 'Пищевые аллергии',
      zh: '食物过敏',
      hi: 'खाद्य एलर्जी',
      ar: 'حساسيات الطعام',
      he: 'אלרגיות למזון'
    },
    region: {
      pl: 'Region świata',
      en: 'World region',
      es: 'Región del mundo',
      fr: 'Région du monde',
      de: 'Weltregion',
      ua: 'Регіон світу',
      ru: 'Регион мира',
      zh: '世界地区',
      hi: 'विश्व क्षेत्र',
      ar: 'منطقة العالم',
      he: 'אזור בעולם'
    },
    selectRegion: {
      pl: 'Wybierz region',
      en: 'Select region',
      es: 'Seleccione una región',
      fr: 'Sélectionnez une région',
      de: 'Region auswählen',
      ua: 'Виберіть регіон',
      ru: 'Выберите регион',
      zh: '选择地区',
      hi: 'क्षेत्र चुनें',
      ar: 'اختر المنطقة',
      he: 'בחר אזור'
    },
    medicalData: {
      pl: 'Dane medyczne pacjenta',
      en: 'Medical data',
      de: 'Medizinische Daten',
      ua: 'Медичні дані',
      ru: 'Медицинские данные',
      zh: '医疗数据',
      hi: 'चिकित्सीय जानकारी',
      ar: 'البيانات الطبية',
      he: 'נתונים רפואיים',
      es: 'Datos médicos',
      fr: 'Données médicales',
    },    
    generate: {
      pl: 'Wygeneruj dietę',
      en: 'Generate diet',
      es: 'Generar dieta',
      fr: 'Générer un régime',
      de: 'Diät generieren',
      ua: 'Створити дієту',
      ru: 'Сгенерировать диету',
      zh: '生成饮食',
      hi: 'डाइट जनरेट करें',
      ar: 'إنشاء نظام غذائي',
      he: 'צור תפריט'
    },
    bmiLabel: {
      pl: 'BMI pacjenta',
      en: 'Patient BMI',
      es: 'IMC del paciente',
      fr: 'IMC du patient',
      de: 'Patienten-BMI',
      ua: 'ІМТ пацієнта',
      ru: 'ИМТ пациента',
      zh: '患者的BMI',
      hi: 'रोगी का BMI',
      ar: 'مؤشر كتلة جسم المريض',
      he: 'BMI של המטופל'
    },
    underweight: {
      pl: 'niedowaga',
      en: 'underweight',
      es: 'bajo peso',
      fr: 'insuffisance pondérale',
      de: 'Untergewicht',
      ua: 'недовага',
      ru: 'недовес',
      zh: '偏瘦',
      hi: 'कम वजन',
      ar: 'نقص الوزن',
      he: 'תת משקל'
    },
    normal: {
      pl: 'norma',
      en: 'normal',
      es: 'normal',
      fr: 'normal',
      de: 'normal',
      ua: 'норма',
      ru: 'норма',
      zh: '正常',
      hi: 'सामान्य',
      ar: 'طبيعي',
      he: 'נורמלי'
    },
    overweight: {
      pl: 'nadwaga',
      en: 'overweight',
      es: 'sobrepeso',
      fr: 'surpoids',
      de: 'Übergewicht',
      ua: 'надмірна вага',
      ru: 'избыточный вес',
      zh: '超重',
      hi: 'अधिक वजन',
      ar: 'زيادة الوزن',
      he: 'עודף משקל'
    },
    obesity: {
      pl: 'otyłość',
      en: 'obesity',
      es: 'obesidad',
      fr: 'obésité',
      de: 'Fettleibigkeit',
      ua: 'ожиріння',
      ru: 'ожирение',
      zh: '肥胖',
      hi: 'मोटापा',
      ar: 'السمنة',
      he: 'השמנת יתר'
    },
    approvedDiet: {
      pl: 'Zatwierdzona dieta:',
      en: 'Approved diet:',
      es: 'Dieta aprobada:',
      fr: 'Régime approuvé:',
      de: 'Genehmigte Diät:',
      ua: 'Затверджена дієта:',
      ru: 'Утверждённая диета:',
      zh: '已批准的饮食:',
      hi: 'स्वीकृत डाइट:',
      ar: 'النظام الغذائي المعتمد:',
      he: 'תפריט מאושר:'
    },
    sendToPatient: {
      pl: 'Wyślij pacjentowi',
      en: 'Send to patient',
      es: 'Enviar al paciente',
      fr: 'Envoyer au patient',
      de: 'An den Patienten senden',
      ua: 'Надіслати пацієнту',
      ru: 'Отправить пациенту',
      zh: '发送给患者',
      hi: 'मरीज को भेजें',
      ar: 'إرسال للمريض',
      he: 'שלח למטופל'
    },
    pdf: {
      pl: 'PDF',
      en: 'PDF',
      es: 'PDF',
      fr: 'PDF',
      de: 'PDF',
      ua: 'PDF',
      ru: 'PDF',
      zh: 'PDF',
      hi: 'PDF',
      ar: 'PDF',
      he: 'PDF'
    },
    showDrafts: {
      pl: 'Zobacz wersje robocze',
      en: 'View drafts',
      es: 'Ver borradores',
      fr: 'Voir les brouillons',
      de: 'Entwürfe anzeigen',
      ua: 'Переглянути чернетки',
      ru: 'Просмотреть черновики',
      zh: '查看草稿',
      hi: 'ड्राफ्ट देखें',
      ar: 'عرض المسودات',
      he: 'הצג טיוטות'
    },
    deleteAll: {
      pl: 'Usuń wszystkie',
      en: 'Delete all',
      es: 'Eliminar todo',
      fr: 'Tout supprimer',
      de: 'Alle löschen',
      ua: 'Видалити всі',
      ru: 'Удалить все',
      zh: '全部删除',
      hi: 'सभी हटाएं',
      ar: 'احذف الكل',
      he: 'מחק הכל'
    },
    draftsTitle: {
      pl: 'Wersje robocze diet',
      en: 'Diet drafts',
      es: 'Borradores de dieta',
      fr: 'Brouillons de régime',
      de: 'Diät-Entwürfe',
      ua: 'Чернетки дієт',
      ru: 'Черновики диет',
      zh: '饮食草稿',
      hi: 'डाइट ड्राफ्ट्स',
      ar: 'مسودات الأنظمة الغذائية',
      he: 'טיוטות תפריטים'
    },
    noDrafts: {
      pl: 'Brak zapisanych wersji roboczych.',
      en: 'No saved drafts.',
      es: 'No hay borradores guardados.',
      fr: 'Aucun brouillon enregistré.',
      de: 'Keine gespeicherten Entwürfe.',
      ua: 'Немає збережених чернеток.',
      ru: 'Сохранённых черновиков нет.',
      zh: '没有保存的草稿。',
      hi: 'कोई सहेजे गए ड्राफ्ट नहीं हैं।',
      ar: 'لا توجد مسودات محفوظة.',
      he: 'אין טיוטות שמורות.'
    },
    confirmDeleteDrafts: {
      pl: 'Na pewno usunąć wszystkie wersje robocze?',
      en: 'Are you sure you want to delete all drafts?',
      es: '¿Seguro que quieres eliminar todos los borradores?',
      fr: 'Êtes-vous sûr de vouloir supprimer tous les brouillons ?',
      de: 'Möchten Sie wirklich alle Entwürfe löschen?',
      ua: 'Ви впевнені, що хочете видалити всі чернетки?',
      ru: 'Вы уверены, что хотите удалить все черновики?',
      zh: '确定要删除所有草稿吗？',
      hi: 'क्या आप वाकई सभी ड्राफ्ट हटाना चाहते हैं?',
      ar: 'هل أنت متأكد أنك تريد حذف جميع المسودات؟',
      he: 'האם אתה בטוח שברצונך למחוק את כל הטיוטות?'
    },
    
    historyTitle: {
      pl: 'Historia diet pacjenta',
      en: 'Patient diet history',
      es: 'Historial de dietas del paciente',
      fr: 'Historique des régimes du patient',
      de: 'Diätverlauf des Patienten',
      ua: 'Історія дієт пацієнта',
      ru: 'История диет пациента',
      zh: '患者饮食历史',
      hi: 'मरीज की डाइट का इतिहास',
      ar: 'تاريخ حميات المريض',
      he: 'היסטוריית תפריטים של המטופל'
    },
    seeHistory: {
      pl: '📚 Zobacz historię',
      en: '📚 View history',
      es: '📚 Ver historial',
      fr: '📚 Voir l’historique',
      de: '📚 Verlauf anzeigen',
      ua: '📚 Переглянути історію',
      ru: '📚 Посмотреть историю',
      zh: '📚 查看历史',
      hi: '📚 इतिहास देखें',
      ar: '📚 عرض السجل',
      he: '📚 הצג היסטוריה'
    },
    noHistory: {
      pl: 'Brak zapisanych diet.',
      en: 'No saved diets.',
      es: 'No hay dietas guardadas.',
      fr: 'Aucun régime enregistré.',
      de: 'Keine gespeicherten Diäten.',
      ua: 'Немає збережених дієт.',
      ru: 'Сохранённых диет нет.',
      zh: '没有保存的饮食计划。',
      hi: 'कोई सहेजी गई डाइट नहीं है।',
      ar: 'لا توجد حميات محفوظة.',
      he: 'אין תפריטים שמורים.'
    },
    dietLabel: {
      pl: 'Dieta',
      en: 'Diet',
      es: 'Dieta',
      fr: 'Régime',
      de: 'Diät',
      ua: 'Дієта',
      ru: 'Диета',
      zh: '饮食',
      hi: 'डाइट',
      ar: 'حمية',
      he: 'תפריט'
    },
    patientLabel: {
      pl: 'Pacjent',
      en: 'Patient',
      es: 'Paciente',
      fr: 'Patient',
      de: 'Patient',
      ua: 'Пацієнт',
      ru: 'Пациент',
      zh: '患者',
      hi: 'मरीज',
      ar: 'المريض',
      he: 'מטופל'
    },
    goal: {
      pl: 'Cel diety',
      en: 'Diet goal',
      es: 'Objetivo de la dieta',
      fr: 'Objectif du régime',
      de: 'Diätziel',
      ua: 'Мета дієти',
      ru: 'Цель диеты',
      zh: '饮食目标',
      hi: 'डाइट लक्ष्य',
      ar: 'هدف النظام الغذائي',
      he: 'מטרת התפריט'
    },
    cuisine: {
      pl: 'Kuchnia świata',
      en: 'World cuisine',
      es: 'Cocina del mundo',
      fr: 'Cuisine du monde',
      de: 'Weltküche',
      ua: 'Кухня світу',
      ru: 'Мировая кухня',
      zh: '世界美食',
      hi: 'विश्व भोजन शैली',
      ar: 'مطبخ عالمي',
      he: 'מטבח עולמי'
    },
    model: {
      pl: 'Model AI',
      en: 'AI model',
      es: 'Modelo de IA',
      fr: 'Modèle IA',
      de: 'KI-Modell',
      ua: 'Модель ШІ',
      ru: 'Модель ИИ',
      zh: 'AI模型',
      hi: 'एआई मॉडल',
      ar: 'نموذج الذكاء الاصطناعي',
      he: 'מודל בינה מלאכותית'
    },
    selectLanguage: {
      pl: 'Wybierz język',
      en: 'Select language',
      es: 'Seleccionar idioma',
      fr: 'Choisir la langue',
      de: 'Sprache auswählen',
      ua: 'Виберіть мову',
      ru: 'Выберите язык',
      zh: '选择语言',
      hi: 'भाषा चुनें',
      ar: 'اختر اللغة',
      he: 'בחר שפה'
    },
    selectDietGoal: {
      pl: "Cel diety",
      en: "Diet goal",
      ua: "Мета дієти",
      es: "Objetivo de la dieta",
      fr: "Objectif diététique",
      de: "Ernährungsziel",
      ru: "Цель диеты",
      zh: "饮食目标",
      hi: "आहार लक्ष्य",
      ar: "هدف النظام الغذائي",
      he: "מטרת הדיאטה"
    },
    selectCuisine: {
      pl: 'Wybierz kuchnię',
      en: 'Select cuisine',
      es: 'Seleccione cocina',
      fr: 'Sélectionnez la cuisine',
      de: 'Wählen Sie eine Küche',
      ua: 'Оберіть кухню',
      ru: 'Выберите кухню',
      zh: '选择菜系',
      hi: 'खानपान चुनें',
      ar: 'اختر المطبخ',
      he: 'בחר מטבח'
    },    
    selectModel: {
      pl: "Model diety",
      en: "Diet model",
      ua: "Модель дієти",
      es: "Modelo de dieta",
      fr: "Modèle de régime",
      de: "Ernährungsmodell",
      ru: "Модель питания",
      zh: "饮食模型",
      hi: "आहार मॉडल",
      ar: "نموذج النظام الغذائي",
      he: "מודל תזונה"
  },
  normalResult: {
    pl: 'W normie',
    en: 'Within range',
    es: 'Dentro del rango',
    fr: 'Dans la norme',
    de: 'Im Normbereich',
    ua: 'У межах норми',
    ru: 'В пределах нормы',
    zh: '在正常范围内',
    hi: 'सामान्य सीमा में',
    ar: 'ضمن النطاق',
    he: 'בתוך הטווח התקני'
  },
  abnormalResult: {
    pl: 'Poza normą',
    en: 'Out of range',
    es: 'Fuera del rango',
    fr: 'Hors norme',
    de: 'Außerhalb des Normbereichs',
    ua: 'Поза межами норми',
    ru: 'Вне нормы',
    zh: '超出范围',
    hi: 'सीमा से बाहर',
    ar: 'خارج النطاق',
    he: 'מחוץ לטווח התקני'
  },
  unknownRange: {
    pl: 'Nieznany zakres',
    en: 'Unknown range',
    es: 'Rango desconocido',
    fr: 'Plage inconnue',
    de: 'Unbekannter Bereich',
    ua: 'Невідомий діапазон',
    ru: 'Неизвестный диапазон',
    zh: '未知范围',
    hi: 'अज्ञात सीमा',
    ar: 'نطاق غير معروف',
    he: 'טווח לא ידוע'
  },
  selectModelForm: {
    pl: 'Wybierz model diety',
    en: 'Select diet model',
    de: 'Modell auswählen',
    ua: 'Оберіть модель дієти',
    ru: 'Выберите модель диеты',
    zh: '选择饮食模式',
    hi: 'आहार मॉडल चुनें',
    ar: 'اختر نموذج النظام الغذائي',
    he: 'בחר מודל תזונה',
    es: 'Seleccionar modelo de dieta',
    fr: 'Choisir un modèle de régime',
  },
  selectDiseaseGroups: {
    pl: 'Wybierz grupy chorób',
    en: 'Select disease groups',
    es: 'Selecciona grupos de enfermedades',
    fr: 'Sélectionnez des groupes de maladies',
    de: 'Wählen Sie Krankheitsgruppen',
    ua: 'Оберіть групи захворювань',
    ru: 'Выберите группы заболеваний',
    zh: '选择疾病组',
    hi: 'रोग समूह चुनें',
    ar: 'اختر مجموعات الأمراض',
    he: 'בחר קבוצות מחלות'
  },
  
  selectConditions: {
    pl: 'Wybierz choroby',
    en: 'Select conditions',
    es: 'Selecciona enfermedades',
    fr: 'Sélectionnez des maladies',
    de: 'Wählen Sie Krankheiten',
    ua: 'Оберіть хвороби',
    ru: 'Выберите заболевания',
    zh: '选择疾病',
    hi: 'रोग चुनें',
    ar: 'اختر الأمراض',
    he: 'בחר מחלות'
  },
  
  testResults: {
    pl: 'Wyniki badań',
    en: 'Test results',
    es: 'Resultados de las pruebas',
    fr: 'Résultats des tests',
    de: 'Testergebnisse',
    ua: 'Результати аналізів',
    ru: 'Результаты анализов',
    zh: '检测结果',
    hi: 'परीक्षण परिणाम',
    ar: 'نتائج الاختبارات',
    he: 'תוצאות בדיקות'
  },
  
  interviewTitle: {
    pl: 'Wywiad z pacjentem',
    en: 'Patient interview',
    es: 'Entrevista con el paciente',
    fr: 'Entretien avec le patient',
    de: 'Patienteninterview',
    ua: 'Опитування пацієнта',
    ru: 'Опрос пациента',
    zh: '病人访谈',
    hi: 'मरीज का साक्षात्कार',
    ar: 'مقابلة مع المريض',
    he: 'ראיון עם המטופל'
  },
  activity: {
    pl: 'Aktywność fizyczna', en: 'Physical activity', es: 'Actividad física', fr: 'Activité physique', de: 'Körperliche Aktivität', ua: 'Фізична активність', ru: 'Физическая активность', zh: '身体活动', hi: 'शारीरिक गतिविधि', ar: 'النشاط البدني', he: 'פעילות גופנית'
  },
  sleep: {
    pl: 'Sen', en: 'Sleep', es: 'Sueño', fr: 'Sommeil', de: 'Schlaf', ua: 'Сон', ru: 'Сон', zh: '睡眠', hi: 'नींद', ar: 'نوم', he: 'שינה'
  },
  stress: {
    pl: 'Poziom stresu', en: 'Stress level', es: 'Nivel de estrés', fr: 'Niveau de stress', de: 'Stresslevel', ua: 'Рівень стресу', ru: 'Уровень стресса', zh: '压力水平', hi: 'तनाव स्तर', ar: 'مستوى التوتر', he: 'רמת סטרס'
  },
  alcohol: {
    pl: 'Spożycie alkoholu', en: 'Alcohol consumption', es: 'Consumo de alcohol', fr: 'Consommation d’alcool', de: 'Alkoholkonsum', ua: 'Споживання алкоголю', ru: 'Потребление алкоголя', zh: '酒精摄入', hi: 'शराब सेवन', ar: 'استهلاك الكحول', he: 'צריכת אלכוהול'
  },
  smoking: {
    pl: 'Palenie', en: 'Smoking', es: 'Fumar', fr: 'Tabagisme', de: 'Rauchen', ua: 'Куріння', ru: 'Курение', zh: '吸烟', hi: 'धूम्रपान', ar: 'التدخين', he: 'עישון'
  },
  caffeine: {
    pl: 'Spożycie kofeiny', en: 'Caffeine intake', es: 'Consumo de cafeína', fr: 'Consommation de caféine', de: 'Koffeinkonsum', ua: 'Споживання кофеїну', ru: 'Потребление кофеина', zh: '咖啡因摄入', hi: 'कैफीन सेवन', ar: 'تناول الكافيين', he: 'צריכת קפאין'
  },
  mealsPerDay: {
    pl: 'Liczba posiłków dziennie', en: 'Meals per day', es: 'Comidas por día', fr: 'Repas par jour', de: 'Mahlzeiten pro Tag', ua: 'Кількість прийомів їжі', ru: 'Приемов пищи в день', zh: '每日餐次', hi: 'प्रति दिन भोजन', ar: 'عدد الوجبات اليومية', he: 'מספר ארוחות ביום'
  },
  mealTimes: {
    pl: 'Godziny posiłków', en: 'Meal times', es: 'Horarios de comida', fr: 'Heures de repas', de: 'Essenszeiten', ua: 'Час прийому їжі', ru: 'Время приема пищи', zh: '用餐时间', hi: 'भोजन का समय', ar: 'أوقات الوجبات', he: 'שעות ארוחות'
  },
  waterIntake: {
    pl: 'Spożycie wody', en: 'Water intake', es: 'Consumo de agua', fr: 'Consommation d’eau', de: 'Wasseraufnahme', ua: 'Споживання води', ru: 'Потребление воды', zh: '饮水量', hi: 'पानी का सेवन', ar: 'تناول الماء', he: 'שתיית מים'
  },
  sugarCravings: {
    pl: 'Łaknienie na słodycze', en: 'Sugar cravings', es: 'Antojo de azúcar', fr: 'Envie de sucre', de: 'Verlangen nach Süßem', ua: 'Тяга до солодкого', ru: 'Тяга к сладкому', zh: '渴望甜食', hi: 'मीठे की लालसा', ar: 'الرغبة في السكر', he: 'חשק למתוק'
  },
  fastFoodFrequency: {
    pl: 'Częstotliwość fast foodów', en: 'Fast food frequency', es: 'Frecuencia de comida rápida', fr: 'Fréquence de restauration rapide', de: 'Fast-Food-Häufigkeit', ua: 'Частота фаст-фуду', ru: 'Частота фастфуда', zh: '快餐频率', hi: 'फास्ट फूड आवृत्ति', ar: 'تكرار الوجبات السريعة', he: 'תדירות מזון מהיר'
  },
  excludedFoods: {
    pl: 'Wykluczone produkty', en: 'Excluded foods', es: 'Alimentos excluidos', fr: 'Aliments exclus', de: 'Ausgeschlossene Lebensmittel', ua: 'Виключені продукти', ru: 'Исключенные продукты', zh: '排除的食物', hi: 'निकाले गए खाद्य पदार्थ', ar: 'الأطعمة المستبعدة', he: 'מזונות מוחרגים'
  },
  likedFoods: {
    pl: 'Lubię jeść', en: 'Liked foods', es: 'Comidas favoritas', fr: 'Aliments préférés', de: 'Lieblingsspeisen', ua: 'Улюблені продукти', ru: 'Любимые продукты', zh: '喜欢的食物', hi: 'पसंदीदा भोजन', ar: 'الأطعمة المفضلة', he: 'מזון אהוב'
  },
  dislikedFoods: {
    pl: 'Nie lubię jeść', en: 'Disliked foods', es: 'Comidas no deseadas', fr: 'Aliments non appréciés', de: 'Unbeliebte Speisen', ua: 'Нелюбимі продукти', ru: 'Нелюбимые продукты', zh: '不喜欢的食物', hi: 'अप्रिय भोजन', ar: 'الأطعمة غير المرغوب فيها', he: 'מזון לא אהוב'
  },
  digestion: {
    pl: 'Trawienie', en: 'Digestion', es: 'Digestión', fr: 'Digestion', de: 'Verdauung', ua: 'Травлення', ru: 'Пищеварение', zh: '消化', hi: 'पाचन', ar: 'الهضم', he: 'עיכול'
  },
  bloating: {
    pl: 'Wzdęcia', en: 'Bloating', es: 'Hinchazón', fr: 'Ballonnements', de: 'Blähungen', ua: 'Здуття', ru: 'Вздутие', zh: '腹胀', hi: 'फुलाव', ar: 'الانتفاخ', he: 'נפיחות'
  },
  constipation: {
    pl: 'Zaparcia', en: 'Constipation', es: 'Estreñimiento', fr: 'Constipation', de: 'Verstopfung', ua: 'Закреп', ru: 'Запор', zh: '便秘', hi: 'कब्ज', ar: 'إمساك', he: 'עצירות'
  },
  menstrualCycle: {
    pl: 'Cykl menstruacyjny', en: 'Menstrual cycle', es: 'Ciclo menstrual', fr: 'Cycle menstruel', de: 'Menstruationszyklus', ua: 'Менструальний цикл', ru: 'Менструальный цикл', zh: '月经周期', hi: 'मासिक धर्म चक्र', ar: 'الدورة الشهرية', he: 'מחזור חודשי'
  },
  hormonalIssues: {
    pl: 'Problemy hormonalne', en: 'Hormonal issues', es: 'Problemas hormonales', fr: 'Problèmes hormonaux', de: 'Hormonelle Probleme', ua: 'Гормональні проблеми', ru: 'Гормональные проблемы', zh: '激素问题', hi: 'हार्मोनल समस्याएं', ar: 'مشاكل هرمونية', he: 'בעיות הורמונליות'
  },
  pregnancy: {
    pl: 'Ciąża', en: 'Pregnancy', es: 'Embarazo', fr: 'Grossesse', de: 'Schwangerschaft', ua: 'Вагітність', ru: 'Беременность', zh: '怀孕', hi: 'गर्भावस्था', ar: 'الحمل', he: 'הריון'
  },
  breastfeeding: {
    pl: 'Karmienie piersią', en: 'Breastfeeding', es: 'Lactancia', fr: 'Allaitement', de: 'Stillen', ua: 'Грудне вигодовування', ru: 'Грудное вскармливание', zh: '母乳喂养', hi: 'स्तनपान', ar: 'الرضاعة الطبيعية', he: 'הנקה'
  },
  contraception: {
    pl: 'Antykoncepcja', en: 'Contraception', es: 'Anticoncepción', fr: 'Contraception', de: 'Verhütung', ua: 'Контрацепція', ru: 'Контрацепция', zh: '避孕', hi: 'गर्भनिरोधक', ar: 'منع الحمل', he: 'אמצעי מניעה'
  },

    section1_title: {
      pl: "Dane podstawowe i cel wizyty",
      en: "Basic data and visit goal",
      de: "Grunddaten und Besuchsziel",
      ua: "Основні дані та мета візиту",
      ru: "Основные данные и цель визита",
      fr: "Données de base et objectif de la visite",
      es: "Datos básicos y objetivo de la visita",
      ar: "البيانات الأساسية وهدف الزيارة",
      he: "נתונים בסיסיים ומטרת הביקור",
      hi: "मूल डेटा और विज़िट का उद्देश्य",
      zh: "基本信息和就诊目的",
    },
   };
