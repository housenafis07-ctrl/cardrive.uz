import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { FinancingService } from "@/services/financing-service";
import { formatPrice } from "@/lib/formatters";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Kredit dasturlari — avtokredit va avtomobil krediti | Cardrive.uz",
  description: "Faol bank avtokredit dasturlari, foiz stavkalari, boshlang‘ich to‘lov va muddatlari. Har bir kredit dasturiga biriktirilgan yangi avtomobillarni ko‘ring.",
  alternates: { canonical: "/avtokredit" },
};

export default async function AvtokreditPage() {
  const locale = await getLocale();
  const result = await new FinancingService().getActiveProgramsWithCars();
  const programs = result.data ?? [];
  const ru = locale === "ru";
  return <><Header /><main className="mx-auto max-w-7xl px-5 py-10">
    <div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-wide text-amber-600">CARDRIVE.UZ</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{ru ? "Кредитные программы для новых автомобилей" : "Yangi avtomobillar uchun kredit dasturlari"}</h1><p className="mt-4 text-lg leading-8 text-slate-600">{ru ? "Выберите действующую банковскую программу и посмотрите автомобили, привязанные к ней в системе." : "Faol kredit dasturini tanlang va admin panelida ushbu dasturga biriktirilgan avtomobillarni ko‘ring."}</p></div>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/avtokredit/kalkulyator" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white">{ru ? "Кредитный калькулятор →" : "Kredit kalkulyatori →"}</Link><Link href="/cars" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black">{ru ? "Все автомобили" : "Barcha avtomobillar"}</Link></div>
    {!programs.length ? <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center font-semibold text-slate-600">{ru ? "Сейчас нет активных кредитных программ." : "Hozircha faol kredit dasturlari mavjud emas."}</div> : <div className="mt-10 space-y-7">{programs.map((program: any) => {
      const bank = program.banks;
      const rules = Array.isArray(program.financing_program_rules) ? program.financing_program_rules.filter((r: any) => r.is_available !== false) : [];
      const rate = rules.length ? Math.min(...rules.map((r: any) => Number(r.annual_interest_rate))) : Number(program.annual_interest_rate ?? 0);
      const down = rules.length ? Math.min(...rules.map((r: any) => Number(r.down_payment_percent))) : Number(program.min_down_payment_percent ?? 0);
      const term = rules.length ? Math.max(...rules.map((r: any) => Number(r.term_months))) : Number(program.max_term_months ?? 0);
      const cars = Array.isArray(program.linked_cars) ? program.linked_cars : [];
      return <section key={program.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b bg-slate-50 p-6 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-5"><div className="flex items-start gap-4">{bank?.logo_url ? <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-white p-2"><Image src={bank.logo_url} alt={bank.name} width={48} height={48} className="h-10 w-10 object-contain" /></div> : null}<div><p className="text-sm font-bold text-slate-500">{ru ? bank?.name_ru ?? bank?.name : bank?.name ?? "Diler"}</p><h2 className="mt-1 text-2xl font-black">{ru ? program.name_ru ?? program.name : program.name_uz ?? program.name}</h2>{program.description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{ru ? program.description_ru ?? program.description : program.description}</p>}</div></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">{ru ? "Активна" : "Faol"}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white p-4"><p className="text-xs text-slate-500">{ru ? "Ставка" : "Foiz stavkasi"}</p><p className="mt-1 text-xl font-black">{rate}%</p></div><div className="rounded-2xl bg-white p-4"><p className="text-xs text-slate-500">{ru ? "Первоначальный взнос" : "Boshlang‘ich to‘lov"}</p><p className="mt-1 text-xl font-black">{down}%</p></div><div className="rounded-2xl bg-white p-4"><p className="text-xs text-slate-500">{ru ? "Максимальный срок" : "Maksimal muddat"}</p><p className="mt-1 text-xl font-black">{term} {ru ? "мес." : "oy"}</p></div></div></div>
        <div className="p-6 sm:p-7"><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">{ru ? "Автомобили по программе" : "Ushbu dasturga biriktirilgan avtomobillar"}</h3><span className="text-sm font-bold text-slate-500">{cars.length} {ru ? "авто" : "ta avtomobil"}</span></div>{cars.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cars.map((car: any) => { const brand = Array.isArray(car.brands) ? car.brands[0] : car.brands; const model = Array.isArray(car.car_models) ? car.car_models[0] : car.car_models; return <Link key={car.id} href={`/cars/${car.slug}`} className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-sm"><p className="text-xs font-bold text-slate-500">{brand?.name ?? ""} · {model?.name ?? ""}</p><h4 className="mt-1 font-black">{ru ? car.name_ru ?? car.name : car.name_uz ?? car.name}</h4><p className="mt-2 font-black">{formatPrice(Number(car.price), car.currency, locale)}</p><p className="mt-1 text-xs text-slate-500">{car.year} · {car.stock_status === "available" ? (ru ? "В наличии" : "Mavjud") : (ru ? "Скоро" : "Tez orada")}</p></Link> })}</div> : <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">{ru ? "Автомобили к этой программе ещё не привязаны." : "Bu dasturga hali avtomobil biriktirilmagan."}</p>}</div>
      </section>;
    })}</div>}
  </main><Footer /></>;
}
