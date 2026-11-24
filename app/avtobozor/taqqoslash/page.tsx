import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { getLocale } from "@/lib/locale";
import { createPublicServerClient } from "@/supabase/public-server";

export const dynamic = "force-dynamic";

export default async function UsedCarComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const [{ ids: rawIds }, locale] = await Promise.all([searchParams, getLocale()]);
  const ru = locale === "ru";
  const ids = [...new Set((rawIds || "").split(",").filter((id) => /^[0-9a-f-]{36}$/i.test(id)))].slice(0, 4);
  const db = createPublicServerClient();
  const { data } = ids.length >= 2 ? await db.from("used_car_listings")
    .select("id,slug,brand,model,year,mileage_km,price,currency,region,district,body_type,fuel_type,transmission,engine_volume,color,vehicle_condition,description,used_car_listing_images(public_url,sort_order,is_primary)")
    .in("id", ids).eq("status", "active").gt("expires_at", new Date().toISOString()) : { data: [] };
  const rows = (data || []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  const fields: Array<[string, (row: (typeof rows)[number]) => string]> = [
    [ru ? "Год выпуска" : "Ishlab chiqarilgan yil", (row) => String(row.year)],
    [ru ? "Пробег" : "Yurgan masofasi", (row) => Number(row.mileage_km).toLocaleString(ru ? "ru-RU" : "uz-UZ") + " km"],
    [ru ? "Цена" : "Narxi", (row) => new Intl.NumberFormat(ru ? "ru-RU" : "uz-UZ").format(Number(row.price)) + (row.currency === "USD" ? " $" : " so‘m")],
    [ru ? "Регион" : "Hudud", (row) => [row.region, row.district].filter(Boolean).join(", ") || "—"],
    [ru ? "Тип кузова" : "Kuzov turi", (row) => row.body_type || "—"],
    [ru ? "Топливо" : "Yoqilg‘i", (row) => row.fuel_type || "—"],
    [ru ? "Коробка передач" : "Uzatmalar qutisi", (row) => row.transmission || "—"],
    [ru ? "Объём двигателя" : "Dvigatel hajmi", (row) => row.engine_volume ? row.engine_volume + " L" : "—"],
    [ru ? "Цвет" : "Rang", (row) => row.color || "—"],
    [ru ? "Состояние" : "Holati", (row) => row.vehicle_condition || "—"],
  ];

  return <><Header /><main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6">
    <Link href="/avtobozor" className="text-sm font-semibold text-blue-700">← {ru ? "Назад в авторынок" : "Avtobozorga qaytish"}</Link>
    <h1 className="mt-4 text-3xl font-black">{ru ? "Сравнение автомобилей" : "Avtomobillarni taqqoslash"}</h1>
    <p className="mt-2 text-sm text-slate-500">{ru ? "Сравните характеристики выбранных объявлений" : "Tanlangan e’lonlarning texnik xususiyatlari va narxlarini yonma-yon solishtiring"}</p>
    {rows.length >= 2 ? <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead><tr className="bg-slate-50"><th className="sticky left-0 z-10 min-w-36 border-b p-3">{ru ? "Характеристика" : "Ko‘rsatkich"}</th>{rows.map((row) => {
          const image = [...(row.used_car_listing_images || [])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order)[0]?.public_url;
          return <th key={row.id} className="min-w-48 border-b p-3 align-top"><Link href={"/avtobozor/"+row.slug} className="block">{image ? <img src={image} alt="" className="mb-3 aspect-[16/10] w-full rounded-xl object-cover"/> : <div className="mb-3 flex aspect-[16/10] items-center justify-center rounded-xl bg-slate-100 text-4xl">🚘</div>}<span className="font-black text-slate-900">{row.brand} {row.model} · {row.year}</span></Link></th>;
        })}</tr></thead>
        <tbody>{fields.map(([label, getValue]) => <tr key={label} className="border-b last:border-0"><th className="sticky left-0 bg-white p-3 font-semibold text-slate-500">{label}</th>{rows.map((row) => <td key={row.id} className="p-3 font-semibold text-slate-900">{getValue(row)}</td>)}</tr>)}</tbody>
      </table>
    </div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center"><p className="font-bold">{ru ? "Для сравнения выберите минимум два активных объявления." : "Taqqoslash uchun kamida ikkita faol e’lon tanlang."}</p><Link href="/avtobozor" className="mt-4 inline-flex rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white">{ru ? "Выбрать автомобили" : "Avtomobillarni tanlash"}</Link></div>}
  </main><Footer /></>;
}
