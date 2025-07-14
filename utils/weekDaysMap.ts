import type { LangKey } from './i18n';

export const weekDaysMap: Record<string, Record<LangKey, string>> = {
  Sunday: { pl: 'Niedziela', en: 'Sunday', es: 'Domingo', fr: 'Dimanche', de: 'Sonntag', ua: 'Неділя', ru: 'Воскресенье', zh: '星期日', hi: 'रविवार', ar: 'الأحد', he: 'יום ראשון' },
  Monday: { pl: 'Poniedziałek', en: 'Monday', es: 'Lunes', fr: 'Lundi', de: 'Montag', ua: 'Понеділок', ru: 'Понедельник', zh: '星期一', hi: 'सोमवार', ar: 'الاثنين', he: 'יום שני' },
  Tuesday: { pl: 'Wtorek', en: 'Tuesday', es: 'Martes', fr: 'Mardi', de: 'Dienstag', ua: 'Вівторок', ru: 'Вторник', zh: '星期二', hi: 'मंगलवार', ar: 'الثلاثاء', he: 'יום שלישי' },
  Wednesday: { pl: 'Środa', en: 'Wednesday', es: 'Miércoles', fr: 'Mercredi', de: 'Mittwoch', ua: 'Середа', ru: 'Среда', zh: '星期三', hi: 'बुधवार', ar: 'الأربعاء', he: 'יום רביעי' },
  Thursday: { pl: 'Czwartek', en: 'Thursday', es: 'Jueves', fr: 'Jeudi', de: 'Donnerstag', ua: 'Четвер', ru: 'Четверг', zh: '星期四', hi: 'गुरुवार', ar: 'الخميس', he: 'יום חמישי' },
  Friday: { pl: 'Piątek', en: 'Friday', es: 'Viernes', fr: 'Vendredi', de: 'Freitag', ua: 'Пʼятниця', ru: 'Пятница', zh: '星期五', hi: 'शुक्रवार', ar: 'الجمعة', he: 'יום שישי' },
  Saturday: { pl: 'Sobota', en: 'Saturday', es: 'Sábado', fr: 'Samedi', de: 'Samstag', ua: 'Субота', ru: 'Суббота', zh: '星期六', hi: 'शनिवार', ar: 'السبت', he: 'יום שבת' }
};
