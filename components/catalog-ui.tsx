import Link from "next/link";
import { formatPrice, stockLabel } from "@/lib/formatters";

type Car = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  year: number;
  stock_status: string;
  is_featured: boolean;
  body_type?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  brands?: { name: string; slug?: string | null; logo_url?: string | null } | null;
  car_models?: { name: string } | null;
  car_images?: Array<{ public_url: string | null; alt_text: string | null; is_primary: boolean; sort_order: number }> | null;
};

function imageFor(car: Car) {
  return [...(car.car_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0]?.public_url;
}

function brandLogoFor(car: Car) {
  const url = car.brands?.logo_url?.trim();
  return url || null;
}

function chipLabel(value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const labels: Record<string, string> = {
    automatic: "Avtomat",
    manual: "Mexanika",
    petrol: "Benzin",
    gasoline: "Benzin",
    diesel: "Dizel",
    electric: "Elektr",
    hybrid: "Gibrid",
    sedan: "Sedan",
    suv: "SUV",
    crossover: "Krossover",
  };
  return labels[normalized.toLowerCase()] ?? normalized;
}

export function AvailabilityBadge({ status }: { status: string }) {
  const tone = status === "available" ? "bg-emerald-50 text-emerald-700" : status === "coming_soon" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700";
  return <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + tone}>{stockLabel(status)}</span>;
}

export function Price({ amount, currency }: { amount: number; currency: string }) {
  return <p className="text-2xl font-black tracking-tight text-slate-950">{formatPrice(amount, currency)}</p>;
}

export function CarCard({ car }: { car: Car }) {
  const image = imageFor(car);
  const logoUrl = brandLogoFor(car);
  const brandName = car.brands?.name ?? "";
  const chips = [chipLabel(car.transmission), chipLabel(car.fuel_type), chipLabel(car.body_type)].filter(Boolean) as string[];

  return (
    <Link href={"/cars/" + car.slug} className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
        {image ? (
          <img src={image} alt={car.car_images?.[0]?.alt_text ?? car.name} className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">Rasm tez orada</div>
        )}

        {logoUrl && (
          <div className="absolute left-4 top-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-md" title={brandName}>
            <img src={logoUrl} alt={brandName} className="h-full w-full object-contain" loading="eager" decoding="async" referrerPolicy="no-referrer" />
          </div>
        )}

        <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl leading-none text-slate-900 shadow-md" aria-hidden="true">♡</span>
      </div>

      <div className="space-y-3 p-5">
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, index) => (
              <span key={chip + index} className={`rounded-xl px-3 py-1.5 text-xs font-bold ${index === 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"}`}>{chip}</span>
            ))}
          </div>
        )}
        {brandName && <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{brandName}</p>}
        <h3 className="text-2xl font-black leading-tight text-slate-950">{car.name}</h3>
        <Price amount={car.price} currency={car.currency} />
        <div className="flex items-center gap-3 pt-1">
          <AvailabilityBadge status={car.stock_status} />
          <span className="text-sm font-semibold text-slate-500">{car.year}</span>
        </div>
      </div>
    </Link>
  );
}

export function CarGrid({ cars }: { cars: Car[] }) {
  return <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">{cars.map((car) => <CarCard key={car.slug} car={car} />)}</div>;
}

export function EmptyState({ title, actionHref = "/cars", action = "Filtrlarni tozalash" }: { title: string; actionHref?: string; action?: string }) {
  return <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-xl font-bold">{title}</h2><Link href={actionHref} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">{action}</Link></section>;
}

export function CatalogSkeleton() {
  return <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-96 animate-pulse rounded-3xl bg-slate-200" />)}</div>;
}
