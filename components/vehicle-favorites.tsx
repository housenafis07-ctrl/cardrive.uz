"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export function VehicleViewTracker({ vehicle }: { vehicle: SavedVehicle }) {
  useEffect(() => {
    const current=read(RECENT_KEY).filter(item=>item.key!==vehicle.key);
    write(RECENT_KEY,[{...vehicle,savedAt:Date.now()},...current]);
  },[vehicle.key,vehicle.title,vehicle.href,vehicle.image,vehicle.price]);
  return null;
}

export function UsedCarDiscoverySections({ items, locale="uz" }: { items: SavedVehicle[]; locale?:"uz"|"ru" }) {
  const [recent,setRecent]=useState<SavedVehicle[]>([]);
  const [favorites,setFavorites]=useState<SavedVehicle[]>([]);
  useEffect(() => {
    const sync=()=>{setRecent(read(RECENT_KEY).filter(x=>x.type==="used"));setFavorites(read(FAVORITES_KEY));};
    sync();window.addEventListener("cardrive:vehicles-changed",sync);return()=>window.removeEventListener("cardrive:vehicles-changed",sync);
  },[]);
  const viewedBrands=new Set(recent.slice(0,5).map(x=>(x.brand||"").toLowerCase()).filter(Boolean));
  const recommendations=items.filter(x=>x.brand&&viewedBrands.has(x.brand.toLowerCase())&&!recent.some(r=>r.key===x.key)).slice(0,4);
  const sections=[
    {title:locale==="ru"?"Топ объявления":"Top e’lonlar",list:items.slice(0,4)},
    {title:locale==="ru"?"Рекомендуем вам":"Sizga tavsiya etamiz",list:recommendations.length?recommendations:items.slice(0,4)},
    {title:locale==="ru"?"Недавно просмотренные":"Oxirgi ko‘rilganlar",list:recent.slice(0,4)},
  ];
  return <div className="mb-8 space-y-6">{sections.map(section=><section key={section.title}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">{section.title}</h2><span className="text-xs text-slate-400">{section.list.length}</span></div>{section.list.length?<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{section.list.map(item=><Link key={item.key} href={item.href} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 hover:shadow-sm">{item.image?<img src={item.image} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover"/>:<span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100">🚘</span>}<span className="min-w-0"><span className="block truncate text-sm font-bold">{item.title}</span><span className="mt-1 block truncate text-xs text-blue-700">{item.price||""}</span></span></Link>)}</div>:<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{locale==="ru"?"Пока нет автомобилей для этого раздела":"Hozircha bu bo‘limda avtomobillar yo‘q"}</p>}</section>)}</div>;
}

export function SavedVehiclesPage({ locale="uz" }: { locale?:"uz"|"ru" }) {
  const [items,setItems]=useState<SavedVehicle[]>([]);
  useEffect(()=>{const sync=()=>setItems(read(FAVORITES_KEY));sync();window.addEventListener("cardrive:vehicles-changed",sync);return()=>window.removeEventListener("cardrive:vehicles-changed",sync);},[]);
  return <main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-black">{locale==="ru"?"Избранное":"Saqlangan avtomobillar"}</h1><p className="mt-2 text-sm text-slate-500">{locale==="ru"?"Сохранённые новые и подержанные автомобили":"Yangi va ishlatilgan avtomobillar bir joyda"}</p>{items.length?<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map(item=><article key={item.key} className="overflow-hidden rounded-2xl border bg-white"><Link href={item.href}>{item.image?<img src={item.image} alt="" className="aspect-[4/3] w-full object-cover"/>:<div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-5xl">🚘</div>}<div className="p-3"><h2 className="font-bold">{item.title}</h2><p className="mt-1 font-black text-blue-700">{item.price}</p></div></Link><button className="m-3 rounded-full border px-3 py-2 text-xs font-bold" onClick={()=>{write(FAVORITES_KEY,read(FAVORITES_KEY).filter(x=>x.key!==item.key));}}>{locale==="ru"?"Убрать":"Olib tashlash"}</button></article>)}</div>:<p className="mt-6 rounded-2xl border border-dashed p-10 text-center text-slate-500">{locale==="ru"?"Вы ещё не добавили автомобили в избранное":"Hali saqlangan avtomobillar yo‘q"}</p>}</main>;
}
