import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';
import { tUI } from '@/utils/i18n';
import { usePatientData } from '@/hooks/usePatientData';

import { PatientIconGrid } from '@/components/PatientIconGrid';
import PatientSelfForm from '@/components/PatientSelfForm';
import MedicalForm from '@/components/MedicalForm';
import InterviewWizard from '@/components/InterviewWizard';
import CalculationBlock from '@/components/CalculationBlock';
import DietTable from '@/components/DietTable';
import { extractMappedInterview } from '@/utils/interviewHelpers';
import type { LangKey } from '@/utils/i18n';

export default function PatientPanelPage() {
  const router = useRouter();
  const [lang, setLang] = useState<LangKey>('pl');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('platformLang');
    if (storedLang) setLang(storedLang as LangKey);
  }, []);

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
    initialInterviewData
  } = usePatientData();

  const [editableDiet, setEditableDiet] = useState({});
  const [notes, setNotes] = useState({});
  const [isConfirmed, setIsConfirmed] = useState(false);

    useEffect(() => {
    fetchPatientData();
    }, []);

    useEffect(() => {
    if (selectedSection === 'medical') {
        fetchPatientData(); // ⬅️ automatyczne ponowne pobranie
    }
    }, [selectedSection]);


  return (
    <main className="relative min-h-screen bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)] flex flex-col justify-start items-center pt-10 px-6 text-white transition-all duration-300">
      <Head>
        <title>Panel pacjenta</title>
      </Head>

      {/* Pasek nagłówka */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
        <div className="flex flex-col">
          {form?.name && (
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {form.name}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {tUI('patientPanelTitle', lang)}
          </h1>
        </div>
        <LangAndThemeToggle />
      </div>

      {/* Ikony */}
      <PatientIconGrid
        lang={lang}
        onSelect={(id) => setSelectedSection(id)}
      />

      {/* Główna zawartość */}
      <div className="z-10 flex flex-col w-full max-w-[1000px] mx-auto gap-6 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 mt-20 dark:text-white transition-colors animate-flip-in origin-center">
        {selectedSection === 'data' && <PatientSelfForm lang={lang} />}

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
            onFinish={saveInterviewData}
            lang={lang}
            initialData={initialInterviewData}
            />

            {interviewData?.goal && (
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
