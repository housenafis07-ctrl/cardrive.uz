import Image from "next/image";
import Link from "next/link";
import type { FinancingSummary } from "@/repositories/catalog-repository";

type CarCardProps = {
  car: {
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    year: number;
    body_type?: string | null;
    fuel_type?: string | null;
    transmission?: string | null;
    engine_volume?: number | null;
    brands?: { name: string; logo_url?: string | null } | null;
    car_models?: { name: string } | null;
    car_images?: { public_url: string | null; alt_text: string | null; is_primary: boolean; sort_order: number }[] | null;
    financing?: FinancingSummary;
  };
};

const money = new Intl.NumberFormat("uz-UZ");
const fuelLabel: Record<string, string> = { petrol: "BENZIN", gasoline: "BENZIN", electric: "ELEKTR", diesel: "DIZEL", hybrid: "GIBRID", benzin: "BENZIN", elektr: "ELEKTR", dizel: "DIZEL", gibrid: "GIBRID" };
const typeLabel = (type: FinancingSummary extends infer F ? F extends { financingType: infer T } ? T : never : never) => type === "credit_installment" ? "KREDIT · RASSROCHKA" : type === "installment" ? "RASSROCHKA" : "KREDIT";

export function CarCard({ car }: CarCardProps) {
  const image = car.car_images?.slice().sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0]?.public_url ?? "/placeholder-car.jpg";
  const fuel = fuelLabel[String(car.fuel_type ?? "").toLowerCase()] ?? car.fuel_type?.toUpperCase();
  const financing = car.financing;
  return (
    <article className="group overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
      <Link href={`/cars/${car.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <Image src={image} alt={car.car_images?.[0]?.alt_text ?? car.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
          {financing && <div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-slate-950/90 px-3 py-1.5 text-[10px] font-extrabold tracking-[.08em] text-white backdrop-blur">{typeLabel(financing.financingType)}</span>{fuel && <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-extrabold tracking-[.08em] text-slate-800 shadow-sm">{fuel}</span>}</div>}
          {financing && financing.downPaymentPercent > 0 && <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-black tracking-[.08em] text-white shadow-sm">AVANS {Math.round(financing.downPaymentPercent)}%</span>}
        </div>
        <div className="p-5">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{car.brands?.name ?? ""}</div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-950">{car.name}</h3>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-500"><span>{car.transmission ?? ""}</span><span>{car.engine_volume ? `${car.engine_volume} L` : ""}</span>{fuel && <span>{fuel}</span>}<span>{car.body_type ?? ""}</span></div>
          {financing ? <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3.5"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Eng qulay taklif</div><div className="mt-0.5 text-[21px] font-black tracking-tight text-slate-950">{money.format(financing.monthlyPayment)} <span className="text-sm font-bold text-slate-500">so‘mdan / oyiga</span></div><div className="mt-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500"><span>{financing.providerName}</span><span>{financing.termMonths} oy</span></div></div> : <div className="mt-5 text-lg font-black text-slate-950">{money.format(car.price)} {car.currency}</div>}
        </div>
      </Link>
    </article>
  );
}
