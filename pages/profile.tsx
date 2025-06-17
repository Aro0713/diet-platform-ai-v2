import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [edited, setEdited] = useState({ name: '', email: '', phone: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        alert('Nie jesteś zalogowany. Zaloguj się ponownie.');
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('id, name, email, phone, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !profile) {
        alert('Nie udało się pobrać danych profilu.');
        return;
      }

      setData(profile);
      setEdited({ name: profile.name, email: profile.email, phone: profile.phone });
    };

    fetchData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEdited({ ...edited, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('users')
      .update({ ...edited })
      .eq('user_id', data.user_id);

    if (error) {
      alert('❌ Błąd zapisu: ' + error.message);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Profil pacjenta</h1>

      <div className="bg-white p-6 rounded shadow max-w-lg space-y-4">
        <div>
          <label className="block font-semibold mb-1">ID użytkownika (stałe)</label>
          <input
            type="text"
            value={data.user_id}
            disabled
            className="w-full border px-3 py-2 bg-gray-100 text-gray-600"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Imię i nazwisko</label>
          <input
            name="name"
            type="text"
            value={edited.name}
            onChange={handleChange}
            className="w-full border px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={edited.email}
            onChange={handleChange}
            className="w-full border px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Telefon</label>
          <input
            name="phone"
            type="tel"
            value={edited.phone}
            onChange={handleChange}
            className="w-full border px-3 py-2"
          />
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          💾 Zapisz zmiany
        </button>
        {saved && <p className="text-green-600 font-semibold mt-2">✅ Zmiany zostały zapisane</p>}
        <button
          onClick={() => router.push('/patient')}
          className="mt-4 text-blue-600 underline text-sm"
        >
          ← Powrót do panelu pacjenta
        </button>
      </div>
    </div>
  );
}
