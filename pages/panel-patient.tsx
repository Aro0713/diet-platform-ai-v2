import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import { tUI } from '@/utils/i18n';
import type { Meal } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { usePatientData } from '@/hooks/usePatientData';
import { transformDietPlanToEditableFormat } from '@/utils/transformDietPlan';
import { PatientIconGrid } from '@/components/PatientIconGrid';
import PatientSelfForm from '@/components/PatientSelfForm';
import MedicalForm from '@/components/MedicalForm';
import InterviewWizard from '@/components/InterviewWizard';
import CalculationBlock from '@/components/CalculationBlock';
import DietTable from '@/components/DietTable';
import { extractMappedInterview } from '@/utils/interviewHelpers';
import type { LangKey } from '@/utils/i18n';
import DietGoalForm from '@/components/DietGoalForm';
import SelectModelForm from '@/components/SelectModelForm';
import SelectCuisineForm from '@/components/SelectCuisineForm';
import { generateDietPdf } from '@/utils/generateDietPdf';
import NeonNextArrow from "@/components/NeonNextArrow";
import ProductAssistantPanel from '@/components/ProductAssistantPanel';
import BasketTable from '@/components/BasketTable';
import SelectMealsPerDayForm from '@/components/SelectMealsPerDay';
import ProgressOverlay from '@/components/ProgressOverlay';
import { useRef } from 'react';

// ==== SSE + naprawa kształtu z API ====

async function generateDietStreaming(
  payload: any,
  onDelta: (t: string) => void,
  onFinal: (data: any) => void
) {
  const res = await fetch("/api/generate-diet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const frames = buf.split("\n\n"); // każda ramka SSE kończy się pustą linią
    buf = frames.pop() || "";

    for (const frame of frames) {
      const line = frame.split("\n").find(l => l.startsWith("data: "));
      if (!line) continue;

      const jsonStr = line.slice(6); // usuń prefix "data: "
      let evt: any;
      try { evt = JSON.parse(jsonStr); } catch { continue; }

      if (evt.type === "delta") {
        onDelta?.(evt.text || "");
      } else if (evt.type === "final") {
        onFinal?.(evt.result);
      } else if (evt.type === "error") {
        throw new Error(evt.message || "Stream error");
      }
      // "start", "warn", "ping" możesz logować wg uznania
    }
  }
}
// Etykiety posiłków w 11 językach
const MEAL_LABELS: Record<LangKey, Record<string,string>> = {
  pl:{breakfast:'Śniadanie',second_breakfast:'Drugie śniadanie',lunch:'Obiad',afternoon_snack:'Podwieczorek',dinner:'Kolacja',snack:'Przekąska'},
  en:{breakfast:'Breakfast',second_breakfast:'Second breakfast',lunch:'Lunch',afternoon_snack:'Afternoon snack',dinner:'Dinner',snack:'Snack'},
  de:{breakfast:'Frühstück',second_breakfast:'Zweites Frühstück',lunch:'Mittagessen',afternoon_snack:'Nachmittagsimbiss',dinner:'Abendessen',snack:'Snack'},
  fr:{breakfast:'Petit-déjeuner',second_breakfast:'Deuxième petit-déj.',lunch:'Déjeuner',afternoon_snack:'Collation',dinner:'Dîner',snack:'Snack'},
  es:{breakfast:'Desayuno',second_breakfast:'Segundo desayuno',lunch:'Comida',afternoon_snack:'Merienda',dinner:'Cena',snack:'Snack'},
  ua:{breakfast:'Сніданок',second_breakfast:'Другий сніданок',lunch:'Обід',afternoon_snack:'Перекуска',dinner:'Вечеря',snack:'Снек'},
  ru:{breakfast:'Завтрак',second_breakfast:'Второй завтрак',lunch:'Обед',afternoon_snack:'Полдник',dinner:'Ужин',snack:'Перекус'},
  zh:{breakfast:'早餐',second_breakfast:'加餐(早)',lunch:'午餐',afternoon_snack:'下午加餐',dinner:'晚餐',snack:'小吃'},
  hi:{breakfast:'नाश्ता',second_breakfast:'दूसरा नाश्ता',lunch:'दोपहर का भोजन',afternoon_snack:'शाम का नाश्ता',dinner:'रात का खाना',snack:'स्नैक'},
  ar:{breakfast:'فطور',second_breakfast:'فطور ثانٍ',lunch:'غداء',afternoon_snack:'وجبة خفيفة',dinner:'عشاء',snack:'سناك'},
  he:{breakfast:'ארוחת בוקר',second_breakfast:'בוקר שני',lunch:'ארוחת צהריים',afternoon_snack:'נשנוש אחה״צ',dinner:'ארוחת ערב',snack:'חטיף'}
};
const mealLabel = (key:string, lang:LangKey) =>
  (MEAL_LABELS[lang] && MEAL_LABELS[lang][key]) || key;

// Bezpieczny fallback, gdy w tUI brakuje klucza i zwraca sam klucz
const stepsLabelText = (lang:LangKey) => {
  const v = tUI('stepsLabel', lang);
  if (v === 'stepsLabel') { // brak tłumaczenia
    if (lang === 'ar') return 'الخطوات';
    if (lang === 'pl') return 'Kroki';
    return 'Steps';
  }
  return v;
};


function mapIndexToDayName(idx: string | number, lang: string): string {
  const days: Record<string, string[]> = {
    pl: ["Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota","Niedziela"],
    en: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    de: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],
    fr: ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"],
    es: ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"],
    ua: ["Понеділок","Вівторок","Середа","Четвер","П’ятниця","Субота","Неділя"],
    ru: ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"],
    zh: ["星期一","星期二","星期三","星期四","星期五","星期六","星期日"],
    ar: ["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"],
    hi: ["सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार","रविवार"],
    he: ["יום שני","יום שלישי","יום רביעי","יום חמישי","יום שישי","שבת","יום ראשון"]
  };
    const arr = days[lang] || days.pl;
  const n = typeof idx === "string" ? parseInt(idx, 10) : idx;
  return Number.isFinite(n) && arr[n] ? arr[n] : String(idx);
}
function translateDayNameIfKnown(day: string, targetLang: string): string {
  const days: Record<string, string[]> = {
    pl: ["Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota","Niedziela"],
    en: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    de: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],
    fr: ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"],
    es: ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"],
    ua: ["Понеділок","Вівторок","Середа","Четвер","П’ятниця","Субота","Неділя"],
    ru: ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"],
    zh: ["星期一","星期二","星期三","星期四","星期五","星期六","星期日"],
    ar: ["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"],
    hi: ["सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार","रविवार"],
    he: ["יום שני","יום שלישי","יום רביעי","יום חמישי","יום שישי","שבת","יום ראשון"]
  };
  const langs = Object.keys(days);
  for (const src of langs) {
    const idx = days[src].indexOf(day);
    if (idx !== -1) return (days[targetLang] || days.pl)[idx] || day;
  }
  return day;
}

function parseQuantityToNumber(q: any): { weight: number|null, unit?: string } {
  if (q == null) return { weight: null };
  if (typeof q === "number") return { weight: q, unit: "g" };
  if (typeof q !== "string") return { weight: null };
  const s = q.trim().toLowerCase();
  const mG = s.match(/^(\d+(?:[.,]\d+)?)\s*g$/);
  if (mG) return { weight: parseFloat(mG[1].replace(",", ".")), unit: "g" };
  const mMl = s.match(/^(\d+(?:[.,]\d+)?)\s*ml$/);
  if (mMl) return { weight: parseFloat(mMl[1].replace(",", ".")), unit: "ml" };
  const mNum = s.match(/^(\d+(?:[.,]\d+)?)$/); // "1", "2"
  if (mNum) return { weight: parseFloat(mNum[1]), unit: "pcs" };
  return { weight: null };
}

function repairStreamResult(result: any, lang: string) {
  // wybierz dietPlan z możliwych miejsc
  let plan = result?.dietPlan ?? result?.CORRECTED_JSON?.dietPlan ?? result?.CORRECTED_JSON ?? {};

  const out: Record<string, Meal[]> = {};
  for (const [dayKey, val] of Object.entries(plan || {})) {
    const dayName = /^\d+$/.test(String(dayKey)) ? mapIndexToDayName(dayKey, lang) : (dayKey as string);

    // ogarnij różne kształty dnia
    let meals: any[] = [];
    if (val && typeof val === "object" && !Array.isArray(val) && Array.isArray((val as any).meals)) {
      meals = (val as any).meals;
    } else if (Array.isArray(val)) {
      meals = val;
    } else if (val && typeof val === "object") {
      meals = Object.values(val);
    }

    out[dayName] = (meals || []).map((m: any) => {
      const ing = (m.ingredients || []).map((i: any) => {
        const product = i.product ?? i.name ?? i.item ?? "";
        const { weight, unit } = parseQuantityToNumber(i.weight ?? i.quantity);
        return {
          product,
          weight: weight ?? 0,
          unit: unit ?? (weight != null ? "g" : undefined),
        };
      });

      return {
        name: m.name ?? m.mealName ?? m.meal ?? "Posiłek",
        menu: m.menu ?? m.mealName ?? m.meal ?? "Posiłek",
        time: m.time ?? "",
        glycemicIndex: m.glycemicIndex ?? m.gi ?? 0,
        ingredients: ing,
        macros: {
          kcal: 0, protein: 0, fat: 0, carbs: 0,
          fiber: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
          iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0, vitaminC: 0,
          vitaminA: 0, vitaminE: 0, vitaminK: 0,
          ...(m.macros ?? m.nutrition ?? {})
        },
        day: dayName
      } as Meal;
    });
  }

  return { ...result, dietPlan: out as Record<string, Meal[]> };
}

function parseRawDietPlan(raw: any): Record<string, Meal[]> {
  const parsed: Record<string, Meal[]> = {};

  for (const [day, dayData] of Object.entries(raw || {})) {
    const mealsForDay: Meal[] = [];

    if (Array.isArray(dayData)) {
      for (const meal of dayData) {
        if (!meal || typeof meal !== 'object') continue;

        const name = meal.name || meal.menu || meal.mealName || 'Posiłek';
        const time = meal.time || '00:00';
        const ingredients = (meal.ingredients || []).map((i: any) => ({
          product: i.product || i.name || '',
          weight:
            typeof i.weight === 'number'
              ? i.weight
              : typeof i.quantity === 'number'
              ? i.quantity
              : Number(i.weight) || Number(i.quantity) || 0
        })).filter((i: any) =>
          i.product && typeof i.product === 'string' &&
          !['undefined', 'null', 'name'].includes(i.product.toLowerCase())
        );
        mealsForDay.push({
          name,
          time,
          menu: name,
          ingredients,
          macros: meal.macros || {
            kcal: 0, protein: 0, fat: 0, carbs: 0,
            fiber: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0,
            iron: 0, zinc: 0, vitaminD: 0, vitaminB12: 0, vitaminC: 0,
            vitaminA: 0, vitaminE: 0, vitaminK: 0,
          },
          glycemicIndex: meal.glycemicIndex ?? 0,
          day
        });
      }
    }

    parsed[day] = mealsForDay;
  }

  return parsed;
}

export default function PatientPanelPage(): React.JSX.Element {
  const router = useRouter();
  const [lang, setLang] = useState<LangKey>('pl');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [notes, setNotes] = useState({});
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [narrativeText, setNarrativeText] = useState('');
  const [dietApproved, setDietApproved] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipes, setRecipes] = useState<any>(null);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [doctorList, setDoctorList] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generatingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [subscriptionStartedAt, setSubscriptionStartedAt] = useState<string | null>(null);
  const [robotPrograms, setRobotPrograms] = useState<any>(null);
  const [isGeneratingRobot, setIsGeneratingRobot] = useState(false);
  const [robotHistory, setRobotHistory] = useState<any[]>([]);
  const [robotMeta, setRobotMeta] = useState<{ cached?: boolean; profile?: string } | null>(null);
  const [robotFilterDay, setRobotFilterDay] = useState<string>('');
  const [robotFilterMeal, setRobotFilterMeal] = useState<string>('');
  const [isLoadingRobotHistory, setIsLoadingRobotHistory] = useState(false);
    
  // Auto-aktualizacja płatności po wygaśnięciu subskrypcji
useEffect(() => {
  if (!subscriptionExpiresAt) { setHasPaid(false); return; }
  const check = () => setHasPaid(new Date(subscriptionExpiresAt) > new Date());
  check();
  const id = setInterval(check, 60_000); // sprawdzaj co minutę
  return () => clearInterval(id);
}, [subscriptionExpiresAt]);

  const formatDate = (dateString: string | null) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(lang || 'pl');
  };

  // ✅ HOOK bezwarunkowo — React nie krzyczy
  const patientData = usePatientData();

  // ⏳ Pobierz userId z Supabase tylko raz
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data?.session?.user?.id;
      if (!uid) {
        console.warn('❌ Brak user.id – użytkownik nie jest zalogowany?');
        setIsLoadingUser(false);
        return;
      }

      console.log('✅ userId z sesji:', uid);
      localStorage.setItem('currentUserID', uid);
      setUserId(uid);
      setIsLoadingUser(false);
    });
  }, []);

  // ✅ Destrukturyzacja dopiero teraz
  const {
    form,
    setForm,
    interviewData,
    setInterviewData,
    medicalData,
    setMedicalData,
    fetchPatientData,
    saveMedicalData,
    saveInterviewData,
    initialMedicalData,
    initialInterviewData,
    editableDiet,
    setEditableDiet
  } = patientData;

    const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  };

    const refreshRobotHistory = async () => {
    try {
      setIsLoadingRobotHistory(true);
      const accessToken = await getAccessToken();
      if (!accessToken) return;

      const listRes = await fetch(`/api/robot-programs?limit=5&accessToken=${encodeURIComponent(accessToken)}`);
      const listJson = await listRes.json();
      setRobotHistory(Array.isArray(listJson?.items) ? listJson.items : []);
    } catch (e) {
      console.error('❌ refresh robot history:', e);
    } finally {
      setIsLoadingRobotHistory(false);
    }
  };

  useEffect(() => {
  const storedLang = localStorage.getItem('platformLang');
  if (storedLang) setLang(storedLang as LangKey);

  supabase.auth.getSession().then(async ({ data }) => {
    const uid = data?.session?.user?.id;
    if (!uid) {
      console.warn("❌ Brak user.id – użytkownik nie jest zalogowany?");
      setIsLoadingUser(false);
      return;
    }

    setUserId(uid); // ✅ zapis lokalny
    console.log("✅ userId:", uid);

    try {
      // 🔽 Flaga płatności
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('subscription_status, subscription_started_at, subscription_expires_at, trial_ends_at, plan')
      .eq('user_id', uid)
      .maybeSingle();

    if (patientError) {
      console.error('❌ Błąd pobierania danych subskrypcji:', patientError.message);
    } else {
    const status = patientData?.subscription_status || 'none';
    const expires = patientData?.subscription_expires_at || null;
    const trialEnds = patientData?.trial_ends_at || null;
    const plan = patientData?.plan || null;

    const now = new Date();

    // ✅ trial aktywny, jeśli status=trialing i trial_ends_at jest w przyszłości
    const canceled = status === 'canceled';
    const trialActive = !canceled && status === 'trialing' && !!trialEnds && new Date(trialEnds) > now;

    // ✅ plan aktywny po opłaceniu (legacy one-time albo po trialu, jeśli zapiszesz expires)
    const activePaid =
      status === 'active' && !!expires && new Date(expires) > now;
    
    // ✅ fallback: jeśli masz expires w przyszłości, też traktuj jako dostęp
    const hasAccess =
      trialActive || activePaid || (!!expires && new Date(expires) > now);

    // To steruje ikonami/sektorami w panelu
    setHasPaid(hasAccess);

    // ✅ to steruje tekstem "trial" vs "Twój plan"
    setIsTrialActive(trialActive);

    // status do wyświetlenia
    setSubscriptionStatus(hasAccess ? (plan ?? status) : 'expired');

    // data ważności: dla trialu pokaż trial_ends_at, inaczej expires
    setSubscriptionExpiresAt(trialActive ? trialEnds : expires);

    console.log(
      `💳 status=${status} plan=${plan} expires=${expires} trialEnds=${trialEnds} hasAccess=${hasAccess} trialActive=${trialActive}`
    );


    }

      // 🔽 Dieta
      const { data: dietData, error: dietError } = await supabase
        .from('patient_diets')
        .select('*')
        .eq('user_id', uid)
        .eq('status', 'confirmed')
        .order('confirmed_at', { ascending: false })
        .limit(1);

      if (dietError) {
        console.error('❌ Błąd przy pobieraniu diety:', dietError.message);
      } else if (dietData && dietData[0]) {
        setEditableDiet((prev: Record<string, Meal[]> | undefined) => {
          if (prev && Object.keys(prev).length > 0) return prev;
          return dietData[0].diet_plan;
        });
        setDietApproved(true);
      }
    } catch (err) {
      console.error("❌ Błąd w ładowaniu danych użytkownika:", err);
    } finally {
      setIsLoadingUser(false); // ✅ zakończ ładowanie
    }
  });
}, []);

const startFakeProgress = (from = 5, to = 95, durationMs = 300000) => {
  stopFakeProgress(); // reset ewentualnego poprzedniego interwału
  setProgress(from);
  const steps = to - from;
  const delay = Math.floor(durationMs / steps);

  progressIntervalRef.current = setInterval(() => {
    setProgress((prev) => {
      if (prev >= to) return prev;
      return prev + 1;
    });
  }, delay);
};


const stopFakeProgress = () => {
  if (progressIntervalRef.current) {
    clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = null;
  }
};

// 🔁 Pobranie danych pacjenta przy wejściu w sekcję: 'data', 'medical', 'interview'
// + załaduj zatwierdzoną dietę, jeśli nie została jeszcze ustawiona
useEffect(() => {
  const userId = localStorage.getItem('currentUserID');
  if (!userId) return;

  const shouldFetchPatient =
    selectedSection === 'data' ||
    selectedSection === 'medical' ||
    selectedSection === 'interview';

  if (shouldFetchPatient) {
    console.log('🔁 Auto-fetch danych pacjenta (sekcja):', selectedSection);
    fetchPatientData();
  }

  // ✅ Pobierz zatwierdzoną dietę, tylko jeśli jeszcze nie została ustawiona
  supabase
    .from('patient_diets')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .order('confirmed_at', { ascending: false })
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Błąd przy pobieraniu diety:', error.message);
      } else if (data && data[0]) {
        setEditableDiet((prev: Record<string, Meal[]> | undefined) => {
          if (prev && Object.keys(prev).length > 0) {
            console.log("🔁 Dieta już była ustawiona — pomijam nadpisywanie.");
            return prev;
          } else {
            console.log('✅ Załadowano zatwierdzoną dietę z Supabase:', data[0]);
            return data[0].diet_plan;
          }
        });
        setDietApproved(true);
      } else {
        console.warn('⚠️ Brak potwierdzonej diety');
      }
    });
}, [selectedSection]);
useEffect(() => {
  if (selectedSection !== 'robot') return;

  (async () => {
    try {
      setIsLoadingRobotHistory(true);

      const accessToken = await getAccessToken();
      if (!accessToken) return;

      // 1) latest
      const latestRes = await fetch(`/api/robot-programs?latest=true&limit=1&accessToken=${encodeURIComponent(accessToken)}`);
      const latestJson = await latestRes.json();
      const latestItem = latestJson?.items?.[0] ?? null;

      if (latestItem?.program_json) {
        const program = latestItem.program_json;
        setRobotPrograms(program);
      } else {
        // jeśli brak, nie nadpisuj ewentualnie wygenerowanego w sesji
        // setRobotPrograms(null);
      }

      // 2) historia (5)
      const listRes = await fetch(`/api/robot-programs?limit=5&accessToken=${encodeURIComponent(accessToken)}`);
      const listJson = await listRes.json();
      setRobotHistory(Array.isArray(listJson?.items) ? listJson.items : []);
    } catch (e) {
      console.error('❌ load robot programs:', e);
    } finally {
      setIsLoadingRobotHistory(false);
    }
  })();
}, [selectedSection]);

const saveDietToSupabaseAndPdf = async () => {
  try {
    setProgressMessage(tUI('savingDiet', lang));
    startFakeProgress(5, 95, 300000);

    const bmi = form.weight && form.height
      ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
      : 0;

    const mealArray: Meal[] = Object.entries(editableDiet || {})
      // pomiń meta / techniczne
      .filter(([k]) => !k.startsWith('__'))
      // dzień może być tablicą albo mapą posiłków
      .flatMap(([, v]: [string, any]) => Array.isArray(v) ? v : Object.values(v || {}))
      // dopilnuj składników
      .map((m: any) => ({
        ...m,
        ingredients: Array.isArray(m?.ingredients)
          ? m.ingredients.map((i: any) => ({
              product: i?.product ?? i?.name ?? '',
              weight: typeof i?.weight === 'number'
                ? i.weight
                : typeof i?.quantity === 'number'
                  ? i.quantity
                  : Number(i?.weight ?? i?.quantity) || 0,
              unit: i?.unit || (i?.weight != null || i?.quantity != null ? 'g' : undefined),
            }))
          : []
      }));
    if (!mealArray.length) {
      alert(tUI('noMealsToSave', lang));
      stopFakeProgress();
      setProgress(0);
      setProgressMessage('');
      return;
    }

    const userId = localStorage.getItem('currentUserID');
    if (!userId) {
      console.error('❌ Brak userId przy zapisie diety!');
      alert(tUI('noUserId', lang));
      stopFakeProgress();
      setProgress(0);
      setProgressMessage('');
      return;
    }

    if (!editableDiet || typeof editableDiet !== 'object' || Array.isArray(editableDiet)) {
      console.error('❌ Nieprawidłowy diet_plan:', editableDiet);
      alert(tUI('dietDataInvalid', lang));
      stopFakeProgress();
      setProgress(0);
      setProgressMessage('');
      return;
    }

    const cleanDiet = JSON.parse(JSON.stringify(editableDiet));

    const { error } = await supabase
      .from('patient_diets')
      .upsert({
        user_id: userId,
        diet_plan: cleanDiet,
        status: 'draft',
        patient_name: form?.name || '',
        ...(selectedDoctor && { selected_doctor_id: selectedDoctor }) // 👈 tylko jeśli podano
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Błąd zapisu draftu:', error.message);
      alert(tUI('dietApprovalFailed', lang));
      stopFakeProgress();
      setProgress(0);
      setProgressMessage('');
      return;
    }

    setProgressMessage(tUI('generatingPdf', lang));

    await generateDietPdf(
      form,
      bmi,
      mealArray,
      true,
      notes,
      lang,
      interviewData,
      {
        bmi: interviewData.bmi,
        ppm: interviewData.ppm,
        cpm: interviewData.cpm,
        pal: interviewData.pal,
        kcalMaintain: interviewData.kcalMaintain,
        kcalReduce: interviewData.kcalReduce,
        kcalGain: interviewData.kcalGain,
        nmcBroca: interviewData.nmcBroca,
        nmcLorentz: interviewData.nmcLorentz
      },
      'download',
      narrativeText,
      recipes
    );

    stopFakeProgress();
    setProgress(100);
    setProgressMessage(tUI('pdfReady', lang));
    setTimeout(() => {
      setProgress(0);
      setProgressMessage('');
    }, 1000);

    alert(tUI('dietSaveSuccess', lang));
  } catch (err) {
    console.error(`${tUI('dietApprovalErrorPrefix', lang)}:`, err);
    alert(tUI('dietApprovalFailed', lang));
    stopFakeProgress();
    setProgress(0);
    setProgressMessage('');
  }
};


const saveDietToSupabaseOnly = async () => {
  if (!editableDiet || Object.keys(editableDiet).length === 0) return;

  const userId = localStorage.getItem('currentUserID');
  if (!userId) {
    alert(tUI('notLoggedIn', lang));
    return;
  }

  try {
    setProgressMessage(tUI('savingDiet', lang));
    startFakeProgress(10, 95, 300000);

    const { error } = await supabase
      .from('patient_diets')
      .upsert({
        user_id: userId,
        diet_plan: editableDiet,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        patient_name: form?.name || ''
      }, { onConflict: 'user_id' });

    if (error) throw new Error(error.message);

    stopFakeProgress();
    setProgress(100);
    setProgressMessage(tUI('dietReady', lang));
    setTimeout(() => {
      setProgress(0);
      setProgressMessage('');
    }, 1000);

    alert(tUI('dietApproved', lang));
  } catch (err) {
    console.error("❌ Błąd zapisu diety (try/catch):", err);
    alert(tUI("errorSavingDiet", lang));
    stopFakeProgress();
    setProgress(0);
    setProgressMessage('');
  }
};
async function generateDietStreaming(
  payload: any,
  {
    onPartial,
    onFinal,
    onStatus
  }: {
    onPartial: (day: string, meals: any[], progress?: number) => void;
    onFinal: (data: any) => void;
    onStatus?: (phase: string, meta?: any) => void;
  }
) {
  // przerwij ewentualny poprzedni strumień
  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;

  const res = await fetch("/api/generate-diet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });

  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  // 🔁 Fallback: jeśli API nie streamuje SSE, tylko zwraca JSON
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/event-stream")) {
    const data = await res.json();
    onFinal?.(data);
    return; // ⬅️ kończymy bez czytania strumienia
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const frames = buf.split("\n\n");
    buf = frames.pop() || "";

    for (const frame of frames) {
      if (!frame.startsWith("data:")) continue;

      const jsonStr = frame.slice(5).trim(); // po "data:"
      let evt: any;
      try { evt = JSON.parse(jsonStr); } catch { continue; }

      if (evt.type === "partial") {
        // ⬅️ dzień po dniu
        onPartial?.(evt.day, evt.meals || [], evt.progress);
      } else if (evt.type === "final") {
        onFinal?.(evt.result);
      } else if (evt.type === "status" || evt.type === "warn") {
        onStatus?.(evt.phase || evt.type, evt);
      } else if (evt.type === "timeout") {
        // serwer zamknął po ~270s – mamy częściowy plan
        onStatus?.("timeout", evt);
        return; // przerywamy czytanie, spinner zamknie onStatus/timeout po stronie UI
      } else if (evt.type === "error") {
        throw new Error(evt.message || "Stream error");
      }
      // "delta"/"ping" ignorujemy
    }
  }
}

const handleGenerateDiet = async () => {
  if (generatingRef.current) return; // 🔒 anty-pętla
  generatingRef.current = true;

  setProgress(5);
  setProgressMessage(tUI('startingDietGeneration', lang));
  setStreamingText('');
  setDietApproved(false);

  if (!medicalData) {
    alert(tUI('medicalApprovalRequired', lang));
    setProgress(0); setProgressMessage('');
    generatingRef.current = false;
    return;
  }
  if (form?.model === 'Dieta eliminacyjna' && (!interviewData || Object.keys(interviewData).length === 0)) {
    alert(tUI('interviewRequiredForElimination', lang));
    setProgress(0); setProgressMessage('');
    generatingRef.current = false;
    return;
  }

  try {
    // animacja paska; front nie wisi, bo dostajemy "partial"
    startFakeProgress(10, 95, 300000);
    setIsGenerating(true);
    setEditableDiet({}); // czyścimy widok przed nową generacją

    await generateDietStreaming(
      {
        form,
        interviewData,
        testResults: medicalData?.json,
        medicalDescription: medicalData?.summary,
        lang,
      },
      {
        onPartial: (day, meals, prog) => {
          // 🧩 dokładamy kolumnę dnia
          setEditableDiet((prev: Record<string, Meal[]> | undefined) => {
          const next: Record<string, Meal[]> = { ...(prev ?? {}) };
          next[day as string] = (Array.isArray(meals) ? (meals as Meal[]) : []);
          return next;
        });
          if (typeof prog === 'number') setProgress(Math.max(10, Math.min(prog, 99)));
          setProgressMessage(`${tUI('writingDiet', lang)} — ${day}`);
        },
        onStatus: (phase) => {
          if (phase === 'timeout') {
            stopFakeProgress();
            setProgress(100);
            setProgressMessage(tUI('dietReady', lang));
            setTimeout(() => { setProgress(0); setProgressMessage(''); }, 800);
          }
        },
        onFinal: (result) => {
          setProgress(70);
          setProgressMessage(tUI('validatingDiet', lang));
        const fixed = repairStreamResult(result, lang);

        // meta z wyniku lub z formularza/wywiadu
        const model   = String(interviewData?.model ?? form?.model ?? result?.model ?? '');
        const cuisine = String(interviewData?.cuisine ?? result?.cuisine ?? '');
        const goal    = interviewData?.goal ?? '';
        const mealsPerDay = Number(interviewData?.mealsPerDay) || undefined;

        // diet + meta dla nagłówka tabeli (Cel, Model, Kuchnia, Liczba posiłków)
        setEditableDiet({
          ...(fixed.dietPlan as Record<string, Meal[]>),
          __meta: { goal, model, cuisine, mealsPerDay }
        } as any);

        setDietApproved(true);

          setEditableDiet({
            ...(fixed.dietPlan as Record<string, Meal[]>),
            __meta: {
              model,
              cuisine,
              goal: interviewData?.goal,
              mealsPerDay: Number(interviewData?.mealsPerDay) || undefined
            }
          } as any);
          setDietApproved(true);

          stopFakeProgress();
          setProgress(100);
          setProgressMessage(tUI('dietReady', lang));
          setTimeout(() => { setProgress(0); setProgressMessage(''); }, 800);
        }
      }
    );
    } catch (err) {
      console.error(`${tUI('dietGenerationErrorPrefix', lang)} ${err}`);
      alert(tUI('dietGenerationFailed', lang));
      stopFakeProgress();
      setProgress(0);
      setProgressMessage('');
    } finally {
      setIsGenerating(false);
      generatingRef.current = false; // 🔓 odblokuj kolejne generowanie
    }
  };


  async function saveDraftToSupabaseWithDoctor(email: string): Promise<void> {
    try {
      const userId = localStorage.getItem('currentUserID');

      if (!userId) {
        alert(tUI('noUserIdError', lang));
        return;
      }

      if (!editableDiet || typeof editableDiet !== 'object' || Array.isArray(editableDiet)) {
        console.error('❌ Nieprawidłowy diet_plan:', editableDiet);
        alert(tUI('dietDataInvalid', lang));
        return;
      }

      const cleanDiet = JSON.parse(JSON.stringify(editableDiet));

      const { error } = await supabase
        .from('patient_diets')
        .upsert(
          {
            user_id: userId,
            diet_plan: cleanDiet,
            status: 'draft',
            patient_name: form?.name || '',
            ...(email && { selected_doctor_id: email }) // 👈 tylko jeśli email podany
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error(`${tUI('draftSaveErrorLog', lang)}:`, error.message);
        alert(tUI('dietSubmissionError', lang));
      } else {
        alert(tUI('dietSubmissionSuccess', lang));
      }
    } catch (err) {
      console.error(`${tUI('draftSaveCatchErrorLog', lang)}:`, err);
      alert(tUI('dietSaveError', lang));
    }
  }


  const handleGenerateRecipes = async () => {
    try {
      setProgress(10);
      setProgressMessage(tUI('generatingRecipes', lang));

    const res = await fetch('/api/generate-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dietPlan: editableDiet,
        lang    
      })
    });

      setProgress(60);
      setProgressMessage(tUI('processingRecipes', lang));

      const json = await res.json();
      setRecipes(json.recipes);

      setProgress(100);
      setProgressMessage(tUI('recipesReady', lang));
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1000);
    } catch (err) {
      console.error('❌ Błąd generowania przepisów:', err);
      alert(tUI('errorGeneratingRecipes', lang));
      setProgress(0);
      setProgressMessage('');
    }
  };
  const handleGenerateRobotProgram = async () => {
    try {
      const hasRobot =
        Boolean(form?.has_kitchen_robot) &&
        Boolean(String(form?.kitchen_robot_model || '').trim()) &&
        Boolean(String(form?.kitchen_robot_serial || '').trim());

      if (!hasPaid) {
        alert(tUI('subscriptionRequired', lang));
        return;
      }

      if (!hasRobot) {
        alert(tUI('kitchenRobot.missingConfig', lang));
        return;
      }

      if (!editableDiet || Object.keys(editableDiet).length === 0) {
        alert(tUI('kitchenRobot.noDiet', lang));
        return;
      }

      // 🔐 Pobierz access token
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;

      if (!accessToken) {
        alert(tUI('notLoggedIn', lang));
        return;
      }

      setIsGeneratingRobot(true);
      setProgress(10);
      setProgressMessage(tUI('kitchenRobot.generating', lang));

      const res = await fetch('/api/generate-robot-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken, // ✅ NOWE
          lang,
          dietPlan: editableDiet,
          robot: {
            model: form?.kitchen_robot_model,
            serial: form?.kitchen_robot_serial,
            profile: form?.kitchen_robot_profile || 'cobbo-tuya-v0'
          }
        })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setRobotMeta({ cached: Boolean(json?.cached), profile: json?.profile });

      // 🧠 backend zwraca { recipes, profile }
      setRobotPrograms(json?.recipes ? json : { recipes: [] });
      setRobotFilterDay('');
      setRobotFilterMeal('');
      setProgress(100);
      setProgressMessage(tUI('kitchenRobot.ready', lang));

      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 800);

    } catch (err) {
      console.error('❌ Robot program generation error:', err);
      alert(tUI('kitchenRobot.error', lang));
      setProgress(0);
      setProgressMessage('');
    } finally {
      setIsGeneratingRobot(false);
    }
  };
  const handleGenerateNarrative = async () => {
    try {
      setProgress(20);
      setProgressMessage(tUI('generatingNarrative', lang));

      const response = await fetch('/api/interview-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewData,
          goal: interviewData.goal,
          recommendation: interviewData.recommendation,
          lang
        })
      });

      const { narrativeText } = await response.json();
      if (narrativeText) setNarrativeText(narrativeText);

      setProgress(100);
      setProgressMessage(tUI('narrativeReady', lang));
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1000);
    } catch (err) {
      console.error('❌ Błąd przy pobieraniu opisu AI:', err);
      setNarrativeText('⚠️ Błąd generowania opisu wywiadu przez AI');
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleSectionChange = async (newSection: string) => {
    if (!hasPaid && newSection !== 'data') {
      alert(tUI('subscriptionRequired', lang));
      return;
    }

    // zapisz dane z aktualnej sekcji
    if (selectedSection === 'medical' && medicalData) {
      await saveMedicalData(medicalData);
      console.log('💾 Autozapis: dane medyczne zapisane');
    }
    if (selectedSection === 'interview' && interviewData) {
      await saveInterviewData(interviewData);
      console.log('💾 Autozapis: dane z wywiadu zapisane');
    }

    setSelectedSection(newSection);
    setTimeout(() => {
      document.getElementById(`section-${newSection}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const handleShowDoctors = async () => {
    if (!showDoctorDropdown) {
      setShowDoctorDropdown(true);
      if (doctorList.length === 0) {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email')
          .in('role', ['doctor', 'dietitian']);

        if (error) {
          console.error('❌ Błąd pobierania listy lekarzy:', error.message);
        } else {
          setDoctorList((data || []).sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
    }
  };
  const isMobile = () =>
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const openTuyaApp = (lang: LangKey) => {
    // Smart Life / Tuya Smart – deep linki “otwórz aplikację”
    const deepLinks = ["smartlife://", "tuyasmart://"];
    const storeAndroid = "https://play.google.com/store/apps/details?id=com.tuya.smartlife";
    const storeIos = "https://apps.apple.com/app/smart-life-smart-living/id1115101477";

    if (!isMobile()) {
      alert(tUI("kitchenRobot.tuyaDesktopInfo", lang));
      window.open("https://www.tuya.com/", "_blank", "noopener,noreferrer");
      return;
    }

    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const storeUrl = isAndroid ? storeAndroid : storeIos;

    let opened = false;
    const tryOpen = (url: string) => {
      opened = true;
      window.location.href = url;
    };

    // próbujemy po kolei, a jak nie zadziała, lecimy do store
    tryOpen(deepLinks[0]);

    setTimeout(() => {
      // jeśli app nie przejęła nawigacji, user zostaje w przeglądarce => store
      if (opened) window.location.href = storeUrl;
    }, 900);
  };
    // ===== ETAP 8.2-5: filtry dnia/posiłku dla programów robota =====
    const robotRecipes: any[] = Array.isArray(robotPrograms?.recipes) ? robotPrograms.recipes : [];

    const uniqueRobotDays = Array.from(
      new Set(robotRecipes.map(r => String(r?.day || '')).filter(Boolean))
    );

    const uniqueRobotMeals = Array.from(
      new Set(robotRecipes.map(r => String(r?.meal || '')).filter(Boolean))
    );

    const filteredRobotRecipes = robotRecipes.filter(r => {
      const dOk = !robotFilterDay || String(r?.day || '') === robotFilterDay;
      const mOk = !robotFilterMeal || String(r?.meal || '') === robotFilterMeal;
      return dOk && mOk;
    });
    
 return (
  <main className="relative min-h-screen overflow-x-hidden text-white bg-[#06131a]">
    <Head>
      <title>{tUI('patientPanelTitle', lang)}</title>
    </Head>

    {/* GLASS BACKDROP (wizual) */}
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_15%,rgba(56,189,248,.22),transparent_60%),radial-gradient(900px_600px_at_80%_25%,rgba(167,139,250,.16),transparent_60%),radial-gradient(900px_700px_at_55%_85%,rgba(16,185,129,.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.10)_0%,rgba(255,255,255,.04)_30%,rgba(0,0,0,.10)_100%)] opacity-70" />
      <div className="absolute inset-0 opacity-[0.10] mix-blend-overlay">
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06131a] to-transparent opacity-60" />
    </div>

    {/* LAYOUT */}
    <div className="relative z-10 mx-auto w-full max-w-[1680px] px-3 sm:px-4 md:px-6 lg:px-8 pt-3 md:pt-5">
      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-5 lg:gap-6">
        {/* LEFT MENU */}
        <aside className="lg:sticky lg:top-4 h-fit rounded-3xl border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,.45)] overflow-hidden">
          <div className="p-5">
            {/* Header: Name + Title */}
            <div className="mb-4">
              {form?.name && (
                <div className="text-sm font-medium text-white/80">
                  {form.name}
                </div>
              )}
              <h1 className="text-2xl font-bold tracking-tight">
                {tUI('patientPanelTitle', lang)}
              </h1>
            </div>

            {/* Language only (bez kontrastu) */}
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/7 backdrop-blur-xl p-3">
              {/* Jeśli LangAndThemeToggle potrafi przyjąć setLang/lang i ma opcję wyłączenia theme:
                  użyj go tutaj. W przeciwnym razie podmień na swój <select> z languageLabels. */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-wide text-white/60">
                  {tUI('nav.languageLabel', lang) === 'nav.languageLabel' ? 'Language' : tUI('nav.languageLabel', lang)}
                </div>
                <div className="shrink-0">
                  <LangAndThemeToggle />
                </div>
              </div>
            </div>

            {/* Menu: icons */}
            <div className="mt-4">
             <PatientIconGrid
              lang={lang}
              selected={selectedSection}
              onSelect={handleSectionChange}
              hasPaid={hasPaid}
              isTrialActive={isTrialActive}
              form={form}
              layout="sidebar"
            />
            </div>

            {/* Subscription status */}
            {hasPaid && (
              <div
                className="mt-4 rounded-2xl border border-white/10 bg-white/7 backdrop-blur-xl p-4"
                dir={['ar','he'].includes(lang) ? 'rtl' : undefined}
              >
                <div className="text-xs uppercase tracking-wide text-white/60 mb-1">
                  {isTrialActive ? tUI('trialActive', lang) : tUI('yourPlan', lang)}
                </div>
                <div className="text-sm text-emerald-200">
                  {isTrialActive ? (
                    <>
                      {tUI('trialUntil', lang)} <strong className="text-white">{formatDate(subscriptionExpiresAt)}</strong>
                    </>
                  ) : (
                    <>
                      <strong className="text-white">{subscriptionStatus}</strong><br />
                      {tUI('validUntil', lang)} <strong className="text-white">{formatDate(subscriptionExpiresAt)}</strong>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Logout */}
            <div className="mt-5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } finally {
                    localStorage.removeItem('currentUserID');
                    localStorage.removeItem('currentUserRole');
                    router.push('/register?mode=login');
                  }
                }}
                className="w-full rounded-2xl px-4 py-3 font-semibold border border-white/10 bg-white/8 hover:bg-white/12 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.30)] transition"
              >
                {tUI('logout', lang) === 'logout' ? 'Wyloguj się' : tUI('logout', lang)}
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER WORKSPACE */}
        <section className="min-w-0">
          <div className="mx-auto w-full max-w-[1180px] 2xl:max-w-[1320px]">
          {/* Welcome (when no section) */}
          {!selectedSection && (
            <div className="rounded-3xl border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,.45)] p-6 md:p-10">
              <p className="text-center text-white/90 text-sm max-w-xl mx-auto">
                {tUI('welcomeMessagePatient', lang)}
              </p>
            </div>
          )}

          {/* Main content container */}
          {selectedSection && (
            <div className="rounded-3xl border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,.45)] p-5 md:p-10 transition-colors">
              {selectedSection === 'data' && (
                <>
                  <PatientSelfForm lang={lang} value={form} />
                  <div className="flex justify-end mt-6">
                    <NeonNextArrow
                      onClick={() => handleSectionChange('medical')}
                      label={tUI('nextSection_medical', lang)}
                    />
                  </div>
                </>
              )}

              {selectedSection === 'medical' && (
                <>
                  <MedicalForm
                    onChange={(data) => {
                      saveMedicalData(data).then(() => setIsConfirmed(true));
                    }}
                    onUpdateMedical={(summary) => {
                      setMedicalData((prev: any) => ({ ...prev, summary }));
                    }}
                    initialData={initialMedicalData}
                    existingMedical={medicalData}
                    lang={lang}
                  />

                  {isConfirmed && interviewData?.goal && (
                    <div className="mt-6 p-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-base shadow max-w-2xl mx-auto">
                      {tUI('medicalConfirmationMessage', lang)}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <NeonNextArrow
                      onClick={() => handleSectionChange('interview')}
                      label={tUI('nextSection_interview', lang)}
                    />
                  </div>
                </>
              )}

              {selectedSection === 'interview' && (
                <>
                  <InterviewWizard
                    form={form}
                    onFinish={async (data) => {
                      await saveInterviewData(data);
                      await handleGenerateNarrative();
                    }}
                    lang={lang}
                    initialData={initialInterviewData}
                  />

                  {interviewData?.goal && (
                    <div className="mt-6 p-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 text-base shadow max-w-2xl mx-auto">
                      {tUI('interviewConfirmationMessage', lang)}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <NeonNextArrow
                      onClick={() => handleSectionChange('calculator')}
                      label={tUI('nextSection_calculator', lang)}
                    />
                  </div>
                </>
              )}

              {selectedSection === 'calculator' && (
                <>
                  <CalculationBlock
                    form={form}
                    interview={extractMappedInterview(interviewData)}
                    lang={lang}
                    onResult={(result) => {
                      setInterviewData((prev: any) => ({
                        ...prev,
                        ...result,
                        model: result.suggestedModel
                      }));
                    }}
                  />

                  <div className="mt-6 flex justify-end">
                    <NeonNextArrow
                      onClick={() => handleSectionChange('diet')}
                      label={tUI('nextSection_diet', lang)}
                    />
                  </div>
                </>
              )}

              {selectedSection === 'diet' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-center w-full">
                    <div className="w-full sm:max-w-[360px] min-h-[180px] flex flex-col justify-between items-stretch px-3 sm:px-4 mx-auto">
                      <DietGoalForm
                        lang={lang}
                        onChange={(goal) => setInterviewData({ ...interviewData, goal })}
                      />
                    </div>

                    <div className="w-full sm:max-w-[360px] min-h-[180px] flex flex-col justify-between items-stretch px-3 sm:px-4 mx-auto">
                      <SelectModelForm
                        lang={lang}
                        onChange={(model) => setInterviewData({ ...interviewData, model })}
                      />
                    </div>

                    <div className="w-full sm:max-w-[360px] min-h-[180px] flex flex-col justify-between items-stretch px-3 sm:px-4 mx-auto">
                      <SelectCuisineForm
                        lang={lang}
                        onChange={(cuisine) => setInterviewData({ ...interviewData, cuisine })}
                      />
                    </div>

                    <div className="w-full sm:max-w-[360px] min-h-[180px] flex flex-col justify-between items-stretch px-3 sm:px-4 mx-auto">
                      <SelectMealsPerDayForm
                        value={interviewData?.mealsPerDay ?? 0}
                        onChange={(meals: number) => setInterviewData({ ...interviewData, mealsPerDay: meals })}
                        lang={lang}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isGenerating && (
                      <div className="text-sm text-white/70 italic animate-pulse">
                        ⏳ {tUI('writingDiet', lang)} {streamingText.length > 20 && `(${tUI('generatingWait', lang)})`}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-6">
                      <button
                        onClick={handleGenerateDiet}
                        disabled={isGenerating}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,.22),rgba(16,185,129,.14))] hover:bg-[linear-gradient(135deg,rgba(56,189,248,.30),rgba(16,185,129,.18))] shadow-[0_18px_60px_rgba(0,0,0,.30)] backdrop-blur-xl text-white font-semibold flex flex-col items-center justify-center text-center transition disabled:opacity-50"
                      >
                        <span className="text-4xl leading-none">🧠</span>
                        <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
                          {tUI('generateDiet', lang)}
                        </span>
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            setProgress(10);
                            setProgressMessage(tUI('generatingPdf', lang));

                            const { generateDietPdf } = await import('@/utils/generateDietPdf');

                            const bmi =
                              form.weight && form.height
                                ? parseFloat((form.weight / ((form.height / 100) ** 2)).toFixed(1))
                                : 0;

                            const mealArray: Meal[] = Object.entries(editableDiet || {})
                              .filter(([k]) => !k.startsWith('__'))
                              .flatMap(([, v]: [string, any]) => Array.isArray(v) ? v : Object.values(v || {}))
                              .map((m: any) => ({
                                ...m,
                                ingredients: Array.isArray(m?.ingredients)
                                  ? m.ingredients.map((i: any) => ({
                                      product: i?.product ?? i?.name ?? '',
                                      weight: typeof i?.weight === 'number'
                                        ? i.weight
                                        : typeof i?.quantity === 'number'
                                          ? i.quantity
                                          : Number(i?.weight ?? i?.quantity) || 0,
                                      unit: i?.unit || (i?.weight != null || i?.quantity != null ? 'g' : undefined),
                                    }))
                                  : []
                              }));

                            if (!Array.isArray(mealArray) || mealArray.length === 0) {
                              alert(tUI('dietPlanEmptyOrInvalid', lang));
                              setProgress(0);
                              setProgressMessage('');
                              return;
                            }

                            setProgress(40);
                            setProgressMessage(tUI('processingInterview', lang));

                            await generateDietPdf(
                              form,
                              bmi,
                              mealArray,
                              true,
                              notes,
                              lang,
                              interviewData,
                              {
                                bmi: interviewData.bmi,
                                ppm: interviewData.ppm,
                                cpm: interviewData.cpm,
                                pal: interviewData.pal,
                                kcalMaintain: interviewData.kcalMaintain,
                                kcalReduce: interviewData.kcalReduce,
                                kcalGain: interviewData.kcalGain,
                                nmcBroca: interviewData.nmcBroca,
                                nmcLorentz: interviewData.nmcLorentz
                              },
                              'download',
                              narrativeText,
                              recipes
                            );

                            setProgress(100);
                            setProgressMessage(tUI('pdfReady', lang));
                            setTimeout(() => {
                              setProgress(0);
                              setProgressMessage('');
                            }, 1000);
                          } catch (e) {
                            console.error('❌ PDF generation error:', e);
                            alert(tUI('errorGeneratingPdf', lang));
                            setProgress(0);
                            setProgressMessage('');
                          }
                        }}
                        disabled={!editableDiet || Object.keys(editableDiet).length === 0 || progress > 0}
                        className="w-28 h-28 rounded-2xl border border-white/10 bg-white/8 hover:bg-white/12 shadow-[0_18px_60px_rgba(0,0,0,.30)] backdrop-blur-xl text-white font-semibold flex flex-col items-center justify-center text-center transition disabled:opacity-50"
                      >
                        <span className="text-4xl leading-none">📄</span>
                        <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
                          {tUI('generatePdf', lang)}
                        </span>
                      </button>

                      <button
                        onClick={async () => {
                          const confirm = window.confirm(tUI('confirmApproveDietAsPatient', lang));
                          if (confirm) {
                            await saveDietToSupabaseOnly();
                          }
                        }}
                        disabled={!editableDiet || Object.keys(editableDiet).length === 0}
                        className="w-28 h-28 rounded-2xl border border-white/10 bg-white/8 hover:bg-white/12 shadow-[0_18px_60px_rgba(0,0,0,.30)] backdrop-blur-xl text-white font-semibold flex flex-col items-center justify-center text-center transition disabled:opacity-50"
                      >
                        <span className="text-4xl leading-none">✅</span>
                        <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
                          {tUI('approveDietAsPatient', lang)}
                        </span>
                      </button>

                      {editableDiet && Object.keys(editableDiet).length > 0 && (
                        <button
                          onClick={handleGenerateRecipes}
                          disabled={isGeneratingRecipes}
                          className="w-28 h-28 rounded-2xl border border-white/10 bg-white/8 hover:bg-white/12 shadow-[0_18px_60px_rgba(0,0,0,.30)] backdrop-blur-xl text-white font-semibold flex flex-col items-center justify-center text-center transition disabled:opacity-50"
                        >
                          <span className="text-4xl leading-none">🍽️</span>
                          <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
                            {tUI('generateRecipes', lang)}
                          </span>
                        </button>
                      )}

                      {editableDiet && form?.has_kitchen_robot && (
                        <button
                          onClick={() => handleSectionChange('robot')}
                          className="w-28 h-28 rounded-2xl border border-white/10 bg-white/8 hover:bg-white/12 shadow-[0_18px_60px_rgba(0,0,0,.30)] backdrop-blur-xl text-white font-semibold flex flex-col items-center justify-center text-center transition"
                        >
                          <span className="text-4xl leading-none">🤖</span>
                          <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
                            {tUI('kitchenRobot.generateFromDiet', lang)}
                          </span>
                        </button>
                      )}

                      {editableDiet && Object.keys(editableDiet).length > 0 && (
                        <button
                          onClick={async () => {
                            const confirm = window.confirm(tUI('confirmSendDietToDoctor', lang));
                            if (!confirm) return;

                            const doctorEmail = form?.assigned_doctor_email;
                            if (!doctorEmail) {
                              alert(tUI('noAssignedDoctor', lang));
                              return;
                            }

                            const userId = localStorage.getItem('currentUserID');
                            if (!userId) {
                              alert(tUI('noUserIdError', lang));
                              return;
                            }

                            setIsSending(true);
                            setProgressMessage(tUI('savingDraft', lang));
                            startFakeProgress(10, 25, 60000);

                            try {
                              const cleanDiet = JSON.parse(JSON.stringify(editableDiet));
                              const { error } = await supabase.from('patient_diets').upsert(
                                {
                                  user_id: userId,
                                  diet_plan: cleanDiet,
                                  status: 'draft',
                                  patient_name: form?.name || '',
                                  selected_doctor_id: doctorEmail
                                },
                                { onConflict: 'user_id' }
                              );

                              if (error) throw error;

                              await fetch('/api/send-diet-notification', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  doctorEmail,
                                  patientName: form?.name,
                                  patientEmail: form?.email,
                                  lang
                                })
                              });

                              stopFakeProgress();
                              setProgress(100);
                              setProgressMessage(tUI('dietSentToDoctor', lang));
                              setTimeout(() => {
                                setProgress(0);
                                setProgressMessage('');
                              }, 1000);

                              alert(tUI('dietSubmissionSuccess', lang));
                            } catch (err) {
                              console.error('❌ Błąd zapisu wersji roboczej diety:', err);
                              alert(tUI('dietSubmissionError', lang));
                              stopFakeProgress();
                              setProgress(0);
                              setProgressMessage('');
                            } finally {
                              setIsSending(false);
                            }
                          }}
                          disabled={isSending}
                          className="w-28 h-28 rounded-2xl border border-white/10 bg-white/8 hover:bg-white/12 shadow-[0_18px_60px_rgba(0,0,0,.30)] backdrop-blur-xl text-white font-semibold flex flex-col items-center justify-center text-center transition disabled:opacity-50"
                        >
                          <span className="text-4xl leading-none">📤</span>
                          <span className="text-sm mt-2 leading-tight px-2 max-w-full break-words whitespace-normal">
                            {tUI('sendDietToDoctor', lang)}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {editableDiet && Object.keys(editableDiet).length > 0 && (
                    <div className="mt-6">
                      <DietTable
                        editableDiet={editableDiet}
                        setEditableDiet={setEditableDiet}
                        setConfirmedDiet={() => {}}
                        isEditable={false}
                        lang={lang}
                        notes={notes}
                        setNotes={setNotes}
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedSection === 'robot' && (
                <div className="space-y-6">
                  {/* UWAGA: tu zostawiam Twoją sekcję robot 1:1, tylko styl kontenerów na glass */}
                  {!hasPaid && (
                    <div className="rounded-2xl border border-white/10 bg-white/7 backdrop-blur-2xl p-4">
                      <div className="font-bold text-lg">{tUI('kitchenRobot.guard.noAccessTitle', lang)}</div>
                      <div className="text-sm opacity-90 mt-1">{tUI('kitchenRobot.guard.noAccessDesc', lang)}</div>
                      <div className="mt-4">
                        <Link href="/payment">
                          <button className="w-full sm:w-auto rounded-2xl px-6 py-3 font-semibold border border-white/10 bg-white/10 hover:bg-white/14 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.30)] transition">
                            💳 {tUI('goToPayment', lang)}
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {hasPaid && (!form?.has_kitchen_robot || !String(form?.kitchen_robot_model || '').trim() || !String(form?.kitchen_robot_serial || '').trim()) && (
                    <div className="rounded-2xl border border-white/10 bg-white/7 backdrop-blur-2xl p-4">
                      <div className="font-bold text-lg">{tUI('kitchenRobot.guard.fixConfigTitle', lang)}</div>
                      <div className="text-sm opacity-90 mt-1">{tUI('kitchenRobot.guard.fixConfigDesc', lang)}</div>
                      <div className="mt-4">
                        <button
                          onClick={() => handleSectionChange('data')}
                          className="w-full sm:w-auto rounded-2xl px-6 py-3 font-semibold border border-white/10 bg-white/10 hover:bg-white/14 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.30)] transition"
                        >
                          📝 {tUI('kitchenRobot.goToRegistration', lang)}
                        </button>
                      </div>
                    </div>
                  )}

                  {hasPaid && form?.has_kitchen_robot && String(form?.kitchen_robot_model || '').trim() && String(form?.kitchen_robot_serial || '').trim() && (!editableDiet || Object.keys(editableDiet).length === 0) && (
                    <div className="rounded-2xl border border-white/10 bg-white/7 backdrop-blur-2xl p-4">
                      <div className="font-bold text-lg">{tUI('kitchenRobot.guard.noDietTitle', lang)}</div>
                      <div className="text-sm opacity-90 mt-1">{tUI('kitchenRobot.guard.noDietDesc', lang)}</div>
                      <div className="mt-4">
                        <button
                          onClick={() => handleSectionChange('diet')}
                          className="w-full sm:w-auto rounded-2xl px-6 py-3 font-semibold border border-white/10 bg-white/10 hover:bg-white/14 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.30)] transition"
                        >
                          🍽️ {tUI('kitchenRobot.goToDiet', lang)}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reszta Twojej sekcji robot zostaje 1:1 — tylko podmień swoje kontenery bg na glass jak wyżej */}
                  {/* ... */}
                </div>
              )}

              {selectedSection === 'scanner' && (
                <>
                  <ProductAssistantPanel
                    lang={lang}
                    patient={form}
                    form={form}
                    interviewData={interviewData}
                    medical={medicalData}
                    dietPlan={editableDiet}
                  />
                  <BasketTable lang={lang} />
                </>
              )}
            </div>
          )}

          {progress > 0 && progress < 100 && (
            <ProgressOverlay message={progressMessage} percent={progress} />
          )}
         </div>
      </section>
    </div>
  </div>
</main>
);
}