import Link from "next/link";
import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/site-chrome";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";
import { getLocale } from "@/lib/locale";
import { updateMyUsedCarListingStatusAction } from "@/app/avtobozor/actions";
import UsedCarListingVideoManager from "@/components/used-car-listing-video-manager";

export const dynamic = "force-dynamic";

export default async function MyUsedCarListingsPage({ searchParams }: { searchParams: Promise<{ submitted?: string; updated?: string; error?: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=%2Faccount%2Fmy-listings");
  const locale = await getLocale();
  const ru = locale === "ru";
  const params = await searchParams;
  const db = createServiceRoleClient();
  const { data } = await db.from("used_car_listings")
    .select("id,slug,brand,model,year,price,currency,status,expires_at,created_at,moderation_note,used_car_listing_images(public_url,sort_order,is_primary)")
    .eq("owner_profile_id", customer.id).order("created_at", { ascending: false });
  const status = (value: string, expiresAt?: string | null) => (["active", "archived"].includes(value) && expiresAt && new Date(expiresAt).getTime() <= Date.now()) ? (ru ? "Срок истёк" : "Muddati tugagan") : ({ pending_review:ru?"На модерации":"Moderatsiyada", active:ru?"Опубликовано":"E'lon faol", rejected:ru?"Отклонено":"Rad etilgan", reserved:ru?"Забронировано":"Band qilingan", sold:ru?"Продано":"Sotilgan", archived:ru?"В архиве":"Arxivda", draft:ru?"Черновик":"Qoralama" }[value] ?? value);
  return <><Header/><main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">{ru?"Мои объявления":"Mening e'lonlarim"}</h1><p className="mt-2 text-sm text-slate-500">{ru?"Управляйте объявлениями об автомобилях":"Avtomobil e'lonlaringizni boshqaring"}</p></div><Link href="/avtobozor/yangi-elon" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">{ru?"Подать объявление":"E'lon joylashtirish"} +</Link></div>
    {params.submitted?<p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{ru?"Объявление отправлено на модерацию.":"E'lon moderatsiyaga yuborildi."}</p>:null}
    {params.updated?<p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{ru?"Статус объявления обновлён.":"E'lon holati yangilandi."}</p>:null}
    {params.error?<p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</p>:null}
    <div className="mt-6 grid gap-4">{(data??[]).length?(data??[]).map(item=>{const image=[...(item.used_car_listing_images??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order)[0]?.public_url;return <article key={item.id} className="flex flex-col gap-4 rounded-2xl border bg-white p-4 sm:flex-row"><div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-40">{image?<img src={image} alt={item.brand+" "+item.model} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-4xl">🚘</div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{item.brand} {item.model} · {item.year}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{status(item.status, item.expires_at)}</span></div><p className="mt-2 font-bold text-blue-700">{new Intl.NumberFormat(ru?"ru-RU":"uz-UZ",{maximumFractionDigits:0}).format(Number(item.price))} {item.currency}</p>{item.moderation_note?<p className="mt-2 text-sm text-red-700">{item.moderation_note}</p>:null}{item.status==="active"?<><Link href={"/avtobozor/"+item.slug} className="mt-2 inline-block text-sm font-semibold text-blue-700 underline">{ru?"Открыть объявление":"E'lonni ko'rish"}</Link><Link href={'/account/my-listings/'+item.id+'/edit'} className="mt-2 ml-3 inline-block text-sm font-semibold text-emerald-700 underline">{ru?"Редактировать":"Tahrirlash"}</Link></>:null}</div><div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">{["active","reserved","rejected"].includes(item.status)?<><form action={updateMyUsedCarListingStatusAction}><input type="hidden" name="listingId" value={item.id}/><input type="hidden" name="status" value="sold"/><button className="rounded-full border px-3 py-2 text-xs font-bold">{ru?"Продано":"Sotildi"}</button></form><form action={updateMyUsedCarListingStatusAction}><input type="hidden" name="listingId" value={item.id}/><input type="hidden" name="status" value="archived"/><button className="rounded-full border px-3 py-2 text-xs font-bold">{ru?"В архив":"Arxivga"}</button></form></>:null}</div><UsedCarListingVideoManager listingId={item.id} ru={ru}/></article>}) : <div className="rounded-2xl border border-dashed p-12 text-center"><p className="text-3xl">🚗</p><p className="mt-3 font-bold">{ru?"У вас пока нет объявлений":"Hozircha e'lonlaringiz yo'q"}</p><Link href="/avtobozor/yangi-elon" className="mt-4 inline-block font-bold text-blue-700 underline">{ru?"Разместить первое объявление":"Birinchi e'lonni joylashtirish"}</Link></div>}</div>
  </main><Footer/></>;
}
