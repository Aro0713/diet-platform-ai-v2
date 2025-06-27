import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import LangAndThemeToggle from '@/components/LangAndThemeToggle';

export default function PatientPanel() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      const userId = localStorage.getItem('currentUserID');
      if (!userId) {
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
        router.push('/register');
        return;
      }

      setPatient(data);
    };

    fetchPatientData();
  }, [router]);

  if (!patient) return null;

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-start px-4 py-12 transition-colors"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/background.jpg')",
      }}
    >
      {/* Pasek górny */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
        {/* Dane pacjenta */}
        <div className="text-white text-sm">
          <p className="font-semibold">{patient.name}</p>
          <p>{patient.email}</p>
        </div>
        <LangAndThemeToggle />
      </div>

      {/* Główny prostokąt */}
      <div className="mt-32 w-full max-w-3xl bg-white/30 backdrop-blur-md rounded-2xl shadow-xl p-10 text-white">
        <h1 className="text-2xl font-bold mb-4 text-white">Panel pacjenta</h1>
        <p className="mb-2">Jesteś zalogowany jako: {patient.email}</p>
        <p className="mb-4">Język: {patient.lang}</p>
        <p className="mb-4">Możesz teraz uzupełnić swoje dane, historię medyczną i preferencje.</p>
        <p className="italic text-sm">(Pozostała funkcjonalność pojawi się po kliknięciu przycisków poniżej)</p>
      </div>
    </main>
  );
}
