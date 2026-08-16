"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/formatters";
import type { FinancingProgram } from "@/components/financing-options";

type Props = {
  carPrice: number;
  currency: string;
  program: FinancingProgram;
  selected: boolean;
  selectable?: boolean;
  onSelect: () => void;
};

type Row = { month: number; payment: number; principal: number; interest: number; balance: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function monthlyPayment(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.round(principal / months);
  return Math.round((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
}

function buildSchedule(principal: number, annualRate: number, months: number): Row[] {
  if (principal <= 0 || months <= 0) return [];
  const monthlyRate = annualRate / 100 / 12;
  let balance = principal;
  const payment = monthlyPayment(principal, annualRate, months);
  const rows: Row[] = [];

  for (let month = 1; month <= months; month += 1) {
    const interest = monthlyRate === 0 ? 0 : Math.round(balance * monthlyRate);
    const principalPart = Math.min(balance, Math.max(0, payment - interest));
    const actualPayment = principalPart + interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month, payment: actualPayment, principal: principalPart, interest, balance });
  }

  return rows;
}

function termLabel(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!rest) return `${years} yil (${months} oy)`;
  return `${years} yil ${rest} oy (${months} oy)`;
}

export function FinancingCalculator({ carPrice, currency, program, selected, selectable = true, onSelect }: Props) {
  const minDown = clamp(Number(program.min_down_payment_percent ?? 0), 0, 100);
  const maxFinancing = program.max_financing_percent == null ? 100 : clamp(Number(program.max_financing_percent), 0, 100);
  const maxDown = clamp(100 - maxFinancing, minDown, 100);
  const minTerm = Math.max(1, Number(program.min_term_months ?? 12));
  const maxTerm = Math.max(minTerm, Number(program.max_term_months ?? minTerm));
  const [downPaymentPercent, setDownPaymentPercent] = useState(minDown);
  const [termMonths, setTermMonths] = useState(maxTerm);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const calculation = useMemo(() => {
    const downPayment = Math.round((carPrice * downPaymentPercent) / 100);
    const financedAmount = Math.max(0, carPrice - downPayment);
    const annualRate = Number(program.annual_interest_rate ?? 0);
    const payment = monthlyPayment(financedAmount, annualRate, termMonths);
    const schedule = buildSchedule(financedAmount, annualRate, termMonths);
    const totalPayment = schedule.reduce((sum, row) => sum + row.payment, 0);
    const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
    return { downPayment, financedAmount, payment, schedule, totalPayment, totalInterest, annualRate };
  }, [carPrice, downPaymentPercent, program.annual_interest_rate, termMonths]);

  return (
    <article className={`rounded-3xl border-2 bg-white p-4 shadow-sm transition ${selected ? "border-slate-950 shadow-md" : "border-slate-200"}`}>
      <button type="button" onClick={onSelect} disabled={!selectable} className="w-full text-left disabled:cursor-default" aria-pressed={selected}>
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50">
            {program.banks?.logo_url ? (
              <img src={program.banks.logo_url} alt={program.banks.name} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-xs font-black text-slate-500">BANK</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-black text-slate-950">{program.banks?.name ?? "Bank"}</p>
                <p className="text-sm font-semibold text-slate-600">{program.name}</p>
              </div>
              <span className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300"}`}>
                {selected ? "✓" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Foiz</p><p className="mt-1 font-black">{calculation.annualRate}%</p></div>
          <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Boshlang&apos;ich to&apos;lov</p><p className="mt-1 font-black">{Math.round(downPaymentPercent)}%</p></div>
          <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Muddat</p><p className="mt-1 font-black">{termLabel(termMonths)}</p></div>
        </div>
      </button>

      <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs text-slate-300">Hisoblangan oylik to&apos;lov</p>
        <p className="mt-1 text-2xl font-black">{formatPrice(calculation.payment, program.currency ?? currency)} / oy</p>
        <p className="mt-1 text-xs text-slate-300">Kredit summasi: {formatPrice(calculation.financedAmount, program.currency ?? currency)}</p>
      </div>

      <div className="mt-4 space-y-4">
        <label className="block">
          <div className="flex items-center justify-between gap-3 text-sm font-bold"><span>Boshlang&apos;ich to&apos;lov</span><span>{Math.round(downPaymentPercent)}% · {formatPrice(calculation.downPayment, program.currency ?? currency)}</span></div>
          <input type="range" min={minDown} max={maxDown || minDown} step="1" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Number(e.target.value))} className="mt-2 w-full accent-slate-950" />
          <div className="mt-1 flex justify-between text-xs text-slate-500"><span>{Math.round(minDown)}%</span><span>{Math.round(maxDown)}%</span></div>
        </label>
        <label className="block">
          <div className="flex items-center justify-between gap-3 text-sm font-bold"><span>Muddat</span><span>{termLabel(termMonths)}</span></div>
          <input type="range" min={minTerm} max={maxTerm} step="1" value={termMonths} onChange={(e) => setTermMonths(Number(e.target.value))} className="mt-2 w-full accent-slate-950" />
          <div className="mt-1 flex justify-between text-xs text-slate-500"><span>{termLabel(minTerm)}</span><span>{termLabel(maxTerm)}</span></div>
        </label>
      </div>

      <button type="button" onClick={() => setDetailsOpen((value) => !value)} className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black hover:bg-slate-50">{detailsOpen ? "Batafsil hisob-kitobni yopish" : "Batafsil hisob-kitob · oyma-oy jadval"}</button>

      {detailsOpen && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid gap-2 bg-slate-50 p-3 text-sm sm:grid-cols-3">
            <div><span className="text-slate-500">Boshlang&apos;ich:</span> <b>{formatPrice(calculation.downPayment, program.currency ?? currency)}</b></div>
            <div><span className="text-slate-500">Jami to&apos;lov:</span> <b>{formatPrice(calculation.totalPayment + calculation.downPayment, program.currency ?? currency)}</b></div>
            <div><span className="text-slate-500">Jami foiz:</span> <b>{formatPrice(calculation.totalInterest, program.currency ?? currency)}</b></div>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs uppercase text-slate-500 shadow-sm"><tr><th className="p-3">Oy</th><th className="p-3">To&apos;lov</th><th className="p-3">Asosiy qarz</th><th className="p-3">Foiz</th><th className="p-3">Qoldiq</th></tr></thead>
              <tbody>{calculation.schedule.map((row) => <tr key={row.month} className="border-t border-slate-100"><td className="p-3 font-semibold">{row.month}</td><td className="p-3">{formatPrice(row.payment, program.currency ?? currency)}</td><td className="p-3">{formatPrice(row.principal, program.currency ?? currency)}</td><td className="p-3">{formatPrice(row.interest, program.currency ?? currency)}</td><td className="p-3 font-semibold">{formatPrice(row.balance, program.currency ?? currency)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {program.description && <p className="mt-3 text-xs leading-5 text-slate-500">{program.description}</p>}
      {program.eligibility_notes && <p className="mt-2 text-xs leading-5 text-slate-500">{program.eligibility_notes}</p>}
      {program.source_url && <a href={program.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-bold underline">Rasmiy manba</a>}
    </article>
  );
}
