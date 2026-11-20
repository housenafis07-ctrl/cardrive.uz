"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Item = { id: string; kind: "rate" | "news" | "announcement"; title_uz: string; title_ru: string | null; href: string | null; rate_value: number | null; rate_date: string | null };
export function AnnouncementTicker({ items, locale, usdRate }: { items: Item[]; locale: string; usdRate: { rate: number; rateDate: string } | null }) {
  const [index,setIndex]=useState(0);
  const messages:Item[]=[...(usdRate?[{id:"cbu-usd",kind:"rate" as const,title_uz:"",title_ru:null,href:null,rate_value:usdRate.rate,rate_date:usdRate.rateDate}]:[]),...items];
  useEffect(()=>{if(messages.length<2)return;const timer=window.setInterval(()=>setIndex(v=>(v+1)%messages.length),5200);return()=>window.clearInterval(timer)},[messages.length]);
  if(!messages.length)return null;
  const item=messages[index%messages.length]; const ru=locale==="ru";
  const content=item.kind==="rate"?<><b className="text-sky-300">USD / UZS</b><b className="text-white">1 USD = {new Intl.NumberFormat(ru?"ru-RU":"uz-UZ",{maximumFractionDigits:2}).format(item.rate_value??0)} UZS</b><span className="text-slate-400">{ru?"Официальный курс ЦБ РУз":"Markaziy bank rasmiy kursi"}</span></>:<><b className={item.kind==="news"?"text-sky-300":"text-amber-300"}>{item.kind==="news"?(ru?"НОВОСТЬ":"YANGILIK"):(ru?"ОБЪЯВЛЕНИЕ":"E’LON")}</b><span className="font-semibold text-white">{ru&&item.title_ru?item.title_ru:item.title_uz}</span></>;
  const body=<div key={item.id} className="flex min-w-0 items-center gap-3 whitespace-nowrap text-xs sm:text-sm">{content}</div>;
  return <div className="w-full border-b border-slate-800 bg-slate-950"><div className="mx-auto flex h-9 max-w-7xl items-center gap-3 overflow-hidden px-4 sm:px-5"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"/><div className="min-w-0 flex-1 overflow-hidden">{item.href?<Link href={item.href} className="block w-fit max-w-full overflow-hidden hover:underline">{body}</Link>:body}</div><div className="flex shrink-0 items-center gap-1"><button type="button" aria-label={ru?"Предыдущее":"Oldingi"} onClick={()=>setIndex(v=>(v-1+messages.length)%messages.length)} className="rounded px-1 text-slate-400 hover:bg-white/10">‹</button><span className="min-w-7 text-center text-[10px] tabular-nums text-slate-500">{index+1}/{messages.length}</span><button type="button" aria-label={ru?"Следующее":"Keyingi"} onClick={()=>setIndex(v=>(v+1)%messages.length)} className="rounded px-1 text-slate-400 hover:bg-white/10">›</button></div></div></div>;
}
