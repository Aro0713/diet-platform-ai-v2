import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import { supabase } from '@/lib/supabaseClient';
import { tUI } from '@/utils/i18n';

import { PatientIconGrid } from '@/components/PatientIconGrid';
import PatientSelfForm from '@/components/PatientSelfForm';
import MedicalForm from '@/components/MedicalForm';
import InterviewWizard from '@/components/InterviewWizard';
import CalculationBlock from '@/components/CalculationBlock';
import DietTable from '@/components/DietTable';

import { extractMappedInterview } from '@/utils/interviewHelpers';
import { LangKey } from '@/utils/i18n';
import type { PatientData, Meal } from '@/types';

export default function PatientPanelPage() {
  const router = useRouter();

  // Język
  const [lang, setLang] = useState<LangKey>('pl');
  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang');
    if (storedLang) setLang(storedLang as LangKey);
  }, []);
useEffect(() => {
  const fetchPatientData = async () => {
    console.log('🔄 Wywołano fetchPatientData()');

    const userId = localStorage.getItem('currentUserID');
    console.log('🧾 userId:', userId);
    if (!userId) return;

    const { data, error } = await supabase
      .from('patients')
      .select('*, interview_data, medical_data, health_status')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('📦 Supabase response:', { data, error });

    if (data) {
      setForm((prev) => ({
        ...prev,
        conditionGroups: Array.isArray(data.conditionGroups) ? data.conditionGroups : [],
        conditions: Array.isArray(data.conditions) ? data.conditions : [],
        medical: Array.isArray(data.medical) ? data.medical : []
      }));

      setMedicalData({
        summary: data.health_status || '',
        json: data.medical_data || null
      });

      setInterviewData(data.interview_data || {});
      console.log('✅ Dane pobrane z Supabase:', data);
    }

    if (error) console.error('❌ Supabase błąd:', error.message);
  };

  fetchPatientData();
}, []);


  // Status i dane
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
 const [patient] = useState<any>({
  name: 'Pacjent',
  conditionGroups: [],
  conditions: [],
  medical: []
});

  const [form, setForm] = useState<PatientData>({} as PatientData);
  const [interviewData, setInterviewData] = useState<any>({});
  const [isInterviewConfirmed, setIsInterviewConfirmed] = useState(false);
 const [medicalData, setMedicalData] = useState<any>(null);
  const [editableDiet, setEditableDiet] = useState<Record<string, Meal[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isConfirmed, setIsConfirmed] = useState(false);
const hasMedicalChanged = useRef(false);

// Pobieranie danych z wywiadu, jeśli użytkownik przejdzie do sekcji "interview"
useEffect(() => {
  if (selectedSection === 'interview') {
    const fetchInterviewData = async () => {
      const userId = localStorage.getItem('currentUserID');
      if (!userId) return;

      const { data, error } = await supabase
        .from('patients')
        .select('interview_data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Błąd pobierania interview_data:', error);
        return;
      }

      if (data?.interview_data) {
        setInterviewData(data.interview_data);
        setIsInterviewConfirmed(true); // ✅ oznacz jako zatwierdzone
      }
    };

    fetchInterviewData();
  }
}, [selectedSection]);

// Automatyczny zapis danych medycznych, jeśli nastąpiła zmiana i sekcja została odwiedzona
useEffect(() => {
  const saveMedicalIfNeeded = async () => {
    const userId = localStorage.getItem('currentUserID');
    if (
      hasMedicalChanged.current &&
      userId &&
      Array.isArray(form?.medical) &&
      form.medical.length > 0
    ) {
      const { error } = await supabase
        .from('patients')
        .update({
          medical: form.medical,
          medical_data: medicalData?.json ?? null,
          health_status: medicalData?.summary ?? '',
          conditionGroups: form.conditionGroups ?? [],
          conditions: form.conditions ?? []
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Błąd zapisu automatycznego:', error.message);
      } else {
        console.log('✅ Dane medyczne zapisane automatycznie');
        hasMedicalChanged.current = false;
      }
    }
  };

  saveMedicalIfNeeded();
}, [selectedSection]);

return (
  <main className="relative min-h-screen 
    bg-[#0f271e]/70 
    bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 
    backdrop-blur-[12px] 
    shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] 
    flex flex-col justify-start items-center pt-10 px-6 
    text-white transition-all duration-300"
  >
    <Head>
      <title>Panel pacjenta</title>
    </Head>

    {/* Pasek nagłówka */}
    <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
      <div className="flex flex-col">
        {patient?.name && (
          <span className="text-sm font-medium text-gray-800 dark:text-white">
            {patient.name}
          </span>
        )}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {tUI('patientPanelTitle', lang)}
        </h1>
      </div>
      <LangAndThemeToggle />
    </div>
  
    {/* Ikony */}
    <PatientIconGrid lang={lang} onSelect={(id) => setSelectedSection(id)} />

    {/* Główna zawartość */}
    <div className="z-10 flex flex-col w-full max-w-[1000px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20 dark:text-white transition-colors animate-flip-in origin-center">
      
      {selectedSection === 'data' && <PatientSelfForm lang={lang} />}

 {selectedSection === 'medical' && (
  <>
  <MedicalForm
  onChange={async ({ selectedGroups, selectedConditions, testResults, medicalSummary, structuredOutput }) => {
    const convertedMedical = selectedConditions.map((condition) => ({
      condition,
      tests: Object.entries(testResults)
        .filter(([key]) => key.startsWith(`${condition}__`))
        .map(([name, value]) => ({
          name: name.replace(`${condition}__`, ''),
          value
        }))
    }));

    setForm((prev) => ({
      ...prev,
      conditionGroups: selectedGroups,
      conditions: selectedConditions,
      testResults,
      medical: convertedMedical
    }));

    setMedicalData({
      summary: medicalSummary ?? '',
      json: structuredOutput ?? null
    });

    const userId = localStorage.getItem('currentUserID');
    if (userId) {
      const { error } = await supabase
        .from('patients')
        .update({
          medical: convertedMedical,
          medical_data: structuredOutput,
          health_status: medicalSummary,
          conditionGroups: selectedGroups,
          conditions: selectedConditions
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Błąd zapisu danych medycznych:', error.message);
      } else {
        console.log('✅ Dane medyczne zapisane');
        setIsConfirmed(true);
      }
    }
  }}
  onUpdateMedical={(summary) => {
    setMedicalData((prev: any) => ({ ...prev, summary }));
  }}
  initialData={{
    selectedGroups: Array.isArray(form.conditionGroups) ? form.conditionGroups : [],
    selectedConditions: Array.isArray(form.conditions) ? form.conditions : [],
    testResults: Object.fromEntries(
      Array.isArray(form.medical)
        ? form.medical.flatMap((c: any) => {
            if (!c || typeof c !== 'object' || !Array.isArray(c.tests)) return [];
            return c.tests
              .filter((t: any) => t && typeof t.name === 'string')
              .map((t: { name: string; value: any }) => [
                `${c.condition ?? 'Nieznane'}__${t.name}`,
                t.value
              ]);
          })
        : []
    )
  }}
  existingMedical={medicalData}
  lang={lang}
/>

    {isConfirmed && !interviewData?.goal && (
      <div className="mt-6 p-4 bg-emerald-100/80 dark:bg-emerald-900/40 text-base rounded-md text-gray-900 dark:text-white shadow max-w-2xl mx-auto">
        {tUI('medicalConfirmationMessage', lang)}
      </div>
    )}
  </>
)}

  {selectedSection === 'interview' && (
  <>
<InterviewWizard
  form={form}
  lang={lang}
  onFinish={async (data) => {
    const isSame = JSON.stringify(data) === JSON.stringify(interviewData);
    if (isSame) return; // ⛔ nie zapisuj ponownie identycznych danych

    setInterviewData(data);
    setForm((prev) => ({
      ...prev,
      stressLevel: data.stressLevel,
      sleepQuality: data.sleepQuality,
      physicalActivity: data.physicalActivity,
      mealsPerDay: data.mealsPerDay
    }));

    setIsInterviewConfirmed(true);

    const userId = localStorage.getItem('currentUserID');
    if (userId) {
      await supabase
        .from('patients')
        .update({ interview_data: data })
        .eq('user_id', userId);
    }
  }}
/>

    {isInterviewConfirmed && (
      <div className="mt-6 p-4 bg-sky-100/80 dark:bg-sky-900/40 text-base rounded-md text-gray-900 dark:text-white shadow max-w-2xl mx-auto">
        {tUI('interviewConfirmationMessage', lang)}
      </div>
    )}
  </>
)}

      {selectedSection === 'calculator' && (
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
      )}

      {selectedSection === 'diet' && editableDiet && Object.keys(editableDiet).length > 0 && (
        <DietTable
          editableDiet={editableDiet}
          setEditableDiet={setEditableDiet}
          setConfirmedDiet={() => {}}
          isEditable={false}
          lang={lang}
          notes={notes}
          setNotes={setNotes}
        />
      )}

      {!selectedSection && (
        <p className="text-center text-gray-300 text-sm max-w-xl mx-auto">
          {tUI('iconInstructionFull', lang)}
        </p>
      )}
    </div>
  </main>
);
}