"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CompareVehicle = { id: string; slug: string; title: string; price: string };
const STORAGE_KEY = "cardrive:used-car-compare:v1";

function readIds(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

export function UsedCarCompareButton({ vehicle, locale = "uz" }: { vehicle: CompareVehicle; locale?: "uz" | "ru" }) {
  const [ids, setIds] = useState<string[]>([]);
  const ru = locale === "ru";

  useEffect(() => {
    const sync = () => setIds(readIds());
    sync();
    window.addEventListener("cardrive:compare-changed", sync);
    return () => window.removeEventListener("cardrive:compare-changed", sync);
  }, []);

  const selected = ids.includes(vehicle.id);
  function toggle() {
    const next = selected ? ids.filter((id) => id !== vehicle.id) : [...ids, vehicle.id].slice(-4);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIds(next);
    window.dispatchEvent(new Event("cardrive:compare-changed"));
  }

  const compareHref = "/avtobozor/taqqoslash?ids=" + encodeURIComponent(ids.join(","));
  return (
    <div className="mt-3 space-y-2">
      <button type="button" onClick={toggle} className="w-full rounded-full border border-blue-200 px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50" aria-pressed={selected}>
        {selected ? (ru ? "Убрать из сравнения" : "Taqqoslashdan olib tashlash") : (ru ? "Добавить к сравнению" : "Taqqoslashga qo‘shish")}
      </button>
      {ids.length >= 2 ? (
        <Link href={compareHref} className="block w-full rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-bold text-white hover:bg-slate-800">
          {ru ? `Сравнить автомобили (${ids.length})` : `Avtomobillarni taqqoslash (${ids.length})`}
        </Link>
      ) : (
        <p className="text-center text-xs text-slate-500">{ru ? "Выберите ещё один автомобиль для сравнения" : "Taqqoslash uchun yana bitta avtomobil tanlang"}</p>
      )}
      <span className="sr-only">{vehicle.title} · {vehicle.price}</span>
    </div>
  );
}
