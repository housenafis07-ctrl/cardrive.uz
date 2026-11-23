import { AdminCard } from "@/components/admin-ui";
import { moderateNewsArticleAction, updateNewsEditorialAction } from "@/app/admin/news/actions";
import { createServiceRoleClient } from "@/supabase/server";

export const metadata = { title: "Yangiliklar moderatsiyasi | Cardrive Admin" };
type Article = { id:string; source_name:string; source_url:string; title_original:string; title_uz:string; title_ru:string; title_en:string; summary_uz:string|null; summary_ru:string|null; summary_en:string|null; editorial_note_uz:string|null; editorial_note_ru:string|null; image_url:string|null; published_at:string|null; created_at:string; is_featured:boolean; ticker_order:number };
const field="w-full rounded-lg border border-slate-300 p-2 text-sm";
export default async function AdminNewsPage({searchParams}:{searchParams:Promise<{error?:string;updated?:string}>}) {
 const params=await searchParams; const db=createServiceRoleClient();
 const [pending,published,rejected,sources,errors]=await Promise.all([
  db.from("news_articles").select("id",{count:"exact",head:true}).eq("moderation_status","pending"),
  db.from("news_articles").select("id",{count:"exact",head:true}).eq("moderation_status","approved"),
  db.from("news_articles").select("id",{count:"exact",head:true}).eq("moderation_status","rejected"),
  db.from("news_sources").select("id",{count:"exact",head:true}).eq("is_active",true),
  db.from("news_sources").select("id",{count:"exact",head:true}).eq("is_active",true).not("last_error","is",null)
 ]);
 const {data,error}=await db.from("news_articles").select("id,source_name,source_url,title_original,title_uz,title_ru,title_en,summary_uz,summary_ru,summary_en,editorial_note_uz,editorial_note_ru,image_url,published_at,created_at,is_featured,ticker_order").eq("moderation_status","pending").order("published_at",{ascending:false,nullsFirst:false}).limit(100);
 return <div className="mx-auto max-w-7xl space-y-6">
  <header><p className="text-xs font-black uppercase tracking-widest text-sky-600">CARDRIVE NEWS</p><h1 className="mt-2 text-3xl font-black">Yangiliklar moderatsiyasi</h1><p className="mt-2 text-sm text-slate-500">RSS materialini tahrirlang, Cardrive izohini qo‘shing va tasdiqlang. Tasdiqlangan maqolalar saytga chiqariladi.</p></header>
  {params.updated&&<p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Maqola saqlandi.</p>}{(params.error||error)&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error||error?.message}</p>}
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AdminCard label="Moderatsiyada" value={pending.count??0}/><AdminCard label="E’lon qilingan" value={published.count??0}/><AdminCard label="Rad etilgan" value={rejected.count??0}/><AdminCard label="Faol RSS manbalari" value={sources.count??0}/></div>
  <p className="text-xs text-slate-500">Xatolik qayd etgan faol manbalar: {errors.count??0}. <a className="font-bold text-sky-700 hover:underline" href="/admin/news-sources">RSS manbalari</a>.</p>
  <section className="space-y-4"><h2 className="font-black">Ko‘rib chiqilishi kerak bo‘lgan maqolalar ({data?.length??0})</h2>
   {data?.length?(data as Article[]).map(a=><article key={a.id} className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
    <div className="grid gap-4 lg:grid-cols-[1fr_220px]"><div><p className="text-xs font-bold text-sky-700">{a.source_name} · {a.published_at?new Date(a.published_at).toLocaleString("uz-UZ"):"Sana yo‘q"}</p><h3 className="mt-1 font-bold">{a.title_uz}</h3><p className="mt-1 text-xs text-slate-500">{a.title_original}</p><p className="mt-2 text-sm text-slate-600">{a.summary_uz}</p><a href={a.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-sky-700">Asl manbani ochish ↗</a></div>
     <div className="flex flex-col gap-2 text-xs text-slate-500"><span>Import: {new Date(a.created_at).toLocaleString("uz-UZ")}</span>{a.image_url&&<a href={a.image_url} target="_blank" rel="noreferrer" className="font-bold text-sky-700">Rasmni ko‘rish ↗</a>}<form action={moderateNewsArticleAction} className="mt-auto space-y-2"><input type="hidden" name="articleId" value={a.id}/><button name="status" value="approved" className="w-full rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white">Tasdiqlash</button><button name="status" value="rejected" className="w-full rounded-lg border border-red-200 px-3 py-2 font-bold text-red-700">Rad etish</button></form></div></div>
    <details className="rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer font-bold text-sm">Maqolani tahrirlash va Cardrive izohini qo‘shish</summary><form action={updateNewsEditorialAction} className="mt-3 grid gap-3 md:grid-cols-2"><input type="hidden" name="articleId" value={a.id}/>
     <label className="text-xs font-semibold">Sarlavha (o‘zbekcha)<input name="titleUz" required maxLength={240} defaultValue={a.title_uz} className={field}/></label>
     <label className="text-xs font-semibold">Sarlavha (ruscha)<input name="titleRu" required maxLength={240} defaultValue={a.title_ru} className={field}/></label>
     <label className="text-xs font-semibold md:col-span-2">Sarlavha (inglizcha)<input name="titleEn" required maxLength={240} defaultValue={a.title_en} className={field}/></label>
     <label className="text-xs font-semibold">Qisqa mazmun (UZ)<textarea name="summaryUz" rows={4} defaultValue={a.summary_uz??""} className={field}/></label>
     <label className="text-xs font-semibold">Qisqa mazmun (RU)<textarea name="summaryRu" rows={4} defaultValue={a.summary_ru??""} className={field}/></label>
     <label className="text-xs font-semibold md:col-span-2">Cardrive izohi / O‘zbekiston bozoriga ta’siri (UZ)<textarea name="editorialNoteUz" rows={4} maxLength={5000} defaultValue={a.editorial_note_uz??""} placeholder="Bu yangilik O‘zbekiston xaridorlari, narxlar yoki dilerlar uchun nimani anglatadi?" className={field}/></label>
     <label className="text-xs font-semibold md:col-span-2">Cardrive izohi (RU)<textarea name="editorialNoteRu" rows={3} maxLength={5000} defaultValue={a.editorial_note_ru??""} className={field}/></label>
     <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="isFeatured" defaultChecked={a.is_featured}/> Muhim maqola — lentada ustuvor</label>
     <label className="text-xs font-semibold">Lentadagi tartib<input name="tickerOrder" type="number" min="0" max="9999" defaultValue={a.ticker_order??100} className={field}/></label>
     <button className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white md:col-span-2">Tahrirni saqlash</button>
    </form></details>
   </article>):<p className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">Moderatsiya uchun yangi maqola yo‘q.</p>}
  </section>
 </div>;
}
