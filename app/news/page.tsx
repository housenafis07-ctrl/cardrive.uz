import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createServiceRoleClient } from "@/supabase/server";
import { getLocale } from "@/lib/locale";
import { newsSlug } from "@/lib/news-seo";
export const metadata:Metadata={
 title:"Avtomobil yangiliklari | Cardrive.uz",
 description:"O‘zbekiston va jahondagi avtomobil sanoati yangiliklari.",
 alternates:{canonical:"/news"},
 openGraph:{type:"website",url:"/news",title:"Avtomobil yangiliklari | Cardrive.uz",description:"O‘zbekiston va jahondagi avtomobil sanoati yangiliklari."},
 twitter:{card:"summary_large_image",title:"Avtomobil yangiliklari | Cardrive.uz",description:"O‘zbekiston va jahondagi avtomobil sanoati yangiliklari."}
};
type Article={id:string;source_url:string;source_name:string;title_uz:string;summary_uz:string|null;title_ru:string;summary_ru:string|null;title_en:string;summary_en:string|null;editorial_note_uz?:string|null;editorial_note_ru?:string|null;image_url:string|null;published_at:string|null;created_at:string};
export default async function NewsPage(){
 const locale=await getLocale();const col=locale==="ru"?"ru":"uz";const db=createServiceRoleClient();
 const primary=await db.from("news_articles").select("id,source_url,source_name,title_uz,summary_uz,title_ru,summary_ru,title_en,summary_en,editorial_note_uz,editorial_note_ru,image_url,published_at,created_at").eq("is_published",true).order("published_at",{ascending:false,nullsFirst:false}).limit(60);
 // Editorial SEO migratsiyasi staging'da hali bo'lmasa ham mavjud RSS yangiliklari ro'yxati bo'shab qolmasin.
 const fallback=primary.error?await db.from("news_articles").select("id,source_url,source_name,title_uz,summary_uz,title_ru,summary_ru,title_en,summary_en,image_url,published_at,created_at").eq("is_published",true).order("published_at",{ascending:false,nullsFirst:false}).limit(60):null;
 const articles=(primary.data??fallback?.data??[]) as Article[];const title=(a:Article)=>col==="ru"?a.title_ru:a.title_uz;const summary=(a:Article)=>col==="ru"?a.summary_ru:a.summary_uz;const note=(a:Article)=>col==="ru"?(a.editorial_note_ru||a.editorial_note_uz):a.editorial_note_uz;
 return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="mb-7"><p className="text-xs font-black uppercase tracking-widest text-sky-600">CARDRIVE NEWS</p><h1 className="mt-2 text-3xl font-black text-slate-950">{locale==="ru"?"Новости автопрома":"Avtomobil yangiliklari"}</h1><p className="mt-2 text-sm text-slate-500">{locale==="ru"?"Последние новости автомобильного рынка":"Avtomobil bozori va sanoatidagi so‘nggi yangiliklar"}</p></div>
 {articles.length?<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{articles.map(a=><article key={a.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{a.image_url?<Link href={`/news/${newsSlug(a.title_uz,a.id)}`}><div className="relative aspect-[16/9] bg-slate-100"><Image src={a.image_url} alt={title(a)} fill unoptimized className="object-cover"/></div></Link>:<div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200"/>}<div className="p-5"><p className="text-xs text-slate-500">{a.source_name} · {a.published_at?new Date(a.published_at).toLocaleDateString(locale==="ru"?"ru-RU":"uz-UZ"):""}</p><h2 className="mt-2 text-lg font-bold leading-snug text-slate-950"><Link href={`/news/${newsSlug(a.title_uz,a.id)}`} className="hover:text-sky-700">{title(a)}</Link></h2><p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{summary(a)}</p>{note(a)&&<p className="mt-3 line-clamp-2 text-xs font-medium text-sky-800">{locale==="ru"?"Комментарий Cardrive":"Cardrive izohi"}: {note(a)}</p>}<Link href={`/news/${newsSlug(a.title_uz,a.id)}`} className="mt-4 inline-flex text-sm font-bold text-sky-700 hover:underline">{locale==="ru"?"Читать новость":"Maqolani o‘qish"} →</Link></div></article>)}</div>:<div className="rounded-2xl border border-dashed p-12 text-center text-sm text-slate-500">{locale==="ru"?"Новости пока не загружены.":"Hozircha yangiliklar yuklanmagan."}</div>}
 </main>
}
