// pages/panel.tsx (Panel lekarza / dietetyka) — dark-only, logo po prawej, sidebar menu po prawej, brak trybu "pacjent bez konta"

// 🔁 React / Next
import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

// 🔌 Supabase
import { supabase } from "@/lib/supabaseClient";

// 🧩 UI
import PanelCard from "@/components/PanelCard";
import MedicalForm from "@/components/MedicalForm";
import InterviewWizard from "@/components/InterviewWizard";
import DietGoalForm from "@/components/DietGoalForm";
import SelectCuisineForm from "@/components/SelectCuisineForm";
import SelectModelForm from "@/components/SelectModelForm";
import CalculationBlock from "@/components/CalculationBlock";
import DietTable from "@/components/DietTable";
import ConfirmationModal from "@/components/ConfirmationModal";
import { translatedTitles } from "@/utils/translatedTitles";

// 🧠 AI i utils
import { convertInterviewAnswers, extractMappedInterview } from "@/utils/interviewHelpers";
import { tryParseJSON } from "@/utils/tryParseJSON";

// 🌍 Tłumaczenia
import { tUI } from "@/utils/i18n";
import { translationsUI } from "@/utils/translationsUI";
import type { LangKey } from "@/utils/i18n";

// 🔁 Hooki danych pacjenta
import { usePatientFetchData } from "@/hooks/usePatientFetchData";
import { usePatientSubmitData } from "@/hooks/usePatientSubmitData";

// 📊 Typy
import type { Meal, PatientData } from "@/types";

// -----------------------------
// Helpers
// -----------------------------

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// 🔎 Tłumaczy zarówno klucze jak i już przetłumaczone wartości.
// 1) Jeśli 'val' jest kluczem w translationsUI → tUI(val, lang)
// 2) Jeśli 'val' jest wartością (np. "Dieta ketogeniczna") → znajdź klucz po values[lang] i przetłumacz
function tResolve(val: unknown, lang: LangKey): string {
  const raw = (typeof val === "string" ? val.trim() : "") as string;
  if (!raw) return "—";

  // Spróbuj potraktować jako klucz
  try {
    const direct = tUI(raw as any, lang);
    if (direct && direct !== raw) return direct;
  } catch {
    /* ignore */
  }

  // Odwrotne wyszukiwanie: znajdź klucz, którego tłumaczenie w 'lang' == raw
  for (const [k, v] of Object.entries(translationsUI)) {
    if (v && typeof v === "object" && (v as any)[lang] === raw) {
      try {
        return tUI(k as any, lang);
      } catch {
        return raw;
      }
    }
  }

  return raw;
}

// Przepis w formacie używanym w UI i PDF
type RecipeUI = {
  dish: string;
  description?: string;
  servings?: number;
  time?: string;
  ingredients: { product: string; weight: number | null; unit: string }[];
  steps: string[];
};

// → kształt zgodny z utils/generateDietPdf.ts (wymagane description i servings)
type RecipePdf = {
  dish: string;
  description: string;
  servings: number;
  time?: string;
  ingredients: { product: string; weight: number; unit: string }[];
  steps: string[];
};

function toPdfRecipes(input: Record<string, Record<string, RecipeUI>>): Record<string, Record<string, RecipePdf>> {
  const out: Record<string, Record<string, RecipePdf>> = {};

  for (const [day, meals] of Object.entries(input ?? {}) as [string, Record<string, RecipeUI>][]) {
    const dayOut: Record<string, RecipePdf> = {};

    for (const [mealName, r] of Object.entries(meals ?? {}) as [string, RecipeUI][]) {
      dayOut[mealName] = {
        dish: r.dish ?? "",
        description: r.description ?? "",
        servings: typeof r.servings === "number" ? r.servings : 1,
        time: r.time || undefined,
        ingredients: (r.ingredients ?? []).map((ing: RecipeUI["ingredients"][number]) => ({
          product: ing.product ?? "",
          weight: typeof ing.weight === "number" ? ing.weight : 0,
          unit: ing.unit || "g",
        })),
        steps: Array.isArray(r.steps) ? r.steps.filter((s): s is string => typeof s === "string") : [],
      };
    }

    out[day] = dayOut;
  }

  return out;
}

function parseRawDietPlan(raw: any): Record<string, Meal[]> {
  const parsed: Record<string, Meal[]> = {};

  for (const [day, dayData] of Object.entries(raw || {})) {
    const mealsForDay: Meal[] = [];

    if (Array.isArray(dayData)) {
      for (const meal of dayData) {
        if (!meal || typeof meal !== "object") continue;

        const name = meal.name || meal.menu || meal.mealName || "Posiłek";
        const time = meal.time || "00:00";

        const ingredients = (meal.ingredients || [])
          .map((i: any) => ({
            product: i.product || i.name || "",
            weight:
              typeof i.weight === "number"
                ? i.weight
                : typeof i.quantity === "number"
                  ? i.quantity
                  : Number(i.weight) || Number(i.quantity) || 0,
          }))
          .filter(
            (i: any) =>
              i.product &&
              typeof i.product === "string" &&
              !["undefined", "null", "name"].includes(i.product.toLowerCase())
          );

        mealsForDay.push({
          name,
          time,
          menu: name,
          ingredients,
          macros: meal.macros || {
            kcal: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
            fiber: 0,
            sodium: 0,
            potassium: 0,
            calcium: 0,
            magnesium: 0,
            iron: 0,
            zinc: 0,
            vitaminD: 0,
            vitaminB12: 0,
            vitaminC: 0,
            vitaminA: 0,
            vitaminE: 0,
            vitaminK: 0,
          },
          glycemicIndex: meal.glycemicIndex ?? 0,
          day,
        });
      }
    }

    parsed[day] = mealsForDay;
  }

  return parsed;
}

type SectionKey =
  | "patient"
  | "medical"
  | "interview"
  | "recommendation"
  | "goalModelCuisine"
  | "calculator"
  | "actions"
  | "diet"
  | "recipes";

function Panel() {
  const router = useRouter();

  const [lang, setLang] = useState<LangKey>("pl");
  const [userData, setUserData] = useState<any>(null);

  const [mealPlan, setMealPlan] = useState<Record<string, Meal[]>>({});
  const [diet, setDiet] = useState<Record<string, Meal[]> | null>(null);

  const [streamingText, setStreamingText] = useState("");
  const [confirmedDiet, setConfirmedDiet] = useState<Meal[] | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [dietApproved, setDietApproved] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [submitPending, setSubmitPending] = useState<(() => void) | null>(null);

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [narrativeText, setNarrativeText] = useState("");

  const [recipes, setRecipes] = useState<Record<string, Record<string, RecipeUI>>>({});
  const [recipesLoading, setRecipesLoading] = useState(false);

  const [patientEmailInput, setPatientEmailInput] = useState("");
  const [patientLoadStatus, setPatientLoadStatus] = useState<"idle" | "loading" | "notFound" | "success">("idle");

  const [selectedSection, setSelectedSection] = useState<SectionKey | null>(null);

  const sectionRefs: Record<SectionKey, React.RefObject<HTMLDivElement | null>> = {
  patient: useRef<HTMLDivElement | null>(null),
  medical: useRef<HTMLDivElement | null>(null),
  interview: useRef<HTMLDivElement | null>(null),
  recommendation: useRef<HTMLDivElement | null>(null),
  goalModelCuisine: useRef<HTMLDivElement | null>(null),
  calculator: useRef<HTMLDivElement | null>(null),
  actions: useRef<HTMLDivElement | null>(null),
  diet: useRef<HTMLDivElement | null>(null),
  recipes: useRef<HTMLDivElement | null>(null),
};
  const {
    form,
    setForm,
    interviewData,
    setInterviewData,
    medicalData,
    setMedicalData,
    loadPatientData,
    initialMedicalData,
    initialInterviewData,
    editableDiet,
    setEditableDiet,
  } = usePatientFetchData();

  const { saveMedicalData, saveInterviewData, saveDietPlan, confirmDietPlan } = usePatientSubmitData(form);

  const t = (key: keyof typeof translationsUI): string => tUI(key, lang);

  // -----------------------------
  // Dark-only: wymuszenie dark
  // -----------------------------
  useEffect(() => {
    document.documentElement.classList.add("dark");
    try {
      localStorage.setItem("theme", "dark");
    } catch {
      /* ignore */
    }
  }, []);

  // Lang z localStorage
  useEffect(() => {
    const langStorage = (localStorage.getItem("platformLang") as LangKey | null) || null;
    if (langStorage) setLang(langStorage);
  }, []);

  // Pobierz dane usera (lekarz/dietetyk)
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user?.id) {
        console.error("❌ Nie udało się pobrać usera:", error?.message);
        return;
      }

      const { data, error: userError } = await supabase.from("users").select("*").eq("user_id", user.id).maybeSingle();

      if (userError) {
        console.error("❌ Błąd pobierania danych użytkownika:", userError.message);
        return;
      }

      if (data) setUserData(data);
    };

    fetchUserData();
  }, []);

  // Gdy dieta wpadnie z bazy/hooka → zasil tabelę
  useEffect(() => {
    if (editableDiet && Object.keys(editableDiet).length) {
      setMealPlan(editableDiet);
      setDiet(editableDiet);

      const flat: Meal[] = [];
      for (const [day, meals] of Object.entries(editableDiet)) {
        const list = Array.isArray(meals) ? meals : (Object.values(meals ?? {}) as Meal[]);
        for (const m of list) flat.push({ ...m, day });
      }
      setConfirmedDiet(flat);
    }
  }, [editableDiet]);

  // -----------------------------
  // Load latest diet from Supabase
  // -----------------------------
  const loadLatestDietFromSupabase = async (userId: string) => {
    let data: any = null;
    let error: any = null;

    const fullSelect = "diet_plan, status, created_at, goal, model, cuisine, meals_per_day";

    ({ data, error } = await supabase
      .from("patient_diets")
      .select(fullSelect)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle());

    if (error) {
      console.warn("ℹ️ patient_diets meta select failed, retrying base select:", error.message);
      const retry = await supabase
        .from("patient_diets")
        .select("diet_plan, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn("⚠️ Błąd pobierania diety pacjenta:", error.message);
      return;
    }

    const rawJson = data?.diet_plan ?? null;
    if (!rawJson) {
      console.log("ℹ️ Brak zapisanej diety dla pacjenta.");
      return;
    }

    const raw = typeof rawJson === "string" ? tryParseJSON(rawJson) ?? {} : rawJson;

    const loaded = parseRawDietPlan(raw);
    if (!loaded || !Object.keys(loaded).length) {
      console.warn("⚠️ diet_plan pusty lub w nieoczekiwanym formacie.");
      return;
    }

    setMealPlan(loaded);
    setDiet(loaded);
    setEditableDiet(loaded);

    const flat: Meal[] = [];
    for (const [day, meals] of Object.entries(loaded)) {
      const list = Array.isArray(meals) ? meals : (Object.values(meals ?? {}) as Meal[]);
      for (const m of list) flat.push({ ...m, day });
    }
    setConfirmedDiet(flat);

    setDietApproved(data?.status === "confirmed");

    let metaGoal = data?.goal ?? null;
    let metaModel = data?.model ?? null;
    let metaCuisine = data?.cuisine ?? null;
    let metaMeals = data?.meals_per_day ?? null;

    if (!metaGoal || !metaModel || !metaCuisine || typeof metaMeals !== "number") {
      const { data: pData } = await supabase.from("patients").select("interview_data").eq("user_id", userId).maybeSingle();

      const I =
        typeof pData?.interview_data === "string" ? tryParseJSON(pData.interview_data) : pData?.interview_data || {};

      metaGoal = metaGoal ?? I?.goal ?? null;
      metaModel = metaModel ?? I?.model ?? null;
      metaCuisine = metaCuisine ?? I?.cuisine ?? null;
      metaMeals = typeof metaMeals === "number" ? metaMeals : typeof I?.mealsPerDay === "number" ? I.mealsPerDay : null;
    }

    setInterviewData((prev: any) => ({
      ...prev,
      goal: metaGoal ?? prev?.goal ?? null,
      model: metaModel ?? prev?.model ?? null,
      cuisine: metaCuisine ?? prev?.cuisine ?? null,
      mealsPerDay: (typeof metaMeals === "number" ? metaMeals : null) ?? prev?.mealsPerDay ?? null,
    }));
  };

  // -----------------------------
  // Patient search (registered only)
  // -----------------------------
  const handleSearchPatient = async () => {
    setPatientLoadStatus("loading");

    const email = patientEmailInput.trim().toLowerCase();
    if (!email) {
      setPatientLoadStatus("idle");
      return;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      console.error("❌ Nie udało się pobrać użytkownika (auth.uid())", error?.message);
      setPatientLoadStatus("notFound");
      return;
    }

    const doctorId = user.id;

    // zapis requestu dostępu (zostaje – to element workflow)
    const { error: insertError } = await supabase.from("patient_access_requests").insert([
      {
        doctor_id: doctorId,
        patient_email: email,
        status: "pending",
      },
    ]);

    if (insertError) {
      console.error("❌ Błąd podczas tworzenia zgłoszenia:", insertError.message);
      setPatientLoadStatus("notFound");
      return;
    }

    const { data: patient } = await supabase.from("patients").select("user_id").eq("email", email).maybeSingle();

    if (patient?.user_id) {
      await loadPatientData(patient.user_id);
      setPatientLoadStatus("success");
      await loadLatestDietFromSupabase(patient.user_id);
    } else {
      alert(tUI("accessRequestSent", lang));
      setPatientLoadStatus("idle");
    }
  };

  // -----------------------------
  // Medical / Calc / Diet actions
  // -----------------------------
  const handleMedicalChange = (data: {
    selectedGroups: string[];
    selectedConditions: string[];
    testResults: { [testName: string]: string };
    medicalSummary?: string;
    structuredOutput?: any;
  }) => {
    saveMedicalData(data);
  };

  const handleCalculationResult = ({ suggestedModel, ...rest }: any) => {
    setInterviewData((prev: any) => ({ ...prev, ...rest, model: suggestedModel }));
  };

  const getRecommendedMealsPerDay = (p: any, i: any): number => {
    const bmiLocal = p.weight && p.height ? p.weight / ((p.height / 100) ** 2) : null;
    if (["diabetes", "insulin", "pcos", "ibs", "reflux", "ulcer"].some((c) => p.conditions?.includes(c))) return 5;
    if (i.goal === "gain" || i.goal === "regen" || (bmiLocal && bmiLocal < 18.5)) return 5;
    if (i.goal === "lose" || (bmiLocal && bmiLocal > 30)) return 3;
    return 4;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!form.age) missing.push(t("age"));
    if (!form.sex) missing.push(t("sex"));
    if (!form.weight) missing.push(t("weight"));
    if (!form.height) missing.push(t("height"));
    if (!interviewData.goal) missing.push(t("goal"));
    if (!interviewData.cuisine) missing.push(t("cuisine"));

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowConfirmModal(true);
      setSubmitPending(() => () => handleSubmit(e));
      return;
    }

    const bmiCalc = form.weight! / ((form.height! / 100) ** 2);
    setBmi(parseFloat(bmiCalc.toFixed(1)));

    setIsGenerating(true);
    setStreamingText("");
    setDietApproved(false);

    if (!medicalData) {
      alert(tUI("confirmMedicalWarning", lang));
      setIsGenerating(false);
      return;
    }

    try {
      const goalMap: Record<string, string> = {
        lose: "The goal is weight reduction.",
        gain: "The goal is to gain muscle mass.",
        maintain: "The goal is to maintain current weight.",
        detox: "The goal is detoxification and cleansing.",
        regen: "The goal is regeneration of the body and immune system.",
        liver: "The goal is to support liver function and reduce toxin load.",
        kidney: "The goal is to support kidney function and manage fluid/sodium balance.",
      };

      if (!interviewData.mealsPerDay) {
        const suggested = getRecommendedMealsPerDay(form, interviewData);
        setInterviewData((prev: any) => ({ ...prev, mealsPerDay: suggested }));
      }

      const recommendation = interviewData.recommendation?.trim();
      const goalExplanation = goalMap[interviewData.goal] || "";

      const res = await fetch("/api/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          interviewData,
          lang,
          goalExplanation,
          recommendation,
          medical: medicalData,
        }),
      });

      if (!res.body) throw new Error("Brak treści w odpowiedzi serwera.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let rawText = "";
      let rawCompleteText = "";
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        rawText += chunk;
        rawCompleteText += chunk;
        setStreamingText(rawText);
      }

      let json: any;
      try {
        json = JSON.parse(rawCompleteText);
      } catch (err) {
        console.error("❌ Błąd parsowania JSON z diety:", rawCompleteText);
        alert(tUI("dietGenerationFailed", lang));
        return;
      }

      // --- priorytet 1: dietPlan / correctedDietPlan ---
      if (json.dietPlan && typeof json.dietPlan === "object") {
        const parsedDiet = parseRawDietPlan(json.dietPlan || json.correctedDietPlan);
        if (Object.keys(parsedDiet).length === 0) {
          console.warn("⚠️ Brak danych w dietPlan – nie zapisano.");
          return;
        }
        setMealPlan(parsedDiet);
        setDiet(parsedDiet);
        setEditableDiet(parsedDiet);
        await saveDietPlan(parsedDiet);
        return;
      }

      // --- priorytet 2: weekPlan (fallback) ---
      const mapDaysToPolish: Record<string, string> = {
        Monday: "Poniedziałek",
        Tuesday: "Wtorek",
        Wednesday: "Środa",
        Thursday: "Czwartek",
        Friday: "Piątek",
        Saturday: "Sobota",
        Sunday: "Niedziela",
      };

      if (json.weekPlan && Array.isArray(json.weekPlan)) {
        const converted: Record<string, Meal[]> = {};
        for (const { day, meals } of json.weekPlan) {
          converted[mapDaysToPolish[day] || day] = (meals || []).map((meal: any) => ({
            name: meal.name || "",
            menu: meal.menu || meal.description || meal.name || "",
            ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
            macros: meal.macros || {
              kcal: meal.kcal || 0,
              protein: 0,
              fat: 0,
              carbs: 0,
              fiber: 0,
              sodium: 0,
              potassium: 0,
              calcium: 0,
              magnesium: 0,
              iron: 0,
              zinc: 0,
              vitaminD: 0,
              vitaminB12: 0,
              vitaminC: 0,
              vitaminA: 0,
              vitaminE: 0,
              vitaminK: 0,
            },
            glycemicIndex: meal.glycemicIndex || 0,
            time: meal.time || "",
          }));
        }

        if (Object.keys(converted).length === 0) {
          console.warn("⚠️ Brak danych do zapisania – weekPlan był pusty.");
          return;
        }

        setMealPlan(converted);
        setDiet(converted);
        setEditableDiet(converted);
        await saveDietPlan(converted);
        return;
      }

      // --- priorytet 3: mealPlan (drugi fallback) ---
      if (json.mealPlan && Array.isArray(json.mealPlan)) {
        const converted: Record<string, Meal[]> = {};
        for (const entry of json.mealPlan) {
          const { day, meals } = entry || {};
          converted[mapDaysToPolish[day] || day] = (meals || []).map((m: any) => ({
            name: m.name || "",
            menu: m.description || m.name || "",
            ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
            macros: m.macros || {
              kcal: m.kcal || 0,
              protein: 0,
              fat: 0,
              carbs: 0,
              fiber: 0,
              sodium: 0,
              potassium: 0,
              calcium: 0,
              magnesium: 0,
              iron: 0,
              zinc: 0,
              vitaminD: 0,
              vitaminB12: 0,
              vitaminC: 0,
              vitaminA: 0,
              vitaminE: 0,
              vitaminK: 0,
            },
            glycemicIndex: m.glycemicIndex || 0,
            time: m.time || "",
          }));
        }

        if (Object.keys(converted).length === 0) {
          console.warn("⚠️ Brak danych do zapisania – mealPlan był pusty.");
          return;
        }

        setMealPlan(converted);
        setDiet(converted);
        setEditableDiet(converted);
        await saveDietPlan(converted);
        return;
      }

      console.error("❌ Brak poprawnego planu posiłków w odpowiedzi:", json);
      alert(tUI("dietGenerationFailed", lang));
    } catch (err) {
      console.error("❌ Błąd przy generowaniu:", err);
      alert(tUI("dietGenerationError", lang));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveDiet = async () => {
    const ok = await confirmDietPlan();
    if (ok) {
      setDietApproved(true);
      alert(tUI("dietApprovedSuccess", lang));
    } else {
      alert(tUI("dietApprovedError", lang));
    }
  };

  const handleSendDietToPatient = async () => {
    if (!form.email || !form.name) {
      alert(tUI("missingPatientEmailOrName", lang));
      return;
    }

    try {
      const res = await fetch("/api/send-diet-approved-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientEmail: form.email,
          patientName: form.name,
          lang,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(tUI("dietSentSuccess", lang));
      } else {
        alert(tUI("dietSentError", lang));
      }
    } catch (err) {
      console.error("❌ Błąd przy wysyłaniu maila:", err);
      alert(tUI("dietSentError", lang));
    }
  };

  const handleGenerateRecipes = async () => {
    if (!mealPlan || Object.keys(mealPlan).length === 0) {
      alert(tUI("dietGenerationFailed", lang));
      return;
    }

    try {
      setRecipesLoading(true);

      const res = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dietPlan: mealPlan,
          lang,
          cuisine: interviewData?.cuisine,
          nutrientFocus: [],
          startWeek: "monday",
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("❌ /api/generate-recipes failed:", res.status, errText);
        alert(tUI("dietGenerationError", lang));
        return;
      }

      const payload = contentType.includes("application/json") ? await res.json() : JSON.parse(await res.text());

      if (payload?.recipes && typeof payload.recipes === "object") {
        setRecipes(payload.recipes as Record<string, Record<string, RecipeUI>>);
      } else {
        console.warn("⚠️ Brak recipes w odpowiedzi:", payload);
        alert(tUI("dietGenerationFailed", lang));
      }
    } catch (e) {
      console.error("❌ Błąd generate-recipes:", e);
      alert(tUI("dietGenerationError", lang));
    } finally {
      setRecipesLoading(false);
    }
  };

  const handleGenerateNarrative = async () => {
    try {
      const { narrativeInput } = convertInterviewAnswers(interviewData);
      const response = await fetch("/api/interview-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewData: narrativeInput,
          goal: interviewData.goal,
          recommendation: interviewData.recommendation,
          lang,
        }),
      });

      const fullResult = await response.text();
      const jsonMatch = fullResult.match(/```json\s*([\s\S]*?)```/);

      let parsed: Record<string, any> | null = null;
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim());
        } catch {
          /* ignore */
        }
      }

      const summary = fullResult.split("```json")[0].trim();
      setNarrativeText(summary);

      setInterviewData((prev: any) => ({
        ...prev,
        narrativeText: summary,
        narrativeJson: parsed || null,
      }));
    } catch (err) {
      alert("⚠️ Nie udało się połączyć z AI.");
    }
  };

  // -----------------------------
  // Navigation: scroll
  // -----------------------------
  const gotoSection = (k: SectionKey) => {
    setSelectedSection(k);
    const el = sectionRefs[k]?.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

    // -----------------------------
  // Sidebar items (MUSI być przed każdym early-return!)
  // -----------------------------
  const sidebarItems = useMemo(
    () =>
      [
        { k: "patient", icon: "👤", label: tUI("patientData", lang) },
        { k: "medical", icon: "🧾", label: tUI("medicalData", lang) },
        { k: "interview", icon: "🧠", label: tUI("interviewTitle", lang) },
        { k: "recommendation", icon: "✍️", label: tUI("doctorRecommendation", lang) },
        {
          k: "goalModelCuisine",
          icon: "🎯",
          label: `${tUI("goal", lang)} / ${tUI("dietModel", lang)} / ${tUI("cuisine", lang)}`,
        },
        { k: "calculator", icon: "🧮", label: tUI("patientInNumbers", lang) },
        { k: "actions", icon: "⚡", label: (tUI("actions" as any, lang) as any) ?? "Akcje" },
        { k: "diet", icon: "📅", label: (tUI("dietPlan" as any, lang) as any) ?? "Dieta" },
        { k: "recipes", icon: "🍽️", label: tUI("recipesTitle", lang) },
      ] as Array<{ k: SectionKey; icon: string; label: string }>,
    [lang]
  );

  // -----------------------------
  // Subscription gate
  // -----------------------------
  if (!userData?.plan || new Date(userData.subscription_end) < new Date()) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 text-white flex items-center justify-center px-6">
        <Head>
          <title>{tUI("doctorPanelTitle", lang)}</title>
        </Head>

        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,.55)] p-8">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{tUI("noActiveSubscription", lang)}</div>
            <img src="/logo.svg" alt="DCP" className="h-10 opacity-90" />
          </div>

          <p className="text-sm text-white/70 mt-3">{tUI("subscriptionRequiredInfo", lang)}</p>

          <button
            onClick={() => router.push("/paymentsUsers")}
            className="mt-6 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 font-medium"
          >
            💳 {tUI("buySubscription", lang)}
          </button>

          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-white/60">
            <span>{tUI("selectLanguage", lang) ?? "Language"}</span>
            <select
              value={lang}
              onChange={(e) => {
                const v = e.target.value as LangKey;
                setLang(v);
                try {
                  localStorage.setItem("platformLang", v);
                } catch {
                  /* ignore */
                }
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white"
            >
              {(["pl", "en", "de", "fr", "es", "ua", "ru", "zh", "ar", "hi", "he"] as LangKey[]).map((k) => (
                <option key={k} value={k} className="bg-[#0f271e]">
                  {k.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </main>
    );
  }

 return (
  <main className="relative min-h-screen overflow-x-hidden text-white bg-[#06131a]">
    <Head>
      <title>{tUI("doctorPanelTitle", lang)}</title>
    </Head>

    {/* GLASS BACKDROP (1:1 jak panel pacjenta) */}
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_15%,rgba(56,189,248,.22),transparent_60%),radial-gradient(900px_600px_at_80%_25%,rgba(167,139,250,.16),transparent_60%),radial-gradient(900px_700px_at_55%_85%,rgba(16,185,129,.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.10)_0%,rgba(255,255,255,.04)_30%,rgba(0,0,0,.10)_100%)] opacity-70" />
      <div className="absolute inset-0 opacity-[0.10] mix-blend-overlay">
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06131a] to-transparent opacity-60" />
    </div>

    {/* APP SHELL */}
    <div className="relative z-10 mx-auto w-full max-w-[1720px] px-3 sm:px-4 md:px-6 lg:px-8 pt-3 md:pt-5 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-5 lg:gap-6">
        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-4 h-fit rounded-3xl border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,.45)] overflow-hidden">
          <div className="p-5">
            {/* Profile */}
            <div className="rounded-3xl border border-white/10 bg-white/7 backdrop-blur-xl p-4 shadow-[0_18px_60px_rgba(0,0,0,.25)]">
              {userData?.name && (
                <div className="text-sm font-medium text-white/75">
                  {userData.title &&
                    translatedTitles[userData.title as "dr" | "drhab" | "prof"]?.[lang] && (
                      <span className="mr-1">
                        {translatedTitles[userData.title as "dr" | "drhab" | "prof"][lang]}
                      </span>
                    )}
                  {userData.name}
                </div>
              )}

              <div className="mt-1 text-[26px] font-semibold tracking-[-0.01em] text-white font-[Inter]">
                {tUI("doctorPanelTitle", lang)}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={clsx(
                    "inline-flex h-2 w-2 rounded-full shadow-[0_0_18px_rgba(110,231,183,.7)]",
                    userData?.plan && new Date(userData.subscription_end) > new Date()
                      ? "bg-emerald-300"
                      : "bg-rose-300"
                  )}
                />
                <span className="text-xs text-white/70">
                  {userData?.plan && new Date(userData.subscription_end) > new Date()
                    ? tUI("activeSubscription", lang)
                    : tUI("expiredSubscription", lang)}
                </span>
              </div>

              {userData?.subscription_end && (
                <div className="mt-1 text-xs text-white/60">
                  {tUI("validUntil", lang)}{" "}
                  <strong className="text-white">
                    {new Date(userData.subscription_end).toLocaleDateString(lang)}
                  </strong>
                </div>
              )}

              <div className="mt-3">
                <button
                  onClick={() => router.push("/paymentsUsers")}
                  className="text-xs underline text-white/70 hover:text-white"
                >
                  {tUI("manageSubscription", lang)}
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/7 backdrop-blur-xl p-4">
              <div className="text-xs uppercase tracking-wide text-white/60 mb-2">
                {tUI("nav.languageLabel", lang)}
              </div>

              <select
                value={lang}
                onChange={(e) => {
                  const v = e.target.value as LangKey;
                  setLang(v);
                  try {
                    localStorage.setItem("platformLang", v);
                  } catch {
                    /* ignore */
                  }
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/8 hover:bg-white/12 backdrop-blur-xl px-4 py-3 text-sm text-white outline-none transition"
              >
                {(["pl", "en", "de", "fr", "es", "ua", "ru", "zh", "ar", "hi", "he"] as LangKey[]).map((k) => (
                  <option key={k} value={k} className="bg-[#06131a]">
                    {k.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation: klik = pokazuje sekcję w workspace */}
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-white/60 px-1 mb-2">
                {tUI("stepsLabel", lang)}
              </div>

              <div className="flex flex-col gap-2">
                {sidebarItems.map((it) => (
                  <button
                    key={it.k}
                    type="button"
                    onClick={() => setSelectedSection(it.k)}
                    className={clsx(
                      "w-full rounded-2xl border border-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.18)] transition",
                      "px-4 py-4 flex items-center gap-3 text-left",
                      selectedSection === it.k ? "bg-white/12" : "bg-white/8 hover:bg-white/12"
                    )}
                  >
                    <span className="grid place-items-center h-10 w-10 rounded-xl border border-white/10 bg-white/6 text-lg">
                      {it.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/90 truncate">{it.label}</div>
                      {it.k === "patient" && (
                        <div className="text-xs text-white/60 truncate">
                          {form?.user_id ? tUI("patientData", lang) : tUI("enterEmail", lang)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar footer: logout */}
            <div className="mt-5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } finally {
                    localStorage.removeItem("currentUserID");
                    localStorage.removeItem("currentUserRole");
                    router.push("/register?mode=login");
                  }
                }}
                className="w-full rounded-2xl px-4 py-3 font-semibold border border-white/10 bg-white/8 hover:bg-white/12 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.30)] transition"
              >
                {tUI("logout", lang)}
              </button>
            </div>
          </div>
        </aside>

        {/* WORKSPACE */}
        <section className="min-w-0">
          <div className="mx-auto w-full max-w-[1240px] 2xl:max-w-[1400px]">
            {/* Topbar (sticky) */}
            <div className="sticky top-3 z-20 mb-4">
              <div className="rounded-3xl border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,.35)] overflow-hidden">
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-white/60">Workspace</div>
                    <div className="text-lg font-semibold tracking-tight text-white">
                      {sidebarItems.find((x) => x.k === selectedSection)?.label ?? tUI("doctorPanelTitle", lang)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/80">
                      <span
                        className={clsx(
                          "h-2 w-2 rounded-full",
                          userData?.plan && new Date(userData.subscription_end) > new Date()
                            ? "bg-emerald-300"
                            : "bg-rose-300"
                        )}
                      />
                      {userData?.plan && new Date(userData.subscription_end) > new Date()
                        ? tUI("activeSubscription", lang)
                        : tUI("expiredSubscription", lang)}
                      {userData?.subscription_end && (
                        <strong className="text-white">
                          {" "}
                          {new Date(userData.subscription_end).toLocaleDateString(lang)}
                        </strong>
                      )}
                    </span>

                    {/* Logo po prawej */}
                    <img src="/logo.svg" alt="DCP" className="h-8 opacity-95" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main card shell (renderujemy TYLKO wybraną sekcję) */}
            <div className="relative rounded-3xl border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,.45)] p-5 md:p-10">
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(120%_80%_at_15%_0%,rgba(255,255,255,.10),transparent_55%)]" />
              <div className="relative">
                {/* =========
                    1) PATIENT
                   ========= */}
                {selectedSection === "patient" && (
                  <PanelCard>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-base font-semibold text-white">
                          {tUI("patientData", lang)}
                        </div>
                        <div className="text-xs text-white/60">Registered-only</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                        <input
                          type="email"
                          value={patientEmailInput}
                          onChange={(e) => setPatientEmailInput(e.target.value)}
                          placeholder={tUI("enterEmail", lang)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
                        />
                        <button
                          onClick={handleSearchPatient}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-sm font-medium"
                        >
                          🔍 {tUI("fetchPatientData", lang)}
                        </button>
                      </div>

                      {patientLoadStatus === "loading" && <div className="text-xs text-white/60">⏳ Loading…</div>}

                      {patientLoadStatus === "notFound" && (
                        <div className="text-sm text-yellow-300">❌ {tUI("patientNotFound", lang)}</div>
                      )}

                      {patientLoadStatus === "success" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={form.name || ""}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder={tUI("fullName", lang)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          />
                          <input
                            type="email"
                            value={form.email || ""}
                            disabled
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 cursor-not-allowed"
                          />
                          <input
                            type="tel"
                            value={form.phone || ""}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder={tUI("phone", lang)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          />
                          <select
                            value={form.sex || ""}
                            onChange={(e) => setForm({ ...form, sex: e.target.value as "male" | "female" })}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          >
                            <option value="" className="bg-[#06131a]">
                              -- {tUI("selectSex", lang)} --
                            </option>
                            <option value="male" className="bg-[#06131a]">{tUI("male", lang)}</option>
                            <option value="female" className="bg-[#06131a]">{tUI("female", lang)}</option>
                          </select>
                          <input
                            type="number"
                            value={form.age || ""}
                            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                            placeholder={tUI("age", lang)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          />
                          <input
                            type="number"
                            value={form.height || ""}
                            onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
                            placeholder={tUI("height", lang)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          />
                          <input
                            type="number"
                            value={form.weight || ""}
                            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                            placeholder={tUI("weight", lang)}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          />
                          <select
                            value={form.region || ""}
                            onChange={(e) => setForm({ ...form, region: e.target.value })}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          >
                            <option value="" className="bg-[#06131a]">
                              -- {tUI("selectRegion", lang)} --
                            </option>
                            <option value="Europa" className="bg-[#06131a]">{tUI("regionEurope", lang)}</option>
                            <option value="Ameryka Północna" className="bg-[#06131a]">{tUI("regionNorthAmerica", lang)}</option>
                            <option value="Ameryka Południowa" className="bg-[#06131a]">{tUI("regionSouthAmerica", lang)}</option>
                            <option value="Azja" className="bg-[#06131a]">{tUI("regionAsia", lang)}</option>
                            <option value="Afryka" className="bg-[#06131a]">{tUI("regionAfrica", lang)}</option>
                            <option value="Australia" className="bg-[#06131a]">{tUI("regionAustralia", lang)}</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </PanelCard>
                )}

                {/* =========
                    2) MEDICAL
                   ========= */}
                {selectedSection === "medical" && (
                  <PanelCard>
                    <MedicalForm
                      key={JSON.stringify(initialMedicalData)}
                      initialData={initialMedicalData}
                      existingMedical={medicalData}
                      onChange={handleMedicalChange}
                      onUpdateMedical={(summary) => setMedicalData((prev: any) => ({ ...prev, summary }))}
                      userId={form.user_id}
                      lang={lang}
                    />
                  </PanelCard>
                )}

                {/* =========
                    3) INTERVIEW
                   ========= */}
                {selectedSection === "interview" && (
                  <PanelCard title={`🧠 ${tUI("interviewTitle", lang)}`}>
                    <InterviewWizard
                      key={JSON.stringify(initialInterviewData)}
                      form={form as any}
                      initialData={initialInterviewData}
                      lang={lang}
                      onFinish={saveInterviewData}
                      onUpdateNarrative={(text) => setNarrativeText(text)}
                    />
                  </PanelCard>
                )}

                {/* =========
                    4) RECOMMENDATION
                   ========= */}
                {selectedSection === "recommendation" && (
                  <PanelCard>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-white/90">{tUI("doctorRecommendation", lang)}</label>
                        <textarea
                          rows={4}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          value={interviewData.recommendation || ""}
                          onChange={(e) => setInterviewData({ ...interviewData, recommendation: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-white/90">{tUI("mealsPerDay", lang)}</label>
                        <select
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                          value={interviewData.mealsPerDay || ""}
                          onChange={(e) => setInterviewData({ ...interviewData, mealsPerDay: parseInt(e.target.value, 10) })}
                        >
                          <option value="" className="bg-[#06131a]">{`-- ${tUI("selectOption", lang)} --`}</option>
                          {[2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n} className="bg-[#06131a]">
                              {n}
                            </option>
                          ))}
                        </select>

                        <div className="text-xs text-white/60">
                          {tUI("suggested", lang)}:{" "}
                          <span className="text-white/80">{getRecommendedMealsPerDay(form, interviewData)}</span>
                        </div>
                      </div>
                    </div>
                  </PanelCard>
                )}

                {/* =========
                    5) GOAL / MODEL / CUISINE
                   ========= */}
                {selectedSection === "goalModelCuisine" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <PanelCard className="h-full">
                      <DietGoalForm onChange={(goal) => setInterviewData({ ...interviewData, goal })} lang={lang} />
                    </PanelCard>
                    <PanelCard className="h-full">
                      <SelectModelForm onChange={(model) => setInterviewData({ ...interviewData, model })} lang={lang} />
                    </PanelCard>
                    <PanelCard className="h-full">
                      <SelectCuisineForm onChange={(cuisine) => setInterviewData({ ...interviewData, cuisine })} lang={lang} />
                    </PanelCard>
                  </div>
                )}

                {/* =========
                    6) CALCULATOR
                   ========= */}
                {selectedSection === "calculator" && (
                  <PanelCard title={`🧮 ${tUI("patientInNumbers", lang)}`} className="h-full">
                    <CalculationBlock
                      form={form}
                      interview={extractMappedInterview(interviewData)}
                      lang={lang}
                      onResult={handleCalculationResult}
                    />
                  </PanelCard>
                )}

                {/* =========
                    7) ACTIONS
                   ========= */}
                {selectedSection === "actions" && (
                  <PanelCard>
                    <div className="flex flex-wrap items-stretch gap-3 sm:gap-4 w-full">
                      <div className="flex-1 min-w-[220px]">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="w-full h-full rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 font-medium disabled:opacity-50"
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin">⚙️</span>
                              {tUI("writingDiet", lang)}
                            </span>
                          ) : (
                            <>⚡ {tUI("generate", lang)}</>
                          )}
                        </button>
                      </div>

                      {editableDiet && !dietApproved && (
                        <div className="flex-1 min-w-[220px]">
                          <button
                            type="button"
                            className="w-full h-full rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-3 font-medium disabled:opacity-50"
                            onClick={handleApproveDiet}
                            disabled={isGenerating}
                          >
                            ✅ {tUI("confirmDiet", lang)}
                          </button>
                        </div>
                      )}

                      {editableDiet && dietApproved && (
                        <div className="flex-1 min-w-[220px]">
                          <button
                            type="button"
                            className="w-full h-full rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3 font-medium disabled:opacity-50"
                            onClick={handleSendDietToPatient}
                            disabled={isGenerating || !form?.email}
                          >
                            📤 {tUI("sendDietToPatient", lang)}
                          </button>
                        </div>
                      )}

                      <div className="flex-1 min-w-[220px]">
                        <button
                          type="button"
                          className="w-full h-full rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 font-medium disabled:opacity-50"
                          disabled={isGenerating || !confirmedDiet?.length || !dietApproved}
                          onClick={async () => {
                            try {
                              setIsGenerating(true);
                              const { generateDietPdf } = await import("@/utils/generateDietPdf");
                              await generateDietPdf(
                                form,
                                bmi,
                                confirmedDiet!,
                                dietApproved,
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
                                  nmcLorentz: interviewData.nmcLorentz,
                                },
                                "download",
                                narrativeText,
                                toPdfRecipes(recipes)
                              );
                            } catch (e) {
                              alert("❌ Błąd przy generowaniu PDF");
                              console.error(e);
                            } finally {
                              setIsGenerating(false);
                            }
                          }}
                        >
                          📄 {tUI("pdf", lang)}
                        </button>
                      </div>

                      <div className="flex-1 min-w-[220px]">
                        <button
                          type="button"
                          onClick={handleGenerateRecipes}
                          className="w-full h-full rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-3 font-medium disabled:opacity-50"
                          disabled={isGenerating || recipesLoading || !mealPlan || Object.keys(mealPlan).length === 0}
                        >
                          {recipesLoading ? "⏳ " : "🍽️ "}
                          {tUI("generateRecipes", lang)}
                        </button>
                      </div>

                      <div className="flex-1 min-w-[220px]">
                        <button
                          type="button"
                          onClick={handleGenerateNarrative}
                          className="w-full h-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-3 font-medium disabled:opacity-50"
                          disabled={isGenerating}
                        >
                          📝 {tUI("generateNarrative", lang)}
                        </button>
                      </div>
                    </div>

                    {isGenerating && (
                      <div className="text-sm text-white/60 italic mt-4 animate-pulse">
                        ⏳ {tUI("writingDiet", lang)}… {streamingText.length > 20 && `(${tUI("generatingWait", lang)})`}
                      </div>
                    )}
                  </PanelCard>
                )}

                {/* =========
                    8) DIET TABLE
                   ========= */}
                {selectedSection === "diet" && (
                  <PanelCard>
                    {/* chips + legenda + tabela jak u Ciebie */}
                    {(() => {
                      const goalVal = interviewData?.goal ?? initialInterviewData?.goal ?? (form as any)?.goal ?? "";
                      const modelVal = interviewData?.model ?? initialInterviewData?.model ?? (form as any)?.model ?? "";
                      const cuisineVal = interviewData?.cuisine ?? initialInterviewData?.cuisine ?? (form as any)?.cuisine ?? "";
                      const meals =
                        interviewData?.mealsPerDay ??
                        initialInterviewData?.mealsPerDay ??
                        getRecommendedMealsPerDay(form, interviewData);

                      const safe = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);

                      return (
                        <div className="mb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
                            <div className="flex items-center justify-between px-3 py-2 rounded-full text-xs text-white bg-pink-600/80 border border-white/10">
                              <span className="font-semibold">🎯 {tUI("goal", lang)}</span>
                              <span className="pl-2 truncate">{tResolve(goalVal, lang)}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 rounded-full text-xs text-white bg-emerald-600/80 border border-white/10">
                              <span className="font-semibold">🧬 {tUI("dietModel", lang)}</span>
                              <span className="pl-2 truncate">{tResolve(modelVal, lang)}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 rounded-full text-xs text-white bg-indigo-600/80 border border-white/10">
                              <span className="font-semibold">🌍 {tUI("cuisine", lang)}</span>
                              <span className="pl-2 truncate">{tResolve(cuisineVal, lang)}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 rounded-full text-xs text-white bg-amber-600/80 border border-white/10">
                              <span className="font-semibold">{tUI("mealsPerDay", lang)}</span>
                              <span className="pl-2">{safe(meals)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mb-3 text-xs text-white/70">
                      <span className="font-semibold">{tUI("legend", lang)}:</span>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>kcal = {tUI("calories", lang)}</span>
                        <span>B = {tUI("protein", lang)} (g)</span>
                        <span>T = {tUI("fat", lang)} (g)</span>
                        <span>W = {tUI("carbs", lang)} (g)</span>
                        <span>🌿 = {tUI("fiber", lang)} (g)</span>
                        <span>🧂 = {tUI("sodium", lang)} (mg)</span>
                        <span>🥔 = {tUI("potassium", lang)} (mg)</span>
                        <span>🦴 = {tUI("calcium", lang)} (mg)</span>
                        <span>🧬 = {tUI("magnesium", lang)} (mg)</span>
                        <span>🩸 = {tUI("iron", lang)} (mg)</span>
                        <span>🧪 = {tUI("zinc", lang)} (mg)</span>
                        <span>☀️ = {tUI("vitaminD", lang)} (µg)</span>
                        <span>🧠 = {tUI("vitaminB12", lang)} (µg)</span>
                        <span>🍊 = {tUI("vitaminC", lang)} (mg)</span>
                        <span>👁️ = {tUI("vitaminA", lang)} (µg)</span>
                        <span>🧈 = {tUI("vitaminE", lang)} (mg)</span>
                        <span>💉 = {tUI("vitaminK", lang)} (µg)</span>
                      </div>
                    </div>

                    <DietTable
                      editableDiet={editableDiet || {}}
                      setEditableDiet={setEditableDiet}
                      setConfirmedDiet={(dietByDay: any) => {
                        const asArray = (x: any): any[] =>
                          Array.isArray(x)
                            ? x
                            : (x && typeof x === "object" ? Object.values(x) : []).filter((v) => v != null);

                        const out: any[] = [];
                        const pushMeal = (day: string, m: any) => out.push({ ...(m || {}), day });

                        try {
                          if (dietByDay && typeof dietByDay === "object" && !Array.isArray(dietByDay)) {
                            for (const [day, meals] of Object.entries(dietByDay)) {
                              for (const m of asArray(meals)) pushMeal(String(day), m);
                            }
                          } else if (Array.isArray(dietByDay)) {
                            if (dietByDay.length && Array.isArray(dietByDay[0])) {
                              for (const tuple of dietByDay as any[]) {
                                const [day, meals] = tuple;
                                for (const m of asArray(meals)) pushMeal(String(day), m);
                              }
                            } else if (
                              dietByDay.length &&
                              typeof dietByDay[0] === "object" &&
                              dietByDay[0] !== null &&
                              ("day" in (dietByDay[0] as any) || "meals" in (dietByDay[0] as any))
                            ) {
                              for (const item of dietByDay as any[]) {
                                const day = (item as any).day ?? "";
                                const meals = (item as any).meals ?? (item as any).items;
                                for (const m of asArray(meals)) pushMeal(String(day), m);
                              }
                            } else {
                              for (const m of dietByDay as any[]) pushMeal(String((m as any)?.day ?? ""), m);
                            }
                          }
                        } catch (e) {
                          console.warn("setConfirmedDiet normalize error:", e, dietByDay);
                        }

                        setConfirmedDiet(out);
                        setDietApproved(false);
                      }}
                      isEditable={!dietApproved}
                      lang={lang}
                      notes={notes}
                      setNotes={setNotes}
                    />
                  </PanelCard>
                )}

                {/* =========
                    9) RECIPES
                   ========= */}
                {selectedSection === "recipes" && (
                  <div>
                    {Object.keys(recipes).length > 0 ? (
                      <PanelCard title={`🍽️ ${tUI("recipesTitle", lang)}`}>
                        {Object.entries(recipes).map(([day, meals]) => (
                          <div key={day} className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">{day}</h3>
                            {Object.entries(meals).map(([mealName, r]) => (
                              <div key={mealName} className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-3">
                                <div className="font-medium">
                                  {(r as any).meal_label || tUI(mealName as any, lang) || mealName}: {r.dish}
                                </div>

                                {!!r.time && (
                                  <div className="text-sm text-white/70 mt-1">
                                    {tUI("time", lang)}: {r.time}
                                  </div>
                                )}

                                {!!r.description && <div className="text-sm italic text-white/75 mt-1">{r.description}</div>}

                                <div className="mt-3 text-sm">
                                  <div className="font-semibold">{tUI("ingredients", lang)}:</div>
                                  <ul className="list-disc ml-5 text-white/85">
                                    {(r.ingredients || []).map((ing, idx) => (
                                      <li key={idx}>
                                        {ing.product} — {ing.weight ?? "–"} {ing.unit}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="mt-3 text-sm">
                                  <div className="font-semibold">{tUI("steps", lang)}:</div>
                                  <ol className="list-decimal ml-5 text-white/85">
                                    {(r.steps || []).map((s, idx) => (
                                      <li key={idx}>{s}</li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </PanelCard>
                    ) : (
                      <PanelCard>
                        <div className="text-sm text-white/70">{tUI("dietGenerationFailed", lang)}</div>
                      </PanelCard>
                    )}
                  </div>
                )}

                {/* ConfirmationModal */}
                {showConfirmModal && (
                  <ConfirmationModal
                    open={showConfirmModal}
                    missingFields={missingFields}
                    onCancel={() => setShowConfirmModal(false)}
                    onConfirm={() => {
                      setShowConfirmModal(false);
                      // submitPending?.();
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
);
}

export default Panel;