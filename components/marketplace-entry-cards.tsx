import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function MarketplaceEntryCards({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return <section className="mx-auto max-w-7xl px-4 pb-8 pt-7 sm:px-6 lg:px-8">
    <div className="mb-5"><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">CARDRIVE.UZ</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{ru?"Выберите автомобильный рынок":"O‘zingizga kerakli avtomobil bozorini tanlang"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{ru?"Новые автомобили от дилеров и объявления от владельцев — в одной автомобильной экосистеме.":"Dilerlarning yangi avtomobillari va egalarining e'lonlari — yagona avtomobil ekotizimida."}</p></div>
    <div className="grid gap-4 md:grid-cols-2">
      <Link href="/cars" className="group relative flex min-h-[270px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#061a36] via-[#0b4c8c] to-[#0877f9] p-6 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl sm:min-h-[330px] sm:p-8">
        <div className="relative z-10 flex max-w-[70%] flex-col items-start justify-end"><span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">{ru?"Дилерские предложения":"DILERLAR TAKLIFLARI"}</span><h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{ru?"Новые автомобили":"Yangi avtomobillar"}</h2><p className="mt-3 text-sm leading-6 text-blue-50">{ru?"Каталог новых моделей, комплектаций, цен, кредитов и рассрочки.":"Yangi modellar, komplektatsiyalar, narxlar, kredit va muddatli to‘lov takliflari."}</p><span className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950">{ru?"Открыть каталог":"Katalogni ochish"} <span className="ml-3">→</span></span></div>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-7 -right-10 text-[150px] opacity-25 transition group-hover:scale-110 sm:text-[210px]">🚘</div><div aria-hidden="true" className="absolute right-5 top-5 h-36 w-36 rounded-full border border-white/20 sm:h-48 sm:w-48"/>
      </Link>
      <Link href="/avtobozor" className="group relative flex min-h-[270px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#09251e] via-[#08745c] to-[#12a47b] p-6 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl sm:min-h-[330px] sm:p-8">
        <div className="relative z-10 flex max-w-[70%] flex-col items-start justify-end"><span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">{ru?"Частные объявления и автосалоны":"XUSUSIY E'LONLAR VA AVTOSALONLAR"}</span><h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{ru?"Авторынок":"Avtobozor"}</h2><p className="mt-3 text-sm leading-6 text-emerald-50">{ru?"Покупайте и продавайте автомобили. Размещайте объявления от своего имени.":"Avtomobil sotib oling yoki soting. O‘z nomingizdan e'lon joylashtiring."}</p><span className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950">{ru?"Перейти на авторынок":"Avtobozorga o'tish"} <span className="ml-3">→</span></span></div>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-7 -right-10 text-[150px] opacity-25 transition group-hover:scale-110 sm:text-[210px]">🚙</div><div aria-hidden="true" className="absolute right-5 top-5 h-36 w-36 rounded-full border border-white/20 sm:h-48 sm:w-48"/>
      </Link>
    </div>
  </section>;
}
