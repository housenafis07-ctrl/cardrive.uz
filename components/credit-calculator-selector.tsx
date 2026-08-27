"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/formatters";

type CalculatorCar = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  year: number;
  brandName: string;
  modelName: string;
};

type CalculatorProgram = {
  id: string;
  name: string;
  bankName: string;
  interestRate: number;
  downPaymentPercent: number;
  termMonths: number;
  currency: string;
};

export function CreditCalculatorSelector({
  cars,
  selectedCar,
  programs,
  locale = "uz",
}: {
  cars: CalculatorCar[];
  selectedCar: CalculatorCar | null;
  programs: CalculatorProgram[];
  locale?: "uz" | "ru";
}) {
  const router = useRouter();
  const [brand, setBrand] = useState(selectedCar?.brandName ?? "");
  const [model, setModel] = useState(selectedCar?.modelName ?? "");

  const labels = locale === "ru"
    ? { brand: "Марка", model: "Модель", modification: "Модификация", choose: "Выберите автомобиль", programs: "Доступные кредитные программы", noPrograms: "Для этого автомобиля сейчас нет доступных кредитных программ.", selectProgram: "Выберите банк и программу", open: "Рассчитать и открыть автомобиль →", price: "Цена", year: "Год", rate: "Ставка", down: "Первоначальный взнос", term: "Срок" }
    : { brand: "Brend", model: "Model", modification: "Modifikatsiya", choose: "Avtomobilni tanlang", programs: "Mavjud kredit dasturlari", noPrograms: "Ushbu avtomobil uchun hozircha faol kredit dasturi mavjud emas.", selectProgram: "Bank va kredit dasturini tanlang", open: "Hisoblash va avtomobilni ochish →", price: "Narx", year: "Yil", rate: "Foiz", down: "Boshlang‘ich to‘lov", term: "Muddat" };

  const brands = useMemo(() => [...new Set(cars.map((car) => car.brandName).filter(Boolean))].sort((a, b) => a.localeCompare(b, locale)), [cars, locale]);
  const models = useMemo(() => [...new Set(cars.filter((car) => car.brandName === brand).map((car) => car.modelName).filter(Boolean))].sort((a, b) => a.localeCompare(b, locale)), [cars, brand, locale]);
  const modifications = useMemo(() => cars.filter((car) => car.brandName === brand && car.modelName === model).sort((a, b) => a.name.localeCompare(b.name, locale)), [cars, brand, model, locale]);

  function selectModification(id: string) {
    if (!id) return;
    router.push(`/avtokredit/kalkulyator?carId=${encodeURIComponent(id)}`);
  }

  function selectProgram(program: CalculatorProgram) {
    if (!selectedCar) return;
    router.push(`/cars/${selectedCar.slug}?financingProgramId=${encodeURIComponent(program.id)}`);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-bold">{labels.brand}
            <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-950">
              <option value="">{labels.choose}</option>
              {brands.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">{labels.model}
            <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-950">
              <option value="">{labels.choose}</option>
              {models.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">{labels.modification}
            <select defaultValue={selectedCar?.id ?? ""} onChange={(e) => selectModification(e.target.value)} disabled={!model} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-950">
              <option value="">{labels.choose}</option>
              {modifications.map((car) => <option key={car.id} value={car.id}>{car.name} · {formatPrice(car.price, car.currency, locale)}</option>)}
            </select>
          </label>
        </div>
      </section>

      {selectedCar && (
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">{selectedCar.brandName} · {selectedCar.modelName}</p>
              <h2 className="mt-1 text-2xl font-black">{selectedCar.name}</h2>
            </div>
            <div className="text-right"><p className="text-xs text-slate-500">{labels.price}</p><p className="text-xl font-black">{formatPrice(selectedCar.price, selectedCar.currency, locale)}</p></div>
          </div>
        </section>
      )}

      {selectedCar && (
        <section>
          <h2 className="text-2xl font-black">{labels.programs}</h2>
          <p className="mt-2 text-sm text-slate-500">{labels.selectProgram}</p>
          {programs.length ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {programs.map((program) => (
                <button key={program.id} type="button" onClick={() => selectProgram(program)} className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-sm font-bold text-slate-500">{program.bankName}</p><h3 className="mt-1 text-lg font-black">{program.name}</h3></div><span className="text-lg transition group-hover:translate-x-1">→</span>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{labels.rate}</p><p className="mt-1 font-black">{program.interestRate}%</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{labels.down}</p><p className="mt-1 font-black">{program.downPaymentPercent}%</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{labels.term}</p><p className="mt-1 font-black">{program.termMonths} {locale === "ru" ? "мес." : "oy"}</p></div>
                  </div>
                  <span className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{labels.open}</span>
                </button>
              ))}
            </div>
          ) : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-600">{labels.noPrograms}</div>}
        </section>
      )}
    </div>
  );
}
