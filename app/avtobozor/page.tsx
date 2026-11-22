import Link from "next/link";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/site-chrome";
import { getLocale } from "@/lib/locale";
import { createPublicServerClient } from "@/supabase/public-server";
import { normalizeSearchText, searchRelevance } from "@/features/catalog/search-utils";
import { CollapsibleFilters } from "@/components/collapsible-filters";
import { FinancingService } from "@/services/financing-service";
import { getBestUsedCarCredit } from "@/lib/used-car-financing";
import { UsedCarFinancingBadge } from "@/components/used-car-financing-badge";
import { VehicleFavoriteButton, UsedCarDiscoverySections, type SavedVehicle } from "@/components/vehicle-favorites";
import { VEHICLE_BRANDS } from "@/lib/vehicle-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Avtobozor — Avtomobil sotib olish va sotish | Cardrive.uz",
  description: "O'zbekistonda avtomobil sotib oling yoki soting. Hudud, narx, yil, probeg va texnik xususiyatlar bo'yicha qidiring.",
  alternates: { canonical: "/avtobozor" },
};

const money = (value: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "uz-UZ", { maximumFractionDigits: 0 }).format(value) + (currency === "USD" ? " $" : " so'm");

export default async function AvtobozorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();
  const ru = locale === "ru";
  const raw = await searchParams;
  const value = (key: string) => typeof raw[key] === "string" ? String(raw[key]).trim() : "";
  const db = createPublicServerClient();
  let query = db.from("used_car_listings")
    .select("id,slug,brand,model,year,mileage_km,price,currency,country_of_origin,region,body_type,fuel_type,transmission,seller_type,is_negotiable,created_at,view_count,used_car_listing_images(public_url,sort_order,is_primary)", { count: "exact" })
    .eq("status", "active").gt("expires_at", new Date().toISOString());
  const selectedBrand = VEHICLE_BRANDS.find(item => item.name.toLowerCase() === value("brand").toLowerCase());
  const q = value("q").replace(/[^\p{L}\p{N} .-]/gu, " ").trim();
  const normalizedQ = normalizeSearchText(q);
  // Search both brand and model after Latin/Cyrillic normalization; typo tolerance is ranked below.

  if (value("brand")) query = query.ilike("brand", value("brand"));
  if (value("model")) query = query.ilike("model", value("model"));
  if (value("region")) query = query.eq("region", value("region"));
  if (value("fuel")) query = query.eq("fuel_type", value("fuel"));
  if (value("transmission")) query = query.eq("transmission", value("transmission"));
  if (value("body")) query = query.eq("body_type", value("body"));
  if (value("currency") === "USD" || value("currency") === "UZS") query = query.eq("currency", value("currency"));
  if ((value("currency") === "USD" || value("currency") === "UZS") && value("minPrice") && Number.isFinite(Number(value("minPrice")))) query = query.gte("price", Number(value("minPrice")));
  if ((value("currency") === "USD" || value("currency") === "UZS") && value("maxPrice") && Number.isFinite(Number(value("maxPrice")))) query = query.lte("price", Number(value("maxPrice")));
  if (value("mileageFrom") && Number.isFinite(Number(value("mileageFrom")))) query = query.gte("mileage_km", Number(value("mileageFrom")));
  if (value("mileageTo") && Number.isFinite(Number(value("mileageTo")))) query = query.lte("mileage_km", Number(value("mileageTo")));
  if (value("yearFrom") && Number.isFinite(Number(value("yearFrom")))) query = query.gte("year", Number(value("yearFrom")));
  if (value("yearTo") && Number.isFinite(Number(value("yearTo")))) query = query.lte("year", Number(value("yearTo")));
  const sort = value("sort");
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else if (sort === "year_desc") query = query.order("year", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const page = Math.max(1, Math.min(1000, Number(value("page")) || 1));
  const { data, count, error } = normalizedQ
    ? await query.range(0, 499)
    : await query.range((page - 1) * 12, page * 12 - 1);
  const rankedListings = normalizedQ
    ? (data ?? []).map(item => ({ item, score: searchRelevance(q, [item.brand, item.model]) }))
        .filter(entry => entry.score >= 0.68)
        .sort((a, b) => b.score - a.score || new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime())
        .map(entry => entry.item)
    : null;
  const listings = rankedListings ? rankedListings.slice((page - 1) * 12, page * 12) : data ?? [];
  const financingService = new FinancingService();
  const listingsWithCredit = await Promise.all(listings.map(async item => {
    const result = await financingService.getBankCreditProgramsForUsedCar(Number(item.price), item.currency, {
      year: Number(item.year),
      origin: item.country_of_origin ?? "",
      fuelType: item.fuel_type ?? null,
      brand: item.brand,
    });
    return { ...item, bestCredit: getBestUsedCarCredit(result.data ?? [], Number(item.price), item.currency, locale) };
  }));
  const resultCount = rankedListings ? rankedListings.length : count ?? 0;
  const discoveryItems: SavedVehicle[] = (data ?? []).map(item => { const photo=[...(item.used_car_listing_images??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order)[0]?.public_url; return { key:"used:"+item.id,type:"used",title:item.brand+" "+item.model+" · "+item.year,href:"/avtobozor/"+item.slug,image:photo,price:money(Number(item.price),item.currency,locale),brand:item.brand,model:item.model,year:Number(item.year),views:Number(item.view_count??0) }; });
  const topListings = listingsWithCredit;
  const totalPages = Math.max(1, Math.ceil(resultCount / 12));
  const params = new URLSearchParams();
  for (const key of ["q","brand","model","region","fuel","transmission","body","currency","minPrice","maxPrice","mileageFrom","mileageTo","yearFrom","yearTo","sort"]) if (value(key)) params.set(key, value(key));
  const pageHref = (n: number) => { const p = new URLSearchParams(params); p.set("page", String(n)); return "/avtobozor?" + p.toString(); };
  const labels = ru
    ? { title:"Авторынок", sub:"Покупайте и продавайте автомобили по всему Узбекистану", add:"Подать объявление", search:"Поиск марки или модели", region:"Регион", all:"Все регионы", fuel:"Топливо", transmission:"Коробка", body:"Кузов", priceMin:"Цена от", priceMax:"Цена до", currency:"Валюта", mileageFrom:"Пробег от", mileageTo:"Пробег до", yearFrom:"Год от", yearTo:"Год до", sort:"Сортировка", newest:"Сначала новые", cheap:"Сначала дешевле", expensive:"Сначала дороже", apply:"Найти", found:"объявлений", mileage:"Пробег", seller:"Частное лицо", dealer:"Автосалон", noResults:"Объявлений по вашему запросу пока нет", error:"Не удалось загрузить объявления" }
    : { title:"Avtobozor", sub:"O‘zbekiston bo‘ylab avtomobil sotib oling va soting", add:"E'lon joylashtirish", search:"Brend yoki modelni qidiring", region:"Hudud", all:"Barcha hududlar", fuel:"Yoqilg‘i", transmission:"Uzatmalar qutisi", body:"Kuzov", priceMin:"Narxdan", priceMax:"Narxgacha", currency:"Valyuta", mileageFrom:"Probegdan", mileageTo:"Probeggacha", yearFrom:"Yildan", yearTo:"Yilgacha", sort:"Saralash", newest:"Avval yangilari", cheap:"Avval arzonlari", expensive:"Avval qimmatlari", apply:"Qidirish", found:"ta e'lon", mileage:"Yurgan masofasi", seller:"Jismoniy shaxs", dealer:"Avtosalon", noResults:"Qidiruvingiz bo‘yicha e'lon topilmadi", error:"E'lonlarni yuklab bo‘lmadi" };
  const regions = ["Toshkent shahri","Toshkent viloyati","Andijon","Buxoro","Farg'ona","Jizzax","Xorazm","Namangan","Navoiy","Qashqadaryo","Qoraqalpog'iston","Samarqand","Sirdaryo","Surxondaryo"];
  return <><Header marketplace="used"/><main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">CARDRIVE MARKETPLACE</p><h1 className="mt-2 text-4xl font-black tracking-tight">{labels.title}</h1><p className="mt-2 text-slate-600">{labels.sub}</p></div><Link href="/avtobozor/yangi-elon" className="marketplace-cta marketplace-cta--blue rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg">{labels.add} +</Link></div>
    <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside><CollapsibleFilters title={ru ? "Фильтры" : "Filtrlar"}><form action="/avtobozor" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input name="q" defaultValue={value("q")} placeholder={labels.search} className="rounded-xl border p-3 text-sm"/>
        <select name="brand" defaultValue={value("brand")} className="rounded-xl border p-3 text-sm"><option value="">{ru?"Все марки":"Barcha brendlar"}</option>{VEHICLE_BRANDS.filter(item=>item.slug!=="other").map(item=><option key={item.slug} value={item.name}>{item.name}</option>)}</select>
        <select name="model" defaultValue={value("model")} className="rounded-xl border p-3 text-sm"><option value="">{ru?"Все модели":"Barcha modellar"}</option>{(selectedBrand?.models ?? VEHICLE_BRANDS.filter(item=>item.slug!=="other").flatMap(item=>item.models)).map(model=><option key={model} value={model}>{model}</option>)}</select>
        <select name="region" defaultValue={value("region")} className="rounded-xl border p-3 text-sm"><option value="">{labels.all}</option>{regions.map(r=><option key={r}>{r}</option>)}</select>
        <div className="grid grid-cols-2 gap-2"><input name="minPrice" type="number" defaultValue={value("minPrice")} placeholder={labels.priceMin} className="min-w-0 rounded-xl border p-3 text-sm"/><input name="maxPrice" type="number" defaultValue={value("maxPrice")} placeholder={labels.priceMax} className="min-w-0 rounded-xl border p-3 text-sm"/></div>
        <select name="currency" defaultValue={value("currency")} className="rounded-xl border p-3 text-sm"><option value="">{ru?"Любая валюта":"Barcha valyutalar"}</option><option value="USD">USD ($)</option><option value="UZS">UZS (so‘m)</option></select>
        <div className="grid grid-cols-2 gap-2"><input name="mileageFrom" type="number" min="0" defaultValue={value("mileageFrom")} placeholder={labels.mileageFrom} className="min-w-0 rounded-xl border p-3 text-sm"/><input name="mileageTo" type="number" min="0" defaultValue={value("mileageTo")} placeholder={labels.mileageTo} className="min-w-0 rounded-xl border p-3 text-sm"/></div>
        <div className="grid grid-cols-2 gap-2"><input name="yearFrom" type="number" defaultValue={value("yearFrom")} placeholder={labels.yearFrom} className="min-w-0 rounded-xl border p-3 text-sm"/><input name="yearTo" type="number" defaultValue={value("yearTo")} placeholder={labels.yearTo} className="min-w-0 rounded-xl border p-3 text-sm"/></div>
        <select name="fuel" defaultValue={value("fuel")} className="rounded-xl border p-3 text-sm"><option value="">{labels.fuel}</option>{["Benzin","Gaz","Benzin/Gaz","Dizel","Gibrid","Elektr"].map(v=><option key={v}>{v}</option>)}</select>
        <select name="transmission" defaultValue={value("transmission")} className="rounded-xl border p-3 text-sm"><option value="">{labels.transmission}</option>{["Mexanika","Avtomat","CVT","Robot"].map(v=><option key={v}>{v}</option>)}</select>
        <select name="body" defaultValue={value("body")} className="rounded-xl border p-3 text-sm"><option value="">{labels.body}</option>{["Sedan","Hatchback","SUV","Crossover","Universal","Minivan","Coupe","Pickup"].map(v=><option key={v}>{v}</option>)}</select>
        <select name="sort" defaultValue={sort} className="rounded-xl border p-3 text-sm"><option value="newest">{labels.newest}</option><option value="price_asc">{labels.cheap}</option><option value="price_desc">{labels.expensive}</option></select>
        <button className="rounded-full bg-blue-700 px-4 py-3 text-sm font-bold text-white">{labels.apply}</button>
        <Link href="/avtobozor" className="text-center text-xs font-semibold text-slate-500 underline">{ru?"Сбросить":"Filtrlarni tozalash"}</Link>
      </form></CollapsibleFilters></aside>
      <section>
        <UsedCarDiscoverySections items={discoveryItems} locale={locale}/>
        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{labels.error}</p> : listings.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{topListings.map(item=>{const images=[...(item.used_car_listing_images??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order);const image=images[0]?.public_url;const title=item.brand+" "+item.model+" · "+item.year;return <article key={item.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"><div className="relative aspect-[4/3] bg-slate-100">{image?<img src={image} alt={item.brand+" "+item.model} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-5xl">🚘</div>}<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold">{item.seller_type==="dealer"?labels.dealer:labels.seller}</span><span className="absolute left-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-xl border bg-white p-1 shadow">{VEHICLE_BRANDS.find(b=>b.name.toLowerCase()===item.brand.toLowerCase())?.logo?<img src={VEHICLE_BRANDS.find(b=>b.name.toLowerCase()===item.brand.toLowerCase())!.logo} alt={item.brand} className="h-full w-full object-contain"/>:<span className="text-xs font-black">{item.brand.slice(0,2).toUpperCase()}</span>}</span><VehicleFavoriteButton locale={locale} vehicle={{key:"used:"+item.id,type:"used",title,href:"/avtobozor/"+item.slug,image,price:money(Number(item.price),item.currency,locale),brand:item.brand,model:item.model,year:Number(item.year)}}/></div><Link href={"/avtobozor/"+item.slug} className="block p-4"><h2 className="font-black">{title}</h2><p className="mt-2 text-lg font-black text-blue-700">{money(Number(item.price),item.currency,locale)}</p><div className="mt-3"><UsedCarFinancingBadge offer={item.bestCredit} locale={locale}/></div><div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600"><span className="rounded-md bg-slate-100 px-2 py-1">{Number(item.mileage_km).toLocaleString(locale==="ru"?"ru-RU":"uz-UZ")} km</span>{item.transmission?<span className="rounded-md bg-slate-100 px-2 py-1">{item.transmission}</span>:null}{item.fuel_type?<span className="rounded-md bg-slate-100 px-2 py-1">{item.fuel_type}</span>:null}</div><p className="mt-2 text-xs text-slate-500">{item.region}</p></Link></article>})}</div> : <div className="rounded-2xl border border-dashed p-12 text-center"><p className="text-3xl">🚗</p><p className="mt-3 font-bold">{labels.noResults}</p><Link href="/avtobozor/yangi-elon" className="mt-4 inline-block font-bold text-blue-700 underline">{labels.add}</Link></div>}
        {totalPages>1?<nav className="mt-8 flex items-center justify-center gap-3"><Link aria-disabled={page<=1} className="rounded-lg border px-4 py-2" href={pageHref(Math.max(1,page-1))}>{ru?"Назад":"Oldingi"}</Link><span className="text-sm text-slate-600">{page} / {totalPages}</span><Link aria-disabled={page>=totalPages} className="rounded-lg border px-4 py-2" href={pageHref(Math.min(totalPages,page+1))}>{ru?"Далее":"Keyingi"}</Link></nav>:null}
      </section>
    </div>
    <p className="mt-12 rounded-2xl bg-slate-50 p-5 text-xs leading-6 text-slate-600">{ru?"Cardrive предоставляет площадку для размещения объявлений и не является стороной договора купли-продажи. Проверяйте документы и техническое состояние автомобиля. Оформление сделки проводится в соответствии с законодательством Узбекистана.":"Cardrive e'lon joylashtirish platformasi bo'lib, oldi-sotdi shartnomasining tomoni hisoblanmaydi. Avtomobil hujjatlari va texnik holatini mustaqil tekshiring. Bitim O‘zbekiston qonunchiligiga muvofiq rasmiylashtiriladi."}</p>
  </main><Footer/></>;
}
