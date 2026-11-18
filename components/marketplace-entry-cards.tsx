import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function MarketplaceEntryCards({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl items-center px-4 py-6 sm:px-8">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <Link href="/cars" aria-label={ru ? "Новые автомобили" : "Yangi avtomobillar"} className="group relative flex min-h-[38svh] items-end overflow-hidden rounded-[28px] bg-gradient-to-br from-[#061a36] via-[#0b4c8c] to-[#0877f9] p-6 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-500 sm:min-h-[420px] sm:p-8">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{ru ? "Новые автомобили" : "Yangi avtomobillar"}</h1>
            <span className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950">{ru ? "Перейти" : "Kirish"} <span className="ml-3" aria-hidden="true">→</span></span>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-8 text-[145px] opacity-25 transition group-hover:scale-110 sm:text-[190px]">🚘</div>
          <div aria-hidden="true" className="absolute right-5 top-5 h-28 w-28 rounded-full border border-white/20 sm:h-40 sm:w-40" />
        </Link>
        <Link href="/avtobozor" aria-label={ru ? "Авторынок — подержанные автомобили" : "Avtobozor — ishlatilgan avtomobillar"} className="group relative flex min-h-[38svh] items-end overflow-hidden rounded-[28px] bg-gradient-to-br from-[#09251e] via-[#08745c] to-[#12a47b] p-6 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 sm:min-h-[420px] sm:p-8">
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{ru ? "Авторынок" : "Avtobozor"}</h2>
            <span className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950">{ru ? "Перейти" : "Kirish"} <span className="ml-3" aria-hidden="true">→</span></span>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-8 text-[145px] opacity-25 transition group-hover:scale-110 sm:text-[190px]">🚙</div>
          <div aria-hidden="true" className="absolute right-5 top-5 h-28 w-28 rounded-full border border-white/20 sm:h-40 sm:w-40" />
        </Link>
      </div>
    </section>
  );
}