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
  fuel_type?: string | null;
  transmission?: string | null;
  engine_volume?: number | string | null;
  brands?: { name: string; logo_url?: string | null } | null;
  car_models?: { name: string } | null;
  car_images?: Array<{
    public_url: string | null;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
  }> | null;
};

function imageFor(car: Car) {
  return [...(car.car_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  )[0]?.public_url;
}

function brandLogoFor(car: Car) {
  return car.brands?.logo_url?.trim() || null;
}

function brandFallback(car: Car) {
  const name = car.brands?.name?.trim() || "?";
  return name.slice(0, 2).toUpperCase();
}

function bodyLabel(value: string | null | undefined) {
  if (!value) return null;
  const labels: Record<string, string> = {
    sedan: "Sedan",
    suv: "SUV",
    hatchback: "Hatchback",
    crossover: "Crossover",
    universal: "Universal",
    minivan: "Miniven",
    coupe: "Kupe",
    pickup: "Pikap",
  };
  return labels[value.toLowerCase()] ?? value;
}

function fuelLabel(value: string | null | undefined) {
  if (!value) return null;
  const labels: Record<string, string> = {
    petrol: "Benzin",
    gasoline: "Benzin",
    benzin: "Benzin",
    diesel: "Dizel",
    electric: "Elektro",
    hybrid: "Gibrid",
  };
  return labels[value.toLowerCase()] ?? value;
}

function transmissionLabel(value: string | null | undefined) {
  if (!value) return null;
  const labels: Record<string, string> = {
    manual: "Mexanika",
    mechanic: "Mexanika",
    mexanika: "Mexanika",
    automatic: "Avtomat",
    avtomat: "Avtomat",
    cvt: "CVT",
  };
  return labels[value.toLowerCase()] ?? value;
}

function engineLabel(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric % 1 === 0 ? numeric.toFixed(0) : numeric}L` : String(value);
}

export function AvailabilityBadge({ status }: { status: string }) {
  const tone =
    status === "available"
      ? "bg-emerald-50 text-emerald-700"
      : status === "coming_soon"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{stockLabel(status)}</span>;
}

export function Price({ amount, currency }: { amount: number; currency: string }) {
  return <p className="text-xl font-bold tracking-tight text-slate-950">{formatPrice(amount, currency)}</p>;
}

export function CarCard({ car }: { car: Car }) {
  const image = imageFor(car);
  const logoUrl = brandLogoFor(car);
  const brandName = car.brands?.name ?? "";
  const specs = [
    transmissionLabel(car.transmission),
    engineLabel(car.engine_volume),
    fuelLabel(car.fuel_type),
    bodyLabel(car.body_type),
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/cars/${car.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 sm:aspect-[16/10]">
        {image ? (
          <img
            src={image}
            alt={car.car_images?.[0]?.alt_text ?? `${brandName} ${car.name}`}
            className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-[1.02] sm:p-3"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
            Rasm tez orada
          </div>
        )}

        <div
          className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm sm:left-4 sm:top-4 sm:h-11 sm:w-11"
          title={brandName || "Brend"}
          aria-label={brandName || "Brend"}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              className="h-full w-full object-contain"
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-[10px] font-black uppercase text-slate-600">{brandFallback(car)}</span>
          )}
        </div>

        <span
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm backdrop-blur-sm sm:right-4 sm:top-4"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.9">
            <path d="M20.84 8.92c0 5.08-8.84 10.08-8.84 10.08S3.16 14 3.16 8.92A5.05 5.05 0 0 1 12 5.72a5.05 5.05 0 0 1 8.84 3.2Z" />
          </svg>
        </span>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {specs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
            {specs.map((spec, index) => (
              <span
                key={`${spec}-${index}`}
                className={
                  index === 0
                    ? "rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700"
                    : "whitespace-nowrap"
                }
              >
                {index > 0 && <span className="mr-1.5 text-slate-300">•</span>}
                {spec}
              </span>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{brandName}</p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">{car.name}</h3>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <Price amount={car.price} currency={car.currency} />
          <div className="flex items-center gap-2">
            <AvailabilityBadge status={car.stock_status} />
            <span className="text-sm font-medium text-slate-500">{car.year}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CarGrid({ cars }: { cars: Car[] }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{cars.map((car) => <CarCard key={car.slug} car={car} />)}</div>;
}

export function EmptyState({ title, actionHref = "/cars", action = "Filtrlarni tozalash" }: { title: string; actionHref?: string; action?: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <Link href={actionHref} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">{action}</Link>
    </section>
  );
}

export function CatalogSkeleton() {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />)}</div>;
}
