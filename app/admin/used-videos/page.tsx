import { createServiceRoleClient } from "@/supabase/server";
import { moderateUsedCarVideoAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsedVideosPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const params = await searchParams;
  const db = createServiceRoleClient();
  const { data, error } = await db.from("used_car_listing_media")
    .select("id,listing_id,owner_profile_id,storage_path,original_name,mime_type,size_bytes,created_at,used_car_listings(brand,model,year,price,currency,contact_name,contact_phone)")
    .eq("status", "pending_review").order("created_at", { ascending: true });
  const items = await Promise.all((data ?? []).map(async (item) => {
    const signed = await db.storage.from("used-car-videos").createSignedUrl(item.storage_path, 1800);
    return { ...item, previewUrl: signed.data?.signedUrl ?? null };
  }));
  return <div><h1 className="text-3xl font-black">Avtobozor — video moderatsiyasi</h1>
    <p className="mt-2 text-sm text-slate-500">Foydalanuvchilar yuklagan videolarni ko‘rib chiqing. Faqat tasdiqlangan videolar e’londa ko‘rsatiladi.</p>
    {params.error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</p> : null}
    {params.updated ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Video moderatsiya holati yangilandi.</p> : null}
    {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Videolarni yuklashda xatolik yuz berdi.</p> : null}
    <div className="mt-6 grid gap-5">{items.length ? items.map((item) => {
      const listing = Array.isArray(item.used_car_listings) ? item.used_car_listings[0] : item.used_car_listings;
      return <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)]">
          <div><h2 className="text-xl font-black">{listing ? listing.brand + " " + listing.model + " · " + listing.year : "E’lon"}</h2>
            {listing ? <p className="mt-1 text-sm text-slate-600">{Number(listing.price).toLocaleString()} {listing.currency} · {listing.contact_name} · {listing.contact_phone}</p> : null}
            <p className="mt-3 break-all text-sm font-semibold">{item.original_name}</p>
            <p className="mt-1 text-xs text-slate-500">{(item.size_bytes / 1024 / 1024).toFixed(1)} MB · {item.mime_type} · {new Date(item.created_at).toLocaleString("uz-UZ")}</p>
            <form action={moderateUsedCarVideoAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input type="hidden" name="mediaId" value={item.id}/>
              <input name="moderationNote" maxLength={500} placeholder="Rad etish sababi" className="rounded-lg border p-2 text-sm"/>
              <button name="status" value="approved" className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-bold text-white">Tasdiqlash</button>
              <button name="status" value="rejected" className="rounded-full border border-red-300 px-5 py-2 text-sm font-bold text-red-700">Rad etish</button>
            </form>
          </div>
          <div>{item.previewUrl ? <video src={item.previewUrl} controls preload="metadata" className="w-full rounded-xl bg-black"/> : <p className="rounded-xl bg-slate-100 p-8 text-sm text-slate-500">Videoni ko‘rish havolasini yaratib bo‘lmadi.</p>}</div>
        </div>
      </article>;
    }) : <p className="rounded-2xl border border-dashed p-12 text-center text-slate-500">Moderatsiya uchun yangi videolar yo‘q.</p>}</div>
  </div>;
}
