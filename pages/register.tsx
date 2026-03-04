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

// 🔁 Google Ads – konwersja rejestracji (po udanym signUp)
try {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    // prosty wybór waluty na podstawie kraju; popraw w razie potrzeby
    const cc = (detectedCountry || 'pl').toLowerCase();
    const currency =
      cc === 'pl' ? 'PLN' :
      cc === 'gb' ? 'GBP' :
      cc === 'sa' ? 'SAR' :
      'USD';

    window.gtag('event', 'conversion', {
      // <<< WSTAW swój *dokładny* identyfikator z Google Ads >>>
      send_to: 'AW-17395428138/asdGcLUCxgwaEkzWSO2A',
      value: 1.0,          // rejestracja (bez płatności) -> 0; jeśli chcesz, ustaw np. 1
      currency,
    });
  }
} catch (e) {
  console.warn('GA conversion (signup) not sent:', e);
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
  <main className="relative min-h-screen overflow-x-hidden text-white bg-[#06131a]">
    {/* GLASS BACKDROP (wizual) */}
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_15%,rgba(56,189,248,.22),transparent_60%),radial-gradient(900px_600px_at_80%_25%,rgba(167,139,250,.16),transparent_60%),radial-gradient(900px_700px_at_55%_85%,rgba(16,185,129,.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.10)_0%,rgba(255,255,255,.04)_30%,rgba(0,0,0,.10)_100%)] opacity-70" />
      <div className="absolute inset-0 opacity-[0.10] mix-blend-overlay">
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:18px_18px]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06131a] to-transparent opacity-60" />
    </div>

    {/* CONTENT */}
    <div className="relative flex flex-col justify-start items-center pt-6 px-4">
      {/* NAV (tylko język) */}
      <nav className="sticky top-0 z-50 w-full">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mt-3 mb-2 rounded-2xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.35)]">
            <div className="flex items-center justify-between px-3 py-2 md:px-4">
              <div className="flex items-center gap-2">
                <label htmlFor="language-select" className="sr-only">
                  Wybierz język
                </label>
                <select
                  id="language-select"
                  value={lang}
                  onChange={(e) => {
                    const selected = e.target.value as LangKey;
                    setLang(selected);
                    localStorage.setItem("platformLang", selected);
                  }}
                  className="border border-white/10 rounded-xl px-3 py-1.5 shadow bg-white/10 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  aria-label="Language selection"
                >
                  {Object.entries(languageLabels).map(([key, label]) => (
                    <option key={key} value={key} className="text-black">
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-white/70 hidden sm:block">
                {tUI("app.title")}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 🔐 Login i Rejestracja */}
      <section className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-8 lg:mt-12 w-full max-w-3xl lg:max-w-6xl mx-auto rounded-3xl border border-white/10 bg-white/6 backdrop-blur-2xl p-6 lg:p-10 shadow-[0_30px_90px_rgba(0,0,0,.45)] overflow-hidden">
        <h1 id="auth-section" className="sr-only">
          Logowanie i rejestracja
        </h1>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block bg-[radial-gradient(120%_80%_at_15%_0%,rgba(255,255,255,.10),transparent_55%)]"
        />

        {confirmation && (
          <div className="fixed top-0 left-0 w-full z-50 bg-emerald-600 text-white text-center py-2 shadow-md animate-fadeOut">
            ✅ {t("emailConfirmed")}
          </div>
        )}

        {/* ✅ Login */}
        <article
          className="relative z-10 rounded-3xl border border-white/10 bg-white/7 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,.30)] p-6 md:p-8 transition-colors"
          aria-labelledby="login-form"
        >
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(120%_90%_at_20%_0%,rgba(255,255,255,.10),transparent_55%)]" />
          <div className="relative">
            <h2 id="login-form" className="text-xl font-bold mb-4">
              {t("loginTitle")}
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <label htmlFor="login-email" className="sr-only">
                {t("email")}
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={login.email}
                onChange={(e) => setLogin({ ...login, email: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/50 px-3 py-2.5 shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                placeholder={t("email")}
                aria-label={t("email")}
              />

              <label htmlFor="login-password" className="sr-only">
                {t("password")}
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={login.password}
                onChange={(e) => setLogin({ ...login, password: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/50 px-3 py-2.5 shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                placeholder={t("password")}
                aria-label={t("password")}
              />

              <div className="flex items-start text-sm gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={loginConsent}
                  onChange={(e) => setLoginConsent(e.target.checked)}
                  className="mt-1"
                  id="login-consent"
                />
                <label htmlFor="login-consent" className="leading-snug text-sm text-white/85">
                  <span className="block">{consentPrefix}</span>
                  <span className="block">
                    <a
                      href="/regulamin"
                      className="underline decoration-white/30 hover:decoration-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {termsLinkText}
                    </a>{" "}
                    {t("and")}{" "}
                    <a
                      href="/polityka-prywatnosci"
                      className="underline decoration-white/30 hover:decoration-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {privacyLinkText}
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl px-4 py-2.5 font-semibold border border-white/10 bg-white/10 hover:bg-white/14 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.30)] transition disabled:opacity-50"
                disabled={!loginConsent}
              >
                {t("loginTitle")}
              </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="font-bold mb-2">{t("forgotPassword")}</h3>
              <label htmlFor="recovery-email" className="sr-only">
                {t("email")}
              </label>
              <input
                id="recovery-email"
                type="email"
                placeholder={t("email")}
                className="w-full rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/50 px-3 py-2.5 shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                value={recoveryID}
                onChange={(e) => setRecoveryID(e.target.value)}
                aria-label={t("email")}
              />
              <button
                type="button"
                className="mt-3 w-full rounded-2xl px-4 py-2.5 font-semibold border border-white/10 bg-white/10 hover:bg-white/14 backdrop-blur-xl transition disabled:opacity-50"
                onClick={handleResetPassword}
                disabled={resetCooldown > 0}
              >
                {resetCooldown > 0 ? `${t("resetPassword")} (${resetCooldown}s)` : t("resetPassword")}
              </button>
            </div>
          </div>
        </article>

        {/* ✅ Rejestracja */}
        <article
          className="relative z-10 rounded-3xl border border-white/10 bg-white/7 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,.30)] p-6 md:p-8 transition-colors"
          aria-labelledby="register-form"
        >
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(120%_90%_at_20%_0%,rgba(255,255,255,.10),transparent_55%)]" />
          <div className="relative">
            <h2 id="register-form" className="text-2xl font-bold mb-4">
              {t("registerTitle")}
            </h2>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4 w-full" role="radiogroup" aria-label={t("selectRole")}>
              {router.isReady && (
                <>
                  {(router.query.mode === "doctor" || router.query.mode === "dietitian") && (
                    <>
                      <button
                        onClick={() => setUserType("doctor")}
                        className={`w-full sm:w-auto rounded-2xl px-4 py-2 text-sm sm:text-base font-semibold border border-white/10 transition ${userType === "doctor" ? "bg-white/14 shadow-[0_18px_60px_rgba(0,0,0,.25)]" : "bg-white/8 hover:bg-white/10"}`}
                        role="radio"
                        aria-checked={userType === "doctor"}
                        aria-label={t("roleDoctor")}
                        type="button"
                      >
                        {t("roleDoctor")}
                      </button>

                      <button
                        onClick={() => setUserType("dietitian")}
                        className={`w-full sm:w-auto rounded-2xl px-4 py-2 text-sm sm:text-base font-semibold border border-white/10 transition ${userType === "dietitian" ? "bg-white/14 shadow-[0_18px_60px_rgba(0,0,0,.25)]" : "bg-white/8 hover:bg-white/10"}`}
                        role="radio"
                        aria-checked={userType === "dietitian"}
                        aria-label={t("roleDietitian")}
                        type="button"
                      >
                        {t("roleDietitian")}
                      </button>
                    </>
                  )}

                  {(!router.query.mode || router.query.mode === "register" || router.query.mode === "patient") && (
                    <button
                      onClick={() => setUserType("patient")}
                      className={`w-full sm:w-auto rounded-2xl px-4 py-2 text-sm sm:text-base font-semibold border border-white/10 transition ${userType === "patient" ? "bg-white/14 shadow-[0_18px_60px_rgba(0,0,0,.25)]" : "bg-white/8 hover:bg-white/10"}`}
                      role="radio"
                      aria-checked={userType === "patient"}
                      aria-label={rolePatientLabel}
                      type="button"
                    >
                      {rolePatientLabel}
                    </button>
                  )}
                </>
              )}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="sr-only">
                  {t("fullName")}
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/50 px-3 py-2.5 shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder={t("fullName")}
                  aria-label={t("fullName")}
                />
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/50 px-3 py-2.5 shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder={t("email")}
                  aria-label={t("email")}
                />
              </div>

              <div className="w-full">
                <label htmlFor="phone" className="sr-only">
                  {t("phone")}
                </label>

                <PhoneInput
                  defaultCountry={(detectedCountry ?? "pl") as CountryIso2}
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone })}
                  className="!w-full"
                  inputClassName="!w-full !h-[44px] !rounded-xl !border !border-white/10 !bg-white/10 !text-white placeholder:!text-white/50 !px-3 !py-2.5 !shadow-sm !backdrop-blur-xl focus:!outline-none focus:!ring-2 focus:!ring-sky-400/60"
                  countrySelectorStyleProps={{ buttonClassName: "!h-[44px] !rounded-xl !border !border-white/10 !bg-white/10 !backdrop-blur-xl" }}
                  inputProps={{
                    name: "phone",
                    required: true,
                    id: "phone",
                    "aria-label": t("phone"),
                    placeholder: t("phone"),
                  }}
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  {t("password")}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/50 px-3 py-2.5 shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder={t("password")}
                  aria-label={t("password")}
                />
              </div>

              {userType === "doctor" && (
                <MedicalJurisdiction
                  lang={lang}
                  jurisdiction={jurisdiction}
                  licenseNumber={licenseNumber}
                  onJurisdictionChange={setJurisdiction}
                  onLicenseChange={setLicenseNumber}
                />
              )}

              {userType === "dietitian" && (
                <div>
                  <label htmlFor="diplomaNumber" className="sr-only">
                    {t("diplomaNumber")}
                  </label>
                  <input
                    id="diplomaNumber"
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/10 text-white placeholder:text-white/50 px-3 py-2.5 shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    placeholder={t("diplomaNumber")}
                    aria-label={t("diplomaNumber")}
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
                <label htmlFor="consent" className="leading-snug text-sm text-white/85">
                  <span className="block">{consentPrefix}</span>
                  <span className="block">
                    <a
                      href="/regulamin"
                      className="underline decoration-white/30 hover:decoration-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {termsLinkText}
                    </a>{" "}
                    {t("and")}{" "}
                    <a
                      href="/polityka-prywatnosci"
                      className="underline decoration-white/30 hover:decoration-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {privacyLinkText}
                    </a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl px-4 py-2.5 font-semibold border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,.35),rgba(16,185,129,.25))] hover:bg-[linear-gradient(135deg,rgba(56,189,248,.45),rgba(16,185,129,.32))] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.30)] transition disabled:opacity-50"
                disabled={!consentGiven}
              >
                {t("registerTitle")}
              </button>
            </form>
          </div>
        </article>
      </section>
    </div>
  </main>
);
}
