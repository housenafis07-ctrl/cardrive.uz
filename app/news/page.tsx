import Image from "next/image";
import { createServiceRoleClient } from "@/supabase/server";
import { getLocale } from "@/lib/locale";
export const metadata={title:"Avtomobil yangiliklari | Cardrive.uz",description:"O‘zbekiston va jahondagi avtomobil sanoati yangiliklari."};
type Article={id:string;source_url:string;source_name:string;title_uz:string;summary_uz:string|null;title_ru:string;summary_ru:string|null;title_en:string;summary_en:string|null;image_url:string|null;published_at:string|null;created_at:string};
export default async function NewsPage(){
 const locale=await getLocale();const col=locale==="ru"?"ru":"uz";
 const {data}=await createServiceRoleClient().from("news_articles").select("*").eq("is_published",true).order("published_at",{ascending:false,nullsFirst:false}).limit(60);
 const articles=(data??[]) as Article[];
 const title=(a:Article)=>col==="ru"?a.title_ru:a.title_uz;
 const summary=(a:Article)=>col==="ru"?a.summary_ru:a.summary_uz;
 return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="mb-7"><p className="text-xs font-black uppercase tracking-widest text-sky-600">CARDRIVE NEWS</p><h1 className="mt-2 text-3xl font-black text-slate-950">{locale==="ru"?"Новости автопрома":"Avtomobil yangiliklari"}</h1><p className="mt-2 text-sm text-slate-500">{locale==="ru"?"Последние новости автомобильного рынка":"Avtomobil bozori va sanoatidagi so‘nggi yangiliklar"}</p></div>
 {articles.length?<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{articles.map(a=><article key={a.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{a.image_url?<a href={a.source_url} target="_blank" rel="noopener noreferrer"><div className="relative aspect-[16/9] bg-slate-100"><Image src={a.image_url} alt={title(a)} fill unoptimized className="object-cover"/></div></a>:<div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200"/>}<div className="p-5"><p className="text-xs text-slate-500">{a.source_name} · {a.published_at?new Date(a.published_at).toLocaleDateString(locale==="ru"?"ru-RU":"uz-UZ"):""}</p><h2 className="mt-2 text-lg font-bold leading-snug text-slate-950">{title(a)}</h2><p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{summary(a)}</p><a href={a.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-bold text-sky-700 hover:underline">{locale==="ru"?"Источник и оригинал":"Asl manba"} ↗</a></div></article>)}</div>:<div className="rounded-2xl border border-dashed p-12 text-center text-sm text-slate-500">{locale==="ru"?"Новости пока не загружены.":"Hozircha yangiliklar yuklanmagan."}</div>}
 </main>
}
