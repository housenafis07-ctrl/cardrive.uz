"use client";

import { useState } from "react";
import { FinancingOptions, type FinancingProgram } from "@/components/financing-options";
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
  carPrice,
  currency,
  programs,
  locale = "uz",
}: {
  carPrice: number;
  currency: string;
  programs: FinancingProgram[];
  locale?: FormatterLocale;
}) {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(bestProgramId);
  const l = LABELS[locale];

  return (
    <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{l.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{l.description}</p>
        {programs.length ? (
          <div className="mt-6">
            <FinancingOptions
              carPrice={carPrice}
              currency={currency}
              programs={programs}
              purchaseType="credit"
              selectedProgramId={selectedProgramId}
              onSelectProgram={setSelectedProgramId}
              locale={locale}
              scope="used"
            />
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-600">
            {l.empty}
          </p>
        )}
        <p className="mt-5 text-xs leading-5 text-slate-500">{l.note}</p>
      </div>
    </section>
  );
}
