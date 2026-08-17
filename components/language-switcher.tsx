"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "cardrive-locale";
type Locale = "uz" | "ru";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [locale, setLocale] = useState<Locale>("uz");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "uz" || saved === "ru") setLocale(saved);
  }, []);

  function changeLocale(next: Locale) {
    setLocale(next);
    window.localStorage.setItem(KEY, next);
    document.cookie = `${KEY}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const query = params.toString();
    router.refresh();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-bold" aria-label="Tilni tanlash">
      <button type="button" onClick={() => changeLocale("uz")} className={`rounded-full px-3 py-1.5 transition ${locale === "uz" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"}`}>O‘zbekcha</button>
      <button type="button" onClick={() => changeLocale("ru")} className={`rounded-full px-3 py-1.5 transition ${locale === "ru" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"}`}>Русский</button>
    </div>
  );
}
