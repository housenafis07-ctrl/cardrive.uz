import { formatPrice, type FormatterLocale } from "@/lib/formatters";
import type { UsedCarBestCredit } from "@/lib/used-car-financing";

export function UsedCarFinancingBadge({ offer, locale = "uz", compact = false }: { offer: UsedCarBestCredit | null; locale?: FormatterLocale; compact?: boolean }) {
  if (!offer) return null;
  const ru = locale === "ru";
  return <div className={compact ? "space-y-1.5 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-2" : "space-y-2 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-3"}>
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white">{ru ? "КРЕДИТ" : "KREDIT"}</span>
      <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-700 shadow-sm">{ru ? "Взнос" : "VZNOS"} {offer.downPaymentPercent}%</span>
    </div>
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{ru ? "От" : "OYLIK TO‘LOV"}</p>
      <p className={compact ? "mt-0.5 break-words text-sm font-black leading-tight tracking-tight text-slate-950" : "mt-0.5 text-lg font-black tracking-tight text-slate-950"}>{formatPrice(offer.monthlyPayment, offer.currency, locale)} <span className="text-[10px] font-bold text-slate-500">{ru ? "в мес." : " / oy"}</span></p>
    </div>
    <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500"><span className="truncate">{offer.providerName}</span><span className="shrink-0">{offer.termMonths} {ru ? "мес." : "oy"}</span></div>
    {!compact ? <p className="text-[9px] text-slate-400">{ru ? "Минимальный расчётный платёж по активным программам" : "Faol dasturlar ichidagi eng kam hisoblangan oylik to‘lov"}</p> : null}
  </div>;
}
