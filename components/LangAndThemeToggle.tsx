"use client";

import { useEffect, useState } from "react";
import { LangKey, languageLabels } from "@/utils/i18n";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import { tUI } from "@/utils/i18n";

export default function LangAndThemeToggle() {
  const router = useRouter();

  const [lang, setLang] = useState<LangKey>("pl");

  useEffect(() => {
    const storedLang = localStorage.getItem("platformLang") as LangKey;
    if (storedLang) setLang(storedLang);
  }, []);

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value as LangKey;
    setLang(selectedLang);
    localStorage.setItem("platformLang", selectedLang);
    router.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("currentUserID");
    localStorage.removeItem("currentUserRole");
    router.push("/"); // lub '/register?mode=login' jeśli tak wolisz globalnie
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {/* LANGUAGE SELECTOR (glass) */}
      <select
        className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 text-white shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60"
        value={lang}
        onChange={handleLangChange}
        aria-label={tUI("nav.languageAria", lang) === "nav.languageAria" ? "Language selection" : tUI("nav.languageAria", lang)}
      >
        {Object.entries(languageLabels).map(([key, label]) => (
          <option key={key} value={key} className="text-black">
            {label}
          </option>
        ))}
      </select>

      {/* LOGOUT (modern lux button) */}
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-xl border border-white/10 bg-white/8 hover:bg-white/12 text-white/90 hover:text-white shadow-[0_18px_60px_rgba(0,0,0,.30)] backdrop-blur-xl transition"
        aria-label={tUI("logout", lang) === "logout" ? "Wyloguj się" : tUI("logout", lang)}
        title={tUI("logout", lang) === "logout" ? "Wyloguj się" : tUI("logout", lang)}
      >
        {tUI("logout", lang) === "logout" ? "Wyloguj się" : tUI("logout", lang)}
      </button>
    </div>
  );
}