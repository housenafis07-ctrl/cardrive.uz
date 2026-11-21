/* eslint-disable react/no-unescaped-entities */
import { createServiceRoleClient } from "@/supabase/server";
import { moderateUsedCarListingAction, moderateUsedCarMediaAction } from "@/app/admin/used-listings/actions";

export const dynamic = "force-dynamic";

export default async function AdminUsedListingsPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const params = await searchParams;
  const db = createServiceRoleClient();
  const { data } = await db.from("used_car_listings")
    .select("id,brand,model,year,mileage_km,price,currency,region,engine_volume,vehicle_condition,condition_description,description,contact_name,contact_phone,created_at,used_car_listing_images(public_url,sort_order,is_primary)")
    .eq("status","pending_review").order("created_at",{ascending:true});
  const { data: mediaRows } = await db.from("used_car_listing_media")
    .select("id,listing_id,original_name,status,storage_path,created_at,used_car_listings(brand,model,year,status)")
    .in("status", ["pending_review", "approved"]).order("created_at", { ascending: false }).limit(100);
  const videos = await Promise.all((mediaRows ?? []).map(async media => {
    const signed = await db.storage.from("used-car-videos").createSignedUrl(media.storage_path, 15 * 60);
    return { ...media, signedUrl: signed.data?.signedUrl ?? null };
  }));
  return <div><h1 className="text-3xl font-black">Avtobozor — moderatsiya</h1><p className="mt-2 text-sm text-slate-500">Yangi e'lonlarni tekshiring. Faqat tasdiqlangan e'lonlar ommaviy katalogda ko'rinadi.</p>
    {params.error?<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</p>:null}
    {params.updated?<p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">E'lon holati yangilandi.</p>:null}
    <section className="mt-10 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Video moderatsiyasi ({videos.length})</h2>
      <p className="mt-1 text-sm text-slate-500">Faol va ko‘rib chiqilayotgan e’lonlarga biriktirilgan videolar. Fayl nomi, avtomobil va video mazmunini solishtirib tekshiring.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {videos.map(video => <article key={video.id} className="rounded-xl border p-3">
          <p className="font-bold">{(video.used_car_listings as {brand?:string;model?:string;year?:number}|null)?.brand} {(video.used_car_listings as {model?:string}|null)?.model} · {(video.used_car_listings as {year?:number}|null)?.year}</p>
          <p className="mt-1 break-all text-xs text-slate-500">{video.original_name}</p>
          {video.signedUrl ? <video src={video.signedUrl} controls playsInline preload="metadata" className="mt-3 aspect-video w-full rounded-lg bg-black"/> : <p className="mt-3 text-sm text-red-600">Videoni ochib bo‘lmadi</p>}
          <p className="mt-2 text-xs font-bold">Holat: {video.status} · E’lon: {(video.used_car_listings as {status?:string}|null)?.status ?? "topilmadi"}</p>
          <form action={moderateUsedCarMediaAction} className="mt-3 flex gap-2">
            <input type="hidden" name="mediaId" value={video.id}/>
            <button name="status" value="approved" className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Tasdiqlash</button>
            <button name="status" value="rejected" className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-700">Rad etish</button>
          </form>
        </article>)}
        {!videos.length ? <p className="text-sm text-slate-500">Moderatsiya uchun video yo‘q.</p> : null}
      </div>
    </section>
    <div className="mt-6 grid gap-5">{(data??[]).length?(data??[]).map(item=>{const images=[...(item.used_car_listing_images??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order);return <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="grid gap-4 md:grid-cols-[220px_1fr]"><div className="grid grid-cols-2 gap-2">{images.map(image=><img key={image.public_url} src={image.public_url} alt={item.brand+" "+item.model} className="aspect-[4/3] w-full rounded-lg object-cover"/>)}{!images.length?<div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-slate-100 text-4xl">🚘</div>:null}</div><div><h2 className="text-xl font-black">{item.brand} {item.model} · {item.year}</h2><p className="mt-1 font-bold">{Number(item.price).toLocaleString()} {item.currency} · {item.region} · {Number(item.mileage_km).toLocaleString()} km · Dvigatel: {item.engine_volume ?? "ko‘rsatilmagan"} L</p><p className="mt-2 text-sm text-slate-600">Sotuvchi: {item.contact_name} · {item.contact_phone}</p><div className="mt-3 rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Avtomobil holati · {item.vehicle_condition}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{item.condition_description}</p></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.description}</p><form action={moderateUsedCarListingAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><input type="hidden" name="listingId" value={item.id}/><input name="moderationNote" maxLength={500} placeholder="Rad etish sababi (ixtiyoriy)" className="rounded-lg border p-2 text-sm"/><button name="status" value="active" className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-bold text-white">Tasdiqlash</button><button name="status" value="rejected" className="rounded-full border border-red-300 px-5 py-2 text-sm font-bold text-red-700">Rad etish</button></form></div></div></article>}) : <p className="rounded-2xl border border-dashed p-12 text-center text-slate-500">Moderatsiya uchun yangi e'lonlar yo'q.</p>}</div>
  </div>;
}
