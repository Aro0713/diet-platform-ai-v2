import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import MedicalJurisdiction from '@/components/MedicalJurisdiction/MedicalJurisdiction';
import { supabase } from '@/lib/supabaseClient';
import { translationsRegister } from '@/utils/translations/register';
import { translationsUI } from '@/utils/translationsUI';
import { type LangKey, languageLabels } from '@/utils/i18n';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

export default function RegisterPage() {
  const router = useRouter();

  const [selectedRoleLabel, setSelectedRoleLabel] = useState('');
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

 const [lang, setLang] = useState<LangKey>('pl');
const [langReady, setLangReady] = useState(false);

// 🌗 tryb ciemny (pamiętany w localStorage)
const [darkMode, setDarkMode] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme') === 'dark';
  }
  return false;
});

useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}, [darkMode]);


  const [userType, setUserType] = useState<'doctor' | 'dietitian' | 'patient' | null>(null);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [jurisdiction, setJurisdiction] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [recoveryID, setRecoveryID] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  // 🔐 ADMIN ENTRY
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === ADMIN_PASSWORD) {
      router.push('/panel-dietetyk');
    }
  }, [router]);

  // 🌍 JĘZYK PLATFORMY
  useEffect(() => {
    const savedLang = (localStorage.getItem('platformLang') || 'pl')
      .toLowerCase()
      .trim() as LangKey;

    if (Object.keys(languageLabels).includes(savedLang)) {
      setLang(savedLang);
    } else {
      setLang('pl');
    }

    setLangReady(true);
  }, []);

  // ✅ FUNKCJA TŁUMACZEŃ Z WALIDACJĄ
 const t = (key: keyof typeof translationsRegister): string => {
  const entry = translationsRegister[key] as Record<LangKey, string>;

  if (!entry) {
    console.warn(`❌ Brak klucza: "${key}"`);
    return `[${key}]`;
  }

  const value = entry[lang];
  if (!value) {
    console.warn(`❌ Brak tłumaczenia dla języka "${lang}" w kluczu "${key}"`);
  }

  return value || entry.pl || `[${key}]`;
};


    const tUI = (key: keyof typeof translationsUI): string => {
      const entry = translationsUI[key];
      if (!entry) return `[${key}]`;
      return entry[lang] || entry.pl || `[${key}]`;
};

  // 🌐 TRYB: doctor | dietitian | patient
  useEffect(() => {
    if (!router.isReady) return;
    const rawMode = router.query.mode;
    const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;
    if (!userType && (mode === 'doctor' || mode === 'dietitian' || mode === 'patient')) {
      setUserType(mode as 'doctor' | 'dietitian' | 'patient');
    }
  }, [router.isReady, router.query.mode, userType]);

  // 🔎 DEBUG LANG + TŁUMACZENIA
  useEffect(() => {
    console.log('🌐 Język ustawiony:', lang);
    console.log('🧪 t("rolePatient"):', t('rolePatient'));
    console.log('🧪 t("fullName"):', t('fullName'));
    console.log('🧪 t("phone"):', t('phone'));
    console.log('🧪 t("continueWithoutRegister"):', t('continueWithoutRegister'));
  }, [lang]);

  if (!langReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-sm">⏳ Ładowanie języka...</span>
      </div>
    );
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: login.email,
      password: login.password,
    });
    if (error) return alert('Błąd logowania: ' + error.message);
    if (!data.user?.email_confirmed_at) return alert(t('mustVerifyEmail'));

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    if (!userData) return alert('Nie można pobrać roli użytkownika.');
    localStorage.setItem('currentUserID', data.user.id);
    router.push(
      userData.role === 'lekarz'
        ? '/panel'
        : userData.role === 'dietetyk'
        ? '/panel-dietetyk'
        : '/patient'
    );
  };

  const handleResetPassword = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!recoveryID) return alert('Podaj adres e-mail.');
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryID, {
      redirectTo: 'https://dcp.care/reset',
    });
    if (error) return alert('Błąd resetu hasła: ' + error.message);
    alert('Wysłano link do resetu hasła. Sprawdź skrzynkę e-mail.');
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (userType === 'doctor' && !jurisdiction)
      return alert('Wybierz jurysdykcję zawodową.');

    if ((userType === 'doctor' || userType === 'dietitian') && !licenseNumber)
      return alert('Wprowadź numer licencji lub dyplomu.');

    if (jurisdiction === 'other') {
      try {
        const response = await fetch('https://formsubmit.co/ajax/a4p.email@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            typ: userType,
            imie: form.name,
            email: form.email,
            phone: form.phone,
            licencja: licenseNumber,
            timestamp: new Date().toISOString(),
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd połączenia z serwisem.');
        alert('Twoja jurysdykcja wymaga ręcznej weryfikacji. Wysłano zgłoszenie.');
        return;
      } catch (err) {
        alert('Nie udało się wysłać zgłoszenia: ' + (err as Error).message);
        return;
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) return alert('Błąd rejestracji: ' + error.message);

    if (data.user) {
      await supabase.from('users').insert([
        {
          user_id: data.user.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: userType,
          jurisdiction: userType === 'doctor' ? jurisdiction : null,
          license_number: licenseNumber,
        },
      ]);
      alert(t('registrationSuccess'));
      router.push('/');
    }
  };

 // ⏳ Zatrzymanie renderu do momentu gotowości języka i routera

if (!langReady || !router.isReady) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">⏳ Ładowanie języka...</p>
    </main>
  );
}
const rolePatientLabel = t('rolePatient');
const roleDoctorLabel = t('roleDoctor');
const roleDietitianLabel = t('roleDietitian');
const disclaimer = t('disclaimer');
const consentPrefix = t('consentPrefix');
const termsLinkText = t('termsLinkText');
const privacyLinkText = t('privacyLinkText');
const continueWithoutRegister = t('continueWithoutRegister');
console.log({
  lang,
  disclaimer,
  consentPrefix,
  termsLinkText,
  privacyLinkText,
  continueWithoutRegister,
});

return (
  <main
  className="relative min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-start px-4 py-12 transition-colors"
  style={{
    backgroundImage:
      "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/background.jpg')",
  }}
>
  <nav className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between px-4">
    {/* 🌍 Wybór języka */}
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="sr-only">Wybierz język</label>
      <select
        id="language-select"
        value={lang}
        onChange={(e) => {
          const selected = e.target.value as LangKey;
          setLang(selected);
          localStorage.setItem('platformLang', selected);
        }}
        className="border rounded px-3 py-1 shadow bg-white/80 backdrop-blur dark:bg-gray-800 dark:text-white"
        aria-label="Language selection"
      >
        {Object.entries(languageLabels).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>

    {/* 🔘 Pstryczek elektryczek po prawej */}
    <div className="flex items-center gap-2 group" title={darkMode ? tUI('lightMode') : tUI('darkMode')}>
      <span className="text-xs text-black dark:text-white">{tUI('toggleContrast')}</span>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
          darkMode ? 'bg-gray-700' : 'bg-yellow-400'
        }`}
        aria-label={tUI('toggleContrast')}
      >
        {/* Ikony 🌙 / ☀️ */}
        <span
          className={`absolute left-1 text-sm transition-opacity duration-200 ${
            darkMode ? 'opacity-0' : 'opacity-100'
          }`}
        >
          ☀️
        </span>
        <span
          className={`absolute right-1 text-sm transition-opacity duration-200 ${
            darkMode ? 'opacity-100' : 'opacity-0'
          }`}
        >
          🌙
        </span>

        {/* Kulka */}
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
            darkMode ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  </nav>

   {/* 🔐 Login i Rejestracja */}
<section className="z-10 grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-6xl mx-auto bg-white/30 dark:bg-gray-900/30 backdrop-blur-md p-10 rounded-2xl shadow-xl transition-colors dark:text-white">

  <h1 id="auth-section" className="sr-only">Logowanie i rejestracja</h1>

  {/* ✅ Login */}
  <article className="z-10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 transition-colors dark:text-white" aria-labelledby="login-form">
    <h2 id="login-form" className="text-xl font-bold mb-4">{t('loginTitle')}</h2>
    <form onSubmit={handleLogin} className="space-y-4">
      <label htmlFor="login-email" className="sr-only">{t('email')}</label>
      <input
        id="login-email"
        type="email"
        required
        value={login.email}
        onChange={(e) => setLogin({ ...login, email: e.target.value })}
        className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
        placeholder={t('email')}
        aria-label={t('email')}
      />
      <label htmlFor="login-password" className="sr-only">{t('password')}</label>
      <input
        id="login-password"
        type="password"
        required
        value={login.password}
        onChange={(e) => setLogin({ ...login, password: e.target.value })}
        className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
        placeholder={t('password')}
        aria-label={t('password')}
      />
      <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded w-full transition">
        {t('loginTitle')}
      </button>
    </form>

    <div className="mt-6 border-t pt-4">
      <h3 className="font-bold mb-2">{t('forgotPassword')}</h3>
      <label htmlFor="recovery-email" className="sr-only">{t('email')}</label>
      <input
        id="recovery-email"
        type="email"
        placeholder={t('email')}
        className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
        value={recoveryID}
        onChange={(e) => setRecoveryID(e.target.value)}
        aria-label={t('email')}
      />
      <button
        type="button"
        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded w-full transition"
        onClick={handleResetPassword}
      >
        {t('resetPassword')}
      </button>
    </div>
  </article>

     {/* ✅ Rejestracja */}
  <article className="z-10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-10 transition-colors dark:text-white" aria-labelledby="register-form">
    <h2 id="register-form" className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
      {t('registerTitle')}
    </h2>

    <div className="flex gap-3 mb-4" role="radiogroup" aria-label={t('selectRole')}>
    {router.isReady && (
      <>
        {(router.query.mode === 'doctor' || router.query.mode === 'dietitian') && (
          <>
            <button
              onClick={() => setUserType('doctor')}
              className={`px-4 py-2 rounded ${userType === 'doctor' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}
              role="radio"
              aria-checked={userType === 'doctor'}
              aria-label={t('roleDoctor')}
            >
              {t('roleDoctor')}
            </button>

            <button
              onClick={() => setUserType('dietitian')}
              className={`px-4 py-2 rounded ${userType === 'dietitian' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'}`}
              role="radio"
              aria-checked={userType === 'dietitian'}
              aria-label={t('roleDietitian')}
            >
              {t('roleDietitian')}
            </button>
          </>
        )}

        {(!router.query.mode || router.query.mode === 'register' || router.query.mode === 'patient') && (
          <button
            onClick={() => setUserType('patient')}
            className={`px-4 py-2 rounded ${userType === 'patient' ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700'}`}
            role="radio"
            aria-checked={userType === 'patient'}
            aria-label={rolePatientLabel}
          >
            {rolePatientLabel}
          </button>
        )}
      </>
    )}
  </div>

  <form onSubmit={handleRegister} className="space-y-4">
    <div>
      <label htmlFor="fullName" className="sr-only">{t('fullName')}</label>
      <input
        id="fullName"
        type="text"
        required
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
        placeholder={t('fullName')}
        aria-label={t('fullName')}
      />
    </div>

    <div>
      <label htmlFor="email" className="sr-only">{t('email')}</label>
      <input
        id="email"
        type="email"
        required
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
        placeholder={t('email')}
        aria-label={t('email')}
      />
    </div>

    <div>
      <label htmlFor="phone" className="sr-only">{t('phone')}</label>
      <input
        id="phone"
        type="tel"
        required
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
        placeholder={t('phone')}
        aria-label={t('phone')}
      />
    </div>

    <div>
      <label htmlFor="password" className="sr-only">{t('password')}</label>
      <input
        id="password"
        type="password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
        placeholder={t('password')}
        aria-label={t('password')}
      />
    </div>

    {userType === 'doctor' && (
      <MedicalJurisdiction
        lang={lang}
        jurisdiction={jurisdiction}
        licenseNumber={licenseNumber}
        onJurisdictionChange={setJurisdiction}
        onLicenseChange={setLicenseNumber}
      />
    )}

    {userType === 'dietitian' && (
      <div>
        <label htmlFor="diplomaNumber" className="sr-only">{t('diplomaNumber')}</label>
        <input
          id="diplomaNumber"
          type="text"
          required
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
         className="w-full bg-white text-black border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 rounded px-3 py-2"
          placeholder={t('diplomaNumber')}
          aria-label={t('diplomaNumber')}
        />
      </div>
    )}

    <button
      type="submit"
      className="bg-green-700 text-white px-4 py-2 rounded w-full hover:bg-green-800 transition"
    >
      {t('registerTitle')}
    </button>
  </form>

  {userType === 'patient' && (
    <div className="mt-6 text-sm text-gray-600 dark:text-gray-300 text-center">
      <p className="italic mb-2">{disclaimer}</p>

      <label className="inline-flex items-center">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="mr-2"
          aria-label={`${consentPrefix} ${termsLinkText} i ${privacyLinkText}`}
        />
        {consentPrefix}{' '}
        <a href="/regulamin" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
          {termsLinkText}
        </a>{' '}
        i{' '}
        <a href="/polityka-prywatnosci" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
          {privacyLinkText}
        </a>
      </label>

      <div className="mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => router.push('/patient')}
          disabled={!consentGiven}
        >
          {continueWithoutRegister}
        </button>
      </div>
    </div>
  )}
</article>
    </section>

    {/* 🔐 Przycisk ADMIN */}
    <button
      onClick={() => setShowAdminPopup(true)}
      className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded-lg text-xs opacity-40 hover:opacity-100 transition z-50"
      aria-label="Wejście administratora"
    >
      ADMIN
    </button>
{showAdminPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
      <h2 className="text-lg font-semibold mb-2">
        {t('adminEnterPassword')}
      </h2>
      <input
        className="input mb-4 w-full border px-3 py-2"
        type="password"
        value={adminPassword}
        onChange={(e) => setAdminPassword(e.target.value)}
        placeholder={t('password')}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowAdminPopup(false)}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          {t('cancel')}
        </button>
        <button
          onClick={() => {
            if (adminPassword === ADMIN_PASSWORD) {
              router.push('/panel');
            } else {
              alert(t('wrongAdminPassword'));
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {t('enter')}
        </button>
      </div>
    </div>
  </div>
)}
  </main>
);
}