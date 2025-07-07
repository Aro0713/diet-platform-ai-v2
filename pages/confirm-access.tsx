// pages/confirm-access.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { tUI } from '@/utils/i18n';
import { translationsUI } from '@/utils/translationsUI';
import type { LangKey } from '@/utils/i18n';

export default function ConfirmAccessPage() {
  const router = useRouter();
  const { request_id } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [lang, setLang] = useState<LangKey>('pl');

    useEffect(() => {
  const storedLang = localStorage.getItem('platformLang');
  const browserLang = navigator.language.slice(0, 2).toLowerCase();

  const supportedLangs: LangKey[] = ['pl', 'en', 'de', 'fr', 'es', 'ua', 'ru', 'zh', 'ar', 'hi', 'he'];
  const resolvedLang: LangKey = supportedLangs.includes(browserLang as LangKey)
    ? (browserLang as LangKey)
    : 'pl';

  setLang((storedLang as LangKey) || resolvedLang);
}, []);


  useEffect(() => {
    const confirmRequest = async () => {
      if (!request_id || typeof request_id !== 'string') return;

      const { data, error } = await supabase
        .from('patient_access_requests')
        .update({ status: 'approved' })
        .eq('id', request_id);

      if (error || !data) {
        setStatus('error');
      } else {
        setStatus('success');
      }
    };

    confirmRequest();
  }, [request_id]);

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
  {status === 'loading' && (
    <p className="text-xl text-gray-600 dark:text-gray-300">
      ⏳ {tUI('accessRequestProcessing', lang)}
    </p>
  )}

  {status === 'success' && (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
        ✅ {tUI('accessGranted', lang)}
      </h1>
      <p className="text-gray-700 dark:text-gray-300">
        {tUI('accessGrantedDescription', lang)}
      </p>
    </div>
  )}

  {status === 'error' && (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
        ❌ {tUI('accessError', lang)}
      </h1>
      <p className="text-gray-700 dark:text-gray-300">
        {tUI('accessErrorDescription', lang)}
      </p>
    </div>
  )}
</main>

  );
}
