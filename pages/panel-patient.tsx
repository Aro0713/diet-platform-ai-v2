import Head from 'next/head';
import { useEffect, useState } from 'react';
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
  const [lang, setLang] = useState<LangKey>('pl');
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);

  const [form, setForm] = useState<PatientData>({} as PatientData);
  const [interviewData, setInterviewData] = useState<any>({});
  const [medicalData, setMedicalData] = useState<any>(null);
  const [editableDiet, setEditableDiet] = useState<Record<string, Meal[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang');
    if (storedLang) setLang(storedLang as LangKey);
  }, []);

  useEffect(() => {
    const fetchPatient = async () => {
      const userId = localStorage.getItem('currentUserID');
      if (!userId) {
        alert('Nie jesteś zalogowany.');
        router.push('/register');
        return;
      }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        console.error('Błąd pobierania danych pacjenta:', error);
        alert('Nie znaleziono danych pacjenta.');
        router.push('/register');
        return;
      }

      setPatient(data);
      setForm(data);
      setLoading(false);
    };

    fetchPatient();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Wczytywanie danych pacjenta...</p>
      </div>
    );
  }

  return (
 <main className="relative min-h-screen 
  bg-[#0f271e]/70 
  bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 
  backdrop-blur-[12px] 
  shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] 
  flex flex-col justify-start items-center pt-10 px-6 
  text-white transition-all duration-300">

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
          <MedicalForm
            onChange={({ selectedGroups, selectedConditions, testResults, medicalSummary, structuredOutput }) => {
              const convertedMedical = selectedConditions.map((condition) => ({
                condition,
                tests: Object.entries(testResults).map(([name, value]) => ({ name, value }))
              }));

              setForm((prev) => ({
                ...prev,
                conditionGroups: selectedGroups,
                conditions: selectedConditions,
                testResults,
                medical: convertedMedical
              }));

              setMedicalData((prev: any) => {
                if (
                  prev?.summary === medicalSummary &&
                  JSON.stringify(prev?.json) === JSON.stringify(structuredOutput)
                ) {
                  return prev;
                }
                return {
                  summary: medicalSummary ?? '',
                  json: structuredOutput ?? null
                };
              });
            }}
            onUpdateMedical={(summary) => {
              setMedicalData((prev: any) => ({ ...prev, summary }));
            }}
            lang={lang}
          />
        )}

        {selectedSection === 'interview' && (
          <InterviewWizard
            form={form}
            lang={lang}
            onFinish={(data) => {
              setInterviewData(data);
              setForm((prev) => ({
                ...prev,
                stressLevel: data.stressLevel,
                sleepQuality: data.sleepQuality,
                physicalActivity: data.physicalActivity,
                mealsPerDay: data.mealsPerDay
              }));
            }}
          />
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
