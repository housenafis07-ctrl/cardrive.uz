import type { Metadata } from "next";
import { Header, Footer } from "@/components/site-chrome";
import { CreditCalculatorSelector } from "@/components/credit-calculator-selector";
import { CatalogService } from "@/services/catalog-service";
import { FinancingService } from "@/services/financing-service";
import { getLocale } from "@/lib/locale";

type Params = { carId?: string };

export const metadata: Metadata = {
  title: "Kredit kalkulyatori — avtomobil krediti | Cardrive.uz",
  description: "Brend, model va modifikatsiyani tanlang. Shu avtomobil uchun faol bank kredit dasturlarini ko‘ring va mos dastur orqali avtomobil sahifasiga o‘ting.",
  alternates: { canonical: "/avtokredit/kalkulyator" },
};

export default async function CreditCalculatorPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const locale = await getLocale();
  const ru = locale === "ru";
  const params = searchParams ? await searchParams : {};
  const [carsResult] = await Promise.all([new CatalogService().getCalculatorCars()]);
  const rawCars = carsResult.data ?? [];
  const cars = rawCars.map((car: any) => {
    const brand = Array.isArray(car.brands) ? car.brands[0] : car.brands;
    const model = Array.isArray(car.car_models) ? car.car_models[0] : car.car_models;
    return { id: car.id, slug: car.slug, name: car.name, price: Number(car.price), currency: car.currency, year: Number(car.year), brandName: brand?.name ?? "", modelName: model?.name ?? "" };
  }).sort((a: any, b: any) => a.brandName.localeCompare(b.brandName, locale) || a.modelName.localeCompare(b.modelName, locale) || a.name.localeCompare(b.name, locale));
  const selectedCar = params.carId ? cars.find((car) => car.id === params.carId) ?? null : null;
  const programsResult = selectedCar ? await new FinancingService().getApplicableProgramsForCar(selectedCar.id) : { data: [] as any[] };
  const programs = (programsResult.data ?? []).map((program: any) => {
    const rules = Array.isArray(program.financing_program_rules) ? program.financing_program_rules.filter((rule: any) => rule.is_available !== false) : [];
    const rule = rules.slice().sort((a: any, b: any) => Number(a.annual_interest_rate) - Number(b.annual_interest_rate) || Number(a.down_payment_percent) - Number(b.down_payment_percent) || Number(b.term_months) - Number(a.term_months))[0];
    return { id: program.id, name: ru ? program.name_ru ?? program.name : program.name_uz ?? program.name, bankName: ru ? program.banks?.name_ru ?? program.banks?.name ?? "Diler" : program.banks?.name ?? "Diler", interestRate: Number(rule?.annual_interest_rate ?? program.annual_interest_rate ?? 0), downPaymentPercent: Number(rule?.down_payment_percent ?? program.min_down_payment_percent ?? 0), termMonths: Number(rule?.term_months ?? program.max_term_months ?? program.min_term_months ?? 0), currency: program.currency };
  });
  return <><Header /><main className="mx-auto max-w-7xl px-5 py-10"><div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-wide text-amber-600">CARDRIVE.UZ</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{ru ? "Кредитный калькулятор автомобиля" : "Avtomobil krediti kalkulyatori"}</h1><p className="mt-4 text-lg leading-8 text-slate-600">{ru ? "Выберите марку, модель и модификацию. Система покажет только действующие банковские программы, доступные для выбранного автомобиля." : "Brend, model va modifikatsiyani tanlang. Tizim aynan shu avtomobil uchun faol va ruxsat etilgan bank kredit dasturlarini ko‘rsatadi."}</p></div><div className="mt-8"><CreditCalculatorSelector cars={cars} selectedCar={selectedCar} programs={programs} locale={locale} /></div></main><Footer /></>;
}
