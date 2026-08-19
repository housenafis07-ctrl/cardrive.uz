"use client";

import { useEffect, useRef } from "react";
import { CarCard } from "@/components/catalog-ui";
import type { FormatterLocale } from "@/lib/formatters";

type Car = Parameters<typeof CarCard>[0]["car"];

export function HomeCarCarousel({ cars, locale = "uz" }: { cars: Car[]; locale?: FormatterLocale }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const move = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(280, Math.floor(el.clientWidth / (window.innerWidth >= 1280 ? 4 : window.innerWidth >= 640 ? 2 : 1)) + 20);
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (direction === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (direction === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  useEffect(() => {
    timer.current = setInterval(() => move(1), 5000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  return <div className="relative px-1">
    <button type="button" aria-label={locale === "ru" ? "Предыдущие автомобили" : "Oldingi avtomobillar"} onClick={() => move(-1)} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur hover:bg-white">←</button>
    <div ref={ref} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-9 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cars.map(car => <div key={car.slug} className="w-[calc(100vw-5rem)] shrink-0 snap-start sm:w-[calc((100vw-8rem)/2)] xl:w-[calc((100vw-12rem)/4)] xl:max-w-[300px]"><CarCard car={car} locale={locale}/></div>)}
    </div>
    <button type="button" aria-label={locale === "ru" ? "Следующие автомобили" : "Keyingi avtomobillar"} onClick={() => move(1)} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur hover:bg-white">→</button>
  </div>;
}
