"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function MarketContextSearch({ locale, className = "" }: { locale: Locale; className?: string }) {
  const pathname = usePathname();
  const inAvtobozor = pathname === "/avtobozor" || pathname.startsWith("/avtobozor/");
  const action = inAvtobozor ? "/avtobozor" : "/cars";
  const placeholder = locale === "ru" ? "Марка или модель автомобиля..." : "Avtomobil markasi yoki modeli...";
  const label = locale === "ru" ? "Поиск автомобиля" : "Avtomobil qidirish";
  const find = locale === "ru" ? "Найти" : "Qidirish";

  return (
    <form action={action} method="get" role="search" className={className}>
      <div className="marketplace-search relative">
        <input name="q" aria-label={label} placeholder={placeholder} className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-4 pr-14 text-sm outline-none transition focus:border-slate-400 focus:bg-white" />
        <button type="submit" aria-label={find} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5" strokeLinecap="round"/></svg>
        </button>
      </div>
    </form>
  );
}
