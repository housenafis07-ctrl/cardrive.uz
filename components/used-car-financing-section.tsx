"use client";

import { FinancingOptions, type FinancingProgram } from "@/components/financing-options";
import { UsedCarCreditApplicationPanel } from "@/components/used-car-credit-application-panel";
import type { FormatterLocale } from "@/lib/formatters";

const LABELS = {
  uz: {
    title: "Bank krediti orqali xarid qilish",
    description: "Avtomobil narxini, boshlang‘ich to‘lovni va kredit muddatini tanlang. Oylik to‘lov avtomatik hisoblanadi.",
    empty: "Ushbu valyutada hozircha faol bank kredit dasturlari mavjud emas.",
    note: "Hisob-kitob taxminiy. Kredit ajratish va yakuniy shartlar bank qaroriga bog‘liq.",
  },
  ru: {
    title: "Покупка автомобиля в банковский кредит",
    description: "Выберите первоначальный взнос и срок кредита. Ежемесячный платёж рассчитается автоматически.",
    empty: "Для этой валюты пока нет активных банковских кредитных программ.",
    note: "Расчёт предварительный. Выдача кредита и окончательные условия определяются банком.",
  },
} as const;

export function UsedCarFinancingSection({
  carPrice, currency, programs, bestProgramId = null, locale = "uz",
  listingId, vehicleTitle, isAuthenticated = false,
}: {
  carPrice: number; currency: string; programs: FinancingProgram[];
  bestProgramId?: string | null; locale?: FormatterLocale;
  listingId: string; vehicleTitle: string; isAuthenticated?: boolean;
}) {
  const l = LABELS[locale];
  return (
    <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{l.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{l.description}</p>
        {programs.length ? (
          <>
            <div className="mt-6">
              <FinancingOptions carPrice={carPrice} currency={currency} programs={programs}
                purchaseType="credit" selectedProgramId={bestProgramId} locale={locale} scope="used" />
            </div>
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="text-xl font-black">{locale === "ru" ? "Заявка на индивидуальный расчёт в банке" : "Bankda individual kredit hisob-kitobini so‘rash"}</h3>
              <p className="mt-1 text-sm text-slate-600">{locale === "ru" ? "Выберите банк и отправьте заявку. Менеджер Cardrive проверит данные и свяжется с вами." : "Bankni tanlab, ariza yuboring. Cardrive menejeri ma’lumotlarni tekshiradi va siz bilan bog‘lanadi."}</p>
              <UsedCarCreditApplicationPanel listingId={listingId} vehicleTitle={vehicleTitle}
                carPrice={carPrice} currency={currency} programs={programs}
                isAuthenticated={isAuthenticated} locale={locale} />
            </div>
          </>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-600">{l.empty}</p>
        )}
        <p className="mt-5 text-xs leading-5 text-slate-500">{l.note}</p>
      </div>
    </section>
  );
}
