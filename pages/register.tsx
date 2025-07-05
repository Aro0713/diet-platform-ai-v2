import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import MedicalJurisdiction from '@/components/MedicalJurisdiction/MedicalJurisdiction';
import { supabase } from '@/lib/supabaseClient';
import { translationsRegister } from '@/utils/translations/register';
import { translationsUI } from '@/utils/translationsUI';
import { type LangKey, languageLabels } from '@/utils/i18n';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

export default function RegisterPage() {
  const router = useRouter();

  const [detectedCountry, setDetectedCountry] = useState<'pl'>('pl');

  useEffect(() => {
    fetch('https://ip-api.com/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data?.countryCode) {
          setDetectedCountry(data.countryCode.toLowerCase());
        }
      })
      .catch(() => setDetectedCountry('pl'));
  }, []);

const [confirmation, setConfirmation] = useState(false);
const [langReady, setLangReady] = useState(false);

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    if (!data?.user) {
      localStorage.removeItem('currentUserID');
    }
  });
}, []);

useEffect(() => {
  const runInsert = async () => {
    if (!router.isReady || !langReady || router.query.confirmed !== 'true') return;

    setConfirmation(true);

    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser?.user) return;

    // ✅ Zapisz user_id do localStorage — niezależnie od roli
    if (authUser.user.id) {
      localStorage.setItem('currentUserID', authUser.user.id);
      console.log('✅ currentUserID zapisany po rejestracji:', authUser.user.id);
    }

    const metadata = authUser.user.user_metadata || {};
    const role = metadata.role || 'patient';
    const langFromMeta = metadata.lang || 'pl';

    // 🩺 Lekarz lub dietetyk → insert do tabeli `users`
    if (role === 'doctor' || role === 'dietitian') {
      const { data: exists } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', authUser.user.id)
        .maybeSingle();

      if (!exists) {
        const insertResult = await supabase.from('users').insert([{
          user_id: authUser.user.id,
          name: metadata.name || authUser.user.email?.split('@')[0] || 'Nieznany',
          email: authUser.user.email,
          phone: metadata.phone || '',
          role,
          lang: langFromMeta,
          jurisdiction: metadata.jurisdiction || '',
          license_number: metadata.license_number || ''
        }]);

        if (insertResult.error) {
          console.error('❌ Insert error (users):', insertResult.error);
        }
      }
    }

    // 👨‍⚕️ Każdy użytkownik (w tym pacjent) → insert do tabeli `patients`
    const { error: patientError } = await supabase.from('patients').upsert({
      user_id: authUser.user.id,
      name: metadata.name || 'Nieznany',
      email: authUser.user.email,
      phone: metadata.phone || '',
      lang: langFromMeta,
      sex: 'unknown',
      age: null,
      height: null,
      weight: null,
      region: 'default',
      allergies: '',
      conditions: [],
      health_status: '',
      medical_data: {}
    });

    if (patientError) {
      console.error('❌ Błąd dodawania pacjenta do patients:', patientError.message);
    }
  };

  runInsert();
}, [router.query.confirmed, langReady, router.isReady]);


  const [selectedRoleLabel, setSelectedRoleLabel] = useState('');
  const [lang, setLang] = useState<LangKey>('pl');


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
  const [loginConsent, setLoginConsent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [consentPrefix, setConsentPrefix] = useState('');
const [termsLinkText, setTermsLinkText] = useState('');
const [privacyLinkText, setPrivacyLinkText] = useState('');
const [rolePatientLabel, setRolePatientLabel] = useState('');
const [roleDoctorLabel, setRoleDoctorLabel] = useState('');
const [roleDietitianLabel, setRoleDietitianLabel] = useState('');
const [continueWithoutRegister, setContinueWithoutRegister] = useState('');
const [disclaimer, setDisclaimer] = useState('');

  const [jurisdiction, setJurisdiction] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [recoveryID, setRecoveryID] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);


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

    useEffect(() => {
    if (router.query.confirmed === 'true') {
      setConfirmation(true);
    }
  }, [router.query]);

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

  const entryMode = localStorage.getItem('entryMode');
  const rawMode = router.query.mode || entryMode || 'patient';
  const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;

  if (!userType && (mode === 'doctor' || mode === 'dietitian' || mode === 'patient')) {
    setUserType(mode as 'doctor' | 'dietitian' | 'patient');
  }
}, [router.isReady, router.query.mode, userType]);

useEffect(() => {
  if (!userType || !lang) return;

  setConsentPrefix(t('consentPrefix'));
  setTermsLinkText(t('termsLinkText'));
  setPrivacyLinkText(t('privacyLinkText'));

  if (userType === 'patient') {
    setRolePatientLabel(t('rolePatient'));
    setContinueWithoutRegister(t('continueWithoutRegister'));
    setDisclaimer(t('disclaimer'));
  } else if (userType === 'doctor') {
    setRoleDoctorLabel(t('roleDoctor'));
  } else if (userType === 'dietitian') {
    setRoleDietitianLabel(t('roleDietitian'));
  }
}, [userType, lang]);

  // 🔎 DEBUG LANG + TŁUMACZENIA
  useEffect(() => {
    console.log('🌐 Język ustawiony:', lang);
    console.log('🧪 t("rolePatient"):', t('rolePatient'));
    console.log('🧪 t("fullName"):', t('fullName'));
    console.log('🧪 t("phone"):', t('phone'));
    console.log('🧪 t("continueWithoutRegister"):', t('continueWithoutRegister'));
  }, [lang]);

  if (!langReady || !router.isReady) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">⏳ Ładowanie języka...</p>
      </main>
    );
  }

const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!loginConsent) {
    alert(tUI('mustAcceptTerms'));
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: login.email,
    password: login.password,
  });

  if (error) {
    console.error('❌ Błąd logowania:', error.message);
    alert('Błąd logowania: ' + error.message);
    return;
  }

  if (!data.user?.email_confirmed_at) {
    alert(t('mustVerifyEmail'));
    return;
  }

  const userId = data.user.id;
  localStorage.setItem('currentUserID', userId);

  // ✅ najpierw próbujemy z tabeli users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (userData?.role === 'doctor' || userData?.role === 'dietitian') {
    localStorage.setItem('currentUserRole', userData.role);
    router.push('/panel');
    return;
  }

  // ✅ jeśli nie znaleziono – sprawdzamy tabelę patients
  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (patientData) {
    localStorage.setItem('currentUserRole', 'patient');
    router.push('/panel-patient');
    return;
  }

  // ❌ brak wpisu w żadnej tabeli
  console.error('❌ Nie można określić roli użytkownika:', userError, patientError);
  alert(tUI('userRoleFetchError'));
};


  const handleResetPassword = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!recoveryID) return alert(tUI('enterEmail'));
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryID, {
      redirectTo: 'https://dcp.care/reset',
    });
    if (error) return alert(tUI('passwordResetError') + ': ' + error.message);
   alert(tUI('passwordResetSent'));
  };
  
console.log({
  lang,
  disclaimer,
  consentPrefix,
  termsLinkText,
  privacyLinkText,
  continueWithoutRegister,
});
const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const mode = (router.query.mode || 'patient') as 'doctor' | 'dietitian' | 'patient';

  // 🔒 Wymuszamy role:
  const role = mode === 'patient' ? 'patient' : userType;

  if (!consentGiven) {
    alert(tUI('mustAcceptTerms'));
    return;
  }

  if (role === 'doctor' && !jurisdiction)
    return alert('Wybierz jurysdykcję zawodową.');

  if ((role === 'doctor' || role === 'dietitian') && !licenseNumber)
    return alert('Wprowadź numer licencji lub dyplomu.');

  if (jurisdiction === 'other') {
    try {
      const response = await fetch('https://formsubmit.co/ajax/contact@dcp.care', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          typ: role,
          imie: form.name,
          email: form.email,
          phone: form.phone,
          licencja: licenseNumber,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || tUI('manualVerificationError'));

      alert(tUI('manualVerificationSuccess'));
      return;

    } catch (err) {
      alert(tUI('manualVerificationFailure') + ': ' + (err as Error).message);
      return;
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      emailRedirectTo: 'https://dcp.care/register?confirmed=true',
      data: {
        name: form.name,
        phone: form.phone,
        role: role,
        lang: lang,
        jurisdiction: role === 'doctor' ? jurisdiction : 'dietitian-default',
        license_number: licenseNumber
      }
    }
  });

  if (error) {
    console.error('❌ Błąd rejestracji:', error.message);
    alert('Błąd rejestracji: ' + error.message);
    return;
  }

  alert('📩 Link aktywacyjny został wysłany na e-mail.');
};
if (!langReady || !router.isReady || !userType) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">⏳ Trwa przygotowanie formularza rejestracji...</p>
    </main>
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
        className="border rounded px-3 py-1 shadow bg-white/80 text-black backdrop-blur dark:bg-gray-800 dark:text-white"
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
        {confirmation && (
      <div className="fixed top-0 left-0 w-full z-50 bg-green-600 text-white text-center py-2 shadow-md animate-fadeOut">
        ✅ {t('emailConfirmed')}
      </div>
      )}

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
     <div className="flex items-start text-sm gap-2 mt-2">
      <input
        type="checkbox"
        checked={loginConsent}
        onChange={(e) => setLoginConsent(e.target.checked)}
        className="mt-1"
        id="login-consent"
      />
      <label htmlFor="login-consent" className="leading-snug text-sm">
        <span className="block">{consentPrefix}</span>
        <span className="block">
          <a href="/regulamin" className="underline hover:text-blue-400" target="_blank" rel="noopener noreferrer">
            {termsLinkText}
          </a>{' '}
          {t('and')}{' '}
          <a href="/polityka-prywatnosci" className="underline hover:text-blue-400" target="_blank" rel="noopener noreferrer">
            {privacyLinkText}
          </a>
        </span>
      </label>
    </div>
     <button
      type="submit"
      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded w-full transition disabled:opacity-50 shadow-md"
      disabled={!loginConsent}
    >
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
              className={`px-4 py-2 rounded transition ${
                userType === 'doctor'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-100 text-blue-700'
              }`}
              role="radio"
              aria-checked={userType === 'doctor'}
              aria-label={t('roleDoctor')}
            >
              {t('roleDoctor')}
            </button>

            <button
            onClick={() => setUserType('dietitian')}
            className={`px-4 py-2 rounded transition ${
              userType === 'dietitian'
                ? 'bg-purple-700 text-white'
                : 'bg-purple-100 text-purple-700'
            }`}
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
            className={`px-4 py-2 rounded transition ${
              userType === 'patient'
                ? 'bg-green-700 text-white'
                : 'bg-green-100 text-green-700'
            }`}
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

      <div className="w-full">
      <label htmlFor="phone" className="sr-only">{t('phone')}</label>
      <PhoneInput
        defaultCountry={detectedCountry}
        value={form.phone}
        onChange={(phone) => setForm({ ...form, phone })}
        inputClassName="w-full h-[44px] text-sm bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
        inputProps={{
          name: 'phone',
          required: true,
          id: 'phone',
          'aria-label': t('phone'),
          placeholder: t('phone'),
        }}
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

        <div className="flex items-start text-sm gap-2 mt-2">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="mt-1"
          id="consent"
        />
        <label htmlFor="consent" className="leading-snug text-sm">
          <span className="block">{consentPrefix}</span>
          <span className="block">
            <a href="/regulamin" className="underline hover:text-blue-400" target="_blank" rel="noopener noreferrer">
              {termsLinkText}
            </a>{' '}
            {t('and')}{' '}
            <a href="/polityka-prywatnosci" className="underline hover:text-blue-400" target="_blank" rel="noopener noreferrer">
              {privacyLinkText}
            </a>
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="bg-green-700 text-white px-4 py-2 rounded w-full hover:bg-green-800 transition disabled:opacity-50"
        disabled={!consentGiven}
      >
        {t('registerTitle')}
      </button>
    </form>

    {userType === 'patient' && (
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-300 text-center">
        <p className="italic mb-2">{disclaimer}</p>
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
    </main>
  );
}
