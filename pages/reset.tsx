import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { getTranslation, type LangKey } from '@/utils/i18n';
import { translationsRegister } from '@/components/utils/translations/register';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lang, setLang] = useState<LangKey>('pl');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/');
    });
    const storedLang = localStorage.getItem('platformLang') as LangKey;
    if (storedLang) setLang(storedLang);
  }, []);

  const t = (key: keyof typeof translationsRegister) => getTranslation(translationsRegister, key, lang);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setMessage(t('passwordsMustMatch'));

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(t('resetError') + ': ' + error.message);
    } else {
      setMessage(t('resetSuccess'));
      setTimeout(() => router.push('/register'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleReset} className="bg-white shadow-md rounded px-8 pt-6 pb-8 w-full max-w-md">
        <h1 className="text-xl font-semibold mb-6 text-center">{t('setNewPassword')}</h1>

        <input
          type="password"
          required
          className="w-full px-3 py-2 border rounded mb-4"
          placeholder={t('newPassword')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          required
          className="w-full px-3 py-2 border rounded mb-4"
          placeholder={t('confirmPassword')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-700 hover:bg-blue-800'}`}
        >
          {t('saveNewPassword')}
        </button>

        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );
}