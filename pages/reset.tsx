import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import { tUI, type LangKey } from '@/utils/i18n';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lang, setLang] = useState<LangKey>('pl');

  useEffect(() => {
    const url = new URL(window.location.href);
    const type = url.searchParams.get('type');

    if (type !== 'recovery') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.push('/');
      });
    }

    const storedLang = localStorage.getItem('platformLang') as LangKey;
    if (storedLang) setLang(storedLang);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(tUI('passwordsMustMatch', lang));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(tUI('resetError', lang) + ': ' + error.message);
    } else {
      setMessage(tUI('resetSuccess', lang));
      setTimeout(() => router.push('/register?mode=login'), 3000);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#0f271e]/70 bg-gradient-to-br from-[#102f24]/80 to-[#0f271e]/60 backdrop-blur-[12px] shadow-[inset_0_0_60px_rgba(255,255,255,0.08)]">
      <form
        onSubmit={handleReset}
        className="bg-white dark:bg-gray-900 shadow-xl rounded-lg p-6 text-gray-900 dark:text-white w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">{tUI('setNewPassword', lang)}</h1>

        <input
          type="password"
          required
          className="w-full px-4 py-2 border rounded mb-4 bg-gray-50 dark:bg-gray-800"
          placeholder={tUI('newPassword', lang)}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          required
          className="w-full px-4 py-2 border rounded mb-4 bg-gray-50 dark:bg-gray-800"
          placeholder={tUI('confirmPassword', lang)}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white text-lg font-semibold transition ${
            loading ? 'bg-gray-400' : 'bg-blue-700 hover:bg-blue-800'
          }`}
        >
          {tUI('saveNewPassword', lang)}
        </button>

        {message && <p className="mt-4 text-center text-sm text-gray-700 dark:text-gray-300">{message}</p>}
      </form>
    </main>
  );
}