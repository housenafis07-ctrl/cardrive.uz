import { formatPrice, type FormatterLocale } from "@/lib/formatters";
import type { UsedCarBestCredit } from "@/lib/used-car-financing";

export function UsedCarFinancingBadge({ offer, locale = "uz" }: { offer: UsedCarBestCredit | null; locale?: FormatterLocale }) {
  const ru = locale === "ru";
  if (!offer) return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-center gap-1.5"><span className="rounded-full bg-slate-700 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white">{ru ? "КРЕДИТ" : "KREDIT"}</span><span className="text-[11px] font-semibold text-slate-500">{ru ? "Нет доступной программы" : "Mos kredit dasturi topilmadi"}</span></div>
    <p className="mt-2 text-xs text-slate-500">{ru ? "Ежемесячный платёж будет показан после появления подходящей банковской программы." : "Mos bank dasturi mavjud bo‘lganda oylik to‘lov shu yerda ko‘rsatiladi."}</p>
  </div>;
  return <div className="space-y-2 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-3">
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white">{ru ? "КРЕДИТ" : "KREDIT"}</span>
      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm">{ru ? "Взнос" : "VZNOS"} {offer.downPaymentPercent}%</span>
    </div>
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{ru ? "От" : "OYLIK TO‘LOV"}</p>
      <p className="mt-0.5 text-lg font-black tracking-tight text-slate-950">{formatPrice(offer.monthlyPayment, offer.currency, locale)} <span className="text-xs font-bold text-slate-500">{ru ? "в мес." : " / oy"}</span></p>
    </div>
    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500"><span className="truncate">{offer.providerName}</span><span className="shrink-0">{offer.termMonths} {ru ? "мес." : "oy"}</span></div>
    <p className="text-[9px] text-slate-400">{ru ? "Минимальный расчётный платёж по активным программам" : "Faol dasturlar ichidagi eng kam hisoblangan oylik to‘lov"}</p>
  </div>;
}
