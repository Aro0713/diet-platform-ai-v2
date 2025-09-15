import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import MedicalJurisdiction from '@/components/MedicalJurisdiction/MedicalJurisdiction';
import { supabase } from '@/lib/supabaseClient';
import { translationsRegister } from '@/utils/translations/register';
import { translationsUI } from '@/utils/translationsUI';
import { type LangKey, languageLabels } from '@/utils/i18n';
import { PhoneInput } from 'react-international-phone';
import type { CountryIso2 } from 'react-international-phone';
import 'react-international-phone/style.css';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

export default function RegisterPage() {
  const router = useRouter();
   const [detectedCountry, setDetectedCountry] = useState<CountryIso2 | undefined>(undefined);
   const runInsert = async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user?.id) return;

    const metadata = user.user_metadata || {};
    const role = metadata.role || 'patient';
    const lang = metadata.lang || 'pl';

    if (role === 'patient') {
      const { data: exists } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!exists) {
        await supabase.from('patients').insert({
        user_id: user.id,
        email: user.email,
        name: metadata.name || 'Nieznany',
        phone: metadata.phone || '',
        lang,
        region,
        location
      });
      }
    }

    if (role === 'doctor' || role === 'dietitian') {
      const { data: exists } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!exists) {
        await supabase.from('users').insert({
          user_id: user.id,
          email: user.email,
          name: metadata.name || 'Nieznany',
          phone: metadata.phone || '',
          role,
          lang,
          jurisdiction: metadata.jurisdiction || '',
          license_number: metadata.license_number || ''
        });
      }
    }
  };


const [confirmation, setConfirmation] = useState(false);
const [langReady, setLangReady] = useState(false);

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    if (!data?.user) {
      localStorage.removeItem('currentUserID');
    }
  });
}, []);

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
  const [resetCooldown, setResetCooldown] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [region, setRegion] = useState('');
  const [location, setLocation] = useState('');


  // 🌍 JĘZYK PLATFORMY
useEffect(() => {
  fetch('https://ipapi.co/json/')
    .then((res) => res.json())
    .then((data) => {
      const detectedLangRaw = data?.languages?.split(',')[0]?.toLowerCase();
      const regionName = data?.country_name || null;
      const cityLocation = `${data?.city || ''}, ${data?.region || ''}`;

      // 📞 Ustaw domyślny kraj dla PhoneInput
      const countryCode = data?.country?.toLowerCase(); // ⬅️ TU DODAJ
      if (countryCode) {
        setDetectedCountry(countryCode); // ⬅️ TU DODAJ
      }

      if (detectedLangRaw && Object.keys(languageLabels).includes(detectedLangRaw)) {
        setLang(detectedLangRaw as LangKey);
        localStorage.setItem('platformLang', detectedLangRaw);
      }

      if (regionName) {
        setRegion(regionName);
      }

      setLocation(cityLocation);
      setLangReady(true);
    })
    .catch((err) => {
      console.warn('🌍 Nie udało się pobrać lokalizacji:', err);
      setLang('pl');
      setDetectedCountry('pl'); // fallback 🇵🇱
      setRegion('Poland');
      setLocation('');
      setLangReady(true);
    });
}, []);

useEffect(() => {
  if (router.query.confirmed === 'true') {
    setConfirmation(true);

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data?.session?.user;
      if (!user) return;

      const metadata = user.user_metadata || {};
      const role = metadata.role || 'patient';
      const lang = metadata.lang || 'pl';

      const updates: any = {
        role,
        lang,
        name: metadata.name || 'Nieznany',
        phone: metadata.phone || '',
      };

      if (role === 'doctor') {
        updates.jurisdiction = metadata.jurisdiction || '';
        updates.license_number = metadata.license_number || '';
      }

      if (role === 'dietitian') {
        updates.license_number = metadata.license_number || '';
      }

      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        console.error('❌ Błąd aktualizacji metadanych użytkownika:', error.message);
      } else {
        console.log('✅ Metadane użytkownika uzupełnione.');

        // 🔁 Opóźnienie przed runInsert — 250ms
        setTimeout(() => {
          runInsert();
        }, 250);
      }
    });
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

  if (!userType) {
  if (mode === 'doctor' || mode === 'dietitian' || mode === 'patient') {
    setUserType(mode);
  } else if (mode === 'login') {
    // 👉 Próbujemy wykryć rolę po sesji (jeśli użytkownik jest zalogowany)
    supabase.auth.getSession().then(({ data }) => {
      const role = data?.session?.user?.user_metadata?.role;
      if (role === 'doctor' || role === 'dietitian' || role === 'patient') {
        setUserType(role);
      } else {
        setUserType('patient'); // fallback
      }
    });
  }
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
 
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

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
  

const { data: userData, error: userError } = await supabase
  .from('users')
  .select('role')
  .eq('user_id', userId)
  .maybeSingle();

if (!userData) {
  console.warn('📭 Brak wpisu w users – uruchamiam runInsert');
  await runInsert(); // 🧠 wymuszamy wpis do users/patients
}

// 🔄 ponowna próba pobrania roli po insert
const { data: newUserData } = await supabase
  .from('users')
  .select('role')
  .eq('user_id', userId)
  .maybeSingle();

const role = newUserData?.role;

if (role === 'doctor' || role === 'dietitian') {
  localStorage.setItem('currentUserRole', role);
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
    if (error) {
  if (error.message.includes('rate limit')) {
    setResetCooldown(60); // ⏱️ Start cooldown 60s
    return;
  }
  return alert(tUI('passwordResetError') + ': ' + error.message);
}
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
      emailRedirectTo: 'https://www.dcp.care/register?confirmed=true',
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

// 🔁 Google Ads – konwersja rejestracji
if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
  window.gtag('event', 'conversion', {
    send_to: 'AW-1739542813/abc123xyz456', // ← wklej swój kod!
    value: 1.0,
    currency: 'PLN'
  });
}

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
  flex flex-col justify-start items-center pt-6 px-4 
  text-white transition-all duration-300 overflow-x-hidden">

  <nav className="absolute top-3 left-3 right-3 z-50 flex items-center justify-between px-3">
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
       className="border rounded px-3 py-1 text-sm shadow bg-white/80 text-black backdrop-blur dark:bg-gray-800 dark:text-white"
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
    <section
  className="
    z-10
    grid grid-cols-1 lg:grid-cols-2
    gap-6 lg:gap-8
    mt-8 lg:mt-12
    w-full max-w-3xl lg:max-w-6xl mx-auto
    bg-white/30 dark:bg-gray-900/30 backdrop-blur-md
    p-6 lg:p-10
    rounded-2xl shadow-xl transition-colors dark:text-white
    overflow-hidden
  "
>
      <h1 id="auth-section" className="sr-only">Logowanie i rejestracja</h1>
        {confirmation && (
      <div className="fixed top-0 left-0 w-full z-50 bg-green-600 text-white text-center py-2 shadow-md animate-fadeOut">
        ✅ {t('emailConfirmed')}
      </div>
      )}

  {/* ✅ Login */}
  <article className="z-10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 transition-colors dark:text-white" aria-labelledby="login-form">
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
      className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded w-full transition disabled:opacity-50"
      onClick={handleResetPassword}
      disabled={resetCooldown > 0}
    >
      {resetCooldown > 0
        ? `${t('resetPassword')} (${resetCooldown}s)`
        : t('resetPassword')}
    </button>
    </div>
  </article>

  {/* ✅ Rejestracja */}
  <article className="z-10 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 transition-colors dark:text-white" aria-labelledby="register-form">
    <h2 id="register-form" className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
      {t('registerTitle')}
    </h2>

    <div
  className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4 w-full"
  role="radiogroup"
  aria-label={t('selectRole')}
>
      {router.isReady && (
        <>
          {(router.query.mode === 'doctor' || router.query.mode === 'dietitian') && (
            <>
             <button
              onClick={() => setUserType('doctor')}
            className={`w-full sm:w-auto text-sm sm:text-base px-4 py-2 rounded transition ${
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
            className={`w-full sm:w-auto text-sm sm:text-base px-4 py-2 rounded transition ${
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
            className={`w-full sm:w-auto text-sm sm:text-base px-4 py-2 rounded transition ${
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
        defaultCountry={(detectedCountry ?? 'pl') as CountryIso2}
        value={form.phone}
        onChange={(phone) => setForm({ ...form, phone })}
        className="!w-full"
        inputClassName="!w-full h-[44px] text-sm bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded px-3 py-2"
        countrySelectorStyleProps={{ buttonClassName: "!h-[44px]" }}
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
  </article>
</section>
    </main>
  );
}
