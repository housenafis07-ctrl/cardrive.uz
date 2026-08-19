"use client";

import type { FormatterLocale } from "@/lib/formatters";

type Fuel = "petrol" | "gasoline" | "benzin" | "diesel" | "electric" | "hybrid";

const labels = {
  uz: { petrol: "BENZIN", gasoline: "BENZIN", benzin: "BENZIN", diesel: "DIZEL", electric: "ELEKTR", hybrid: "GIBRID" },
  ru: { petrol: "БЕНЗИН", gasoline: "БЕНЗИН", benzin: "БЕНЗИН", diesel: "ДИЗЕЛЬ", electric: "ЭЛЕКТРО", hybrid: "ГИБРИД" },
} as const;

export function FuelBadge({ fuelType, locale = "uz" }: { fuelType?: string | null; locale?: FormatterLocale }) {
  const key = fuelType?.toLowerCase() as Fuel | undefined;
  const label = key ? labels[locale][key] : undefined;
  if (!label) return null;
  return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-amber-800">{label}</span>;
}
