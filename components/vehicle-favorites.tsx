"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UsedCarFinancingBadge } from "@/components/used-car-financing-badge";
import type { UsedCarBestCredit } from "@/lib/used-car-financing";
import { VEHICLE_BRANDS } from "@/lib/vehicle-catalog";

export type SavedVehicle = {
  key: string;
  type: "new" | "used";
  title: string;
  href: string;
  image?: string | null;
  price?: string;
  brand?: string;
  model?: string;
  year?: number;
  views?: number;
  credit?: UsedCarBestCredit | null;
  sellerType?: "private" | "dealer" | null;
  savedAt?: number;
};

const FAVORITES_KEY = "cardrive:saved-vehicles:v1";
const RECENT_KEY = "cardrive:recent-vehicles:v1";
const read = (key: string): SavedVehicle[] => {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
};
const write = (key: string, items: SavedVehicle[]) => {
  try { localStorage.setItem(key, JSON.stringify(items.slice(0, 100))); window.dispatchEvent(new Event("cardrive:vehicles-changed")); } catch {}
};

export function VehicleFavoriteButton({ vehicle, locale="uz" }: { vehicle: SavedVehicle; locale?:"uz"|"ru" }) {
  const [saved,setSaved] = useState(false);
  useEffect(() => { setSaved(read(FAVORITES_KEY).some(item=>item.key===vehicle.key)); },[vehicle.key]);
  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault(); event.stopPropagation();
    const current=read(FAVORITES_KEY), exists=current.some(item=>item.key===vehicle.key);
    write(FAVORITES_KEY, exists?current.filter(item=>item.key!==vehicle.key):[{...vehicle,savedAt:Date.now()},...current]);
    setSaved(!exists);
  }
  return <button type="button" onClick={toggle} aria-label={saved?(locale==="ru"?"Убрать из избранного":"Saqlanganlardan olib tashlash"):(locale==="ru"?"В избранное":"Saqlanganlarga qo‘shish")} aria-pressed={saved} className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl shadow-md transition hover:scale-105">
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${saved?"fill-rose-500 stroke-rose-500":"fill-none stroke-slate-700"}`} strokeWidth="1.8" aria-hidden="true"><path d="M20.8 8.8c0 5.1-8.8 10.2-8.8 10.2S3.2 13.9 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </button>;
}

export function VehicleViewTracker({ vehicle, listingId, initialViews = 0, locale = "uz" }: { vehicle: SavedVehicle; listingId?: string; initialViews?: number; locale?: "uz" | "ru" }) {
  const [views, setViews] = useState(initialViews);
  useEffect(() => {
    const current = read(RECENT_KEY).filter(item => item.key !== vehicle.key);
    write(RECENT_KEY, [{ ...vehicle, savedAt: Date.now() }, ...current]);
    if (!listingId) return;
    let cancelled = false;
    fetch("/api/avtobozor/views", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }), cache: "no-store",
    }).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (!cancelled && Number.isFinite(Number(data.viewCount))) setViews(Number(data.viewCount));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [vehicle, listingId]);
  if (!listingId) return null;
  return <p className="mt-2 text-xs font-medium text-slate-500" aria-live="polite">◉ {views.toLocaleString(locale === "ru" ? "ru-RU" : "uz-UZ")} {locale === "ru" ? "просмотров" : "ko‘rish"}</p>;
}

function DiscoveryCard({ item, locale }: { item: SavedVehicle; locale: "uz" | "ru" }) {
  const brand = VEHICLE_BRANDS.find(entry => entry.name.toLowerCase() === (item.brand ?? "").toLowerCase());
  const sellerLabel = locale === "ru"
    ? (item.sellerType === "dealer" ? "Автосалон" : "Частное лицо")
    : (item.sellerType === "dealer" ? "Avtosalon" : "Jismoniy shaxs");
  return <article className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
      {item.image ? <Link href={item.href} aria-label={item.title} className="block h-full w-full"><img src={item.image} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]"/></Link> : <Link href={item.href} className="flex h-full items-center justify-center text-4xl">🚘</Link>}
      <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-800 shadow-sm">{sellerLabel}</span>
      <span className="absolute bottom-2 left-2 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {brand?.logo ? <img src={brand.logo} alt={item.brand ?? ""} className="h-full w-full object-contain"/> : <span className="text-[10px] font-black">{(item.brand ?? "🚘").slice(0,2).toUpperCase()}</span>}
      </span>
      <VehicleFavoriteButton locale={locale} vehicle={item}/>
    </div>
    <Link href={item.href} className="block p-2 sm:p-3">
      <span className="block truncate text-xs font-bold text-slate-900 sm:text-sm">{item.title}</span>
      <span className="mt-1 block truncate text-sm font-black text-blue-700">{item.price||""}</span>
      {item.credit ? <span className="mt-2 block"><UsedCarFinancingBadge offer={item.credit} locale={locale} compact/></span> : null}
    </Link>
  </article>;
}

export function UsedCarDiscoverySections({ items, locale="uz" }: { items: SavedVehicle[]; locale?:"uz"|"ru" }) {
  const [recent,setRecent]=useState<SavedVehicle[]>([]);
  useEffect(() => {
    const sync=()=>{setRecent(read(RECENT_KEY).filter(x=>x.type==="used"));};
    sync();window.addEventListener("cardrive:vehicles-changed",sync);return()=>window.removeEventListener("cardrive:vehicles-changed",sync);
  },[]);
  const viewedBrands=new Set(recent.slice(0,5).map(x=>(x.brand||"").toLowerCase()).filter(Boolean));
  const recommendations=items.filter(x=>x.brand&&viewedBrands.has(x.brand.toLowerCase())&&!recent.some(r=>r.key===x.key)).slice(0,4);
  const top=[...items].sort((a,b)=>(b.views??0)-(a.views??0)).slice(0,4);
  const fallbackRecommendations=items.filter(x=>!top.some(t=>t.key===x.key)).slice(0,4);
  const enrichedRecent=recent.map(item=>{const current=items.find(candidate=>candidate.key===item.key);return current?.credit?{...item,credit:current.credit}:item;});
  const sections=[
    {key:"top",title:locale==="ru"?"Популярные объявления":"Top e’lonlar",list:top},
    {key:"recommended",title:locale==="ru"?"Похожие вам":"Sizga tavsiya etamiz",list:recommendations.length?recommendations:fallbackRecommendations},
    {key:"recent",title:locale==="ru"?"Недавно просмотренные":"Oxirgi ko‘rilganlar",list:enrichedRecent.slice(0,4)},
  ];
  return <div className="mb-8 space-y-7">{sections.map(section=>section.list.length?<section key={section.key}>
    <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black tracking-tight sm:text-xl">{section.title}</h2><span className="text-xs font-semibold text-slate-400">{section.list.length}</span></div>
    <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3 xl:grid-cols-4">{section.list.map(item=><DiscoveryCard key={item.key} item={item} locale={locale}/>)}</div>
  </section>:null)}</div>;
}

export function SavedVehiclesPage({ locale="uz" }: { locale?:"uz"|"ru" }) {
  const [items,setItems]=useState<SavedVehicle[]>([]);
  useEffect(()=>{const sync=()=>setItems(read(FAVORITES_KEY));sync();window.addEventListener("cardrive:vehicles-changed",sync);return()=>window.removeEventListener("cardrive:vehicles-changed",sync);},[]);
  return <main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-black">{locale==="ru"?"Избранное":"Saqlangan avtomobillar"}</h1><p className="mt-2 text-sm text-slate-500">{locale==="ru"?"Сохранённые новые и подержанные автомобили":"Yangi va ishlatilgan avtomobillar bir joyda"}</p>{items.length?<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map(item=><article key={item.key} className="overflow-hidden rounded-2xl border bg-white"><Link href={item.href}>{item.image?<img src={item.image} alt="" className="aspect-[4/3] w-full object-cover"/>:<div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-5xl">🚘</div>}<div className="p-3"><h2 className="font-bold">{item.title}</h2><p className="mt-1 font-black text-blue-700">{item.price}</p></div></Link><button className="m-3 rounded-full border px-3 py-2 text-xs font-bold" onClick={()=>{write(FAVORITES_KEY,read(FAVORITES_KEY).filter(x=>x.key!==item.key));}}>{locale==="ru"?"Убрать":"Olib tashlash"}</button></article>)}</div>:<p className="mt-6 rounded-2xl border border-dashed p-10 text-center text-slate-500">{locale==="ru"?"Вы ещё не добавили автомобили в избранное":"Hali saqlangan avtomobillar yo‘q"}</p>}</main>;
}
