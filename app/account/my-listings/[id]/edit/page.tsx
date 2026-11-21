import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header, Footer } from "@/components/site-chrome";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";
import { getLocale } from "@/lib/locale";
import { updateMyUsedCarListingAction } from "@/app/avtobozor/actions";
import { UsedCarListingEditFields } from "@/components/used-car-listing-edit-fields";

export const dynamic = "force-dynamic";

export default async function EditUsedCarListingPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=%2Faccount%2Fmy-listings");
  const { id } = await params;
  const locale = await getLocale();
  const ru = locale === "ru";
  const db = createServiceRoleClient();
  const { data, error } = await db.from("used_car_listings").select("*").eq("id", id).eq("owner_profile_id", customer.id).maybeSingle();
  if (error) throw new Error("E'lon ma'lumotlarini yuklab bo'lmadi");
  if (!data) notFound();
  const input = (name: string, label: string, value: string | number | null, type = "text") => <label className="block text-sm font-semibold">{label}<input name={name} type={type} defaultValue={value ?? ""} required className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>;
  return <><Header/><main className="mx-auto max-w-4xl px-4 py-8"><Link href="/account/my-listings" className="text-sm font-semibold text-blue-700">← {ru ? "Мои объявления" : "Mening e'lonlarim"}</Link><h1 className="mt-3 text-3xl font-black">{ru ? "Редактировать объявление" : "E'lonni tahrirlash"}</h1><p className="mt-2 text-sm text-slate-500">{ru ? "После сохранения объявление будет повторно отправлено на модерацию." : "Saqlangandan so‘ng e’lon qayta moderatsiyaga yuboriladi."}</p>
  <form action={updateMyUsedCarListingAction} className="mt-6 grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
  <input type="hidden" name="listingId" value={data.id}/>
  <UsedCarListingEditFields brand={data.brand} model={data.model} color={data.color} ru={ru}/>{input("year",ru?"Год выпуска":"Ishlab chiqarilgan yil",data.year,"number")}{input("mileageKm",ru?"Пробег, км":"Yurgan masofasi, km",data.mileage_km,"number")}{input("price",ru?"Цена":"Narxi",data.price,"number")}
  <label className="block text-sm font-semibold">{ru?"Валюта":"Valyuta"}<select name="currency" defaultValue={data.currency} className="mt-1 w-full rounded-xl border p-3"><option value="UZS">UZS</option><option value="USD">USD</option></select></label>
  <label className="block text-sm font-semibold">{ru?"Страна производства":"Ishlab chiqarilgan mamlakat"}<select name="countryOfOrigin" required defaultValue={data.country_of_origin === "uzbekistan" || data.country_of_origin === "foreign" ? data.country_of_origin : ""} className="mt-1 w-full rounded-xl border p-3"><option value="" disabled>{ru?"Выберите страну":"Mamlakatni tanlang"}</option><option value="uzbekistan">{ru?"Узбекистан":"O‘zbekiston"}</option><option value="foreign">{ru?"Другая страна":"Chet el"}</option></select>{data.country_of_origin !== "uzbekistan" && data.country_of_origin !== "foreign" ? <span className="mt-1 block text-xs font-normal text-amber-700">{ru?"Это объявление создано до добавления поля. Выберите страну производства и сохраните изменения.":"Bu e’lon mamlakat maydoni qo‘shilishidan oldin yaratilgan. Avtomobil ishlab chiqarilgan mamlakatni tanlab, o‘zgarishlarni saqlang."}</span> : null}</label>
  {input("region",ru?"Регион":"Hudud",data.region)}{input("district",ru?"Район / город":"Tuman / shahar",data.district)}
  <label className="block text-sm font-semibold">{ru?"Кузов":"Kuzov"}<select name="bodyType" defaultValue={data.body_type ?? ""} className="mt-1 w-full rounded-xl border p-3"><option value="">—</option>{["Sedan","Hatchback","SUV","Crossover","Universal","Minivan","Coupe","Pickup"].map(v=><option key={v}>{v}</option>)}</select></label>
  <label className="block text-sm font-semibold">{ru?"Топливо":"Yoqilg‘i"}<select name="fuelType" defaultValue={data.fuel_type ?? ""} className="mt-1 w-full rounded-xl border p-3"><option value="">—</option>{["Benzin","Gaz","Benzin/Gaz","Dizel","Gibrid","Elektr"].map(v=><option key={v}>{v}</option>)}</select></label>
  <label className="block text-sm font-semibold">{ru?"Коробка передач":"Uzatmalar qutisi"}<select name="transmission" defaultValue={data.transmission ?? ""} className="mt-1 w-full rounded-xl border p-3"><option value="">—</option>{["Mexanika","Avtomat","CVT","Robot"].map(v=><option key={v}>{v}</option>)}</select></label>
  {input("engineVolume",ru?"Объём двигателя, л":"Dvigatel hajmi, litr",data.engine_volume,"number")}
  <label className="block text-sm font-semibold">{ru?"Состояние":"Holati"}<select name="vehicleCondition" defaultValue={data.vehicle_condition} className="mt-1 w-full rounded-xl border p-3">{[["ideal","Ideal"],["good","Yaxshi"],["minor_defects","Mayda kamchiliklar"],["body_repair","Kuzov ta'miri"],["major_repair","Jiddiy ta'mir"],["parts_only","Ehtiyot qismlar uchun"]].map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
  <label className="block text-sm font-semibold sm:col-span-2">{ru?"Описание состояния":"Avtomobil holati tavsifi"}<textarea name="conditionDescription" required minLength={10} maxLength={1200} defaultValue={data.condition_description} rows={3} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>
  <label className="block text-sm font-semibold sm:col-span-2">{ru?"Описание":"Qo‘shimcha tavsif"}<textarea name="description" required minLength={20} maxLength={5000} defaultValue={data.description} rows={5} className="mt-1 w-full rounded-xl border p-3 font-normal"/></label>
  {input("contactName",ru?"Имя продавца":"Sotuvchi ismi",data.contact_name)}
  <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="isNegotiable" defaultChecked={data.is_negotiable}/>{ru?"Торг уместен":"Savdolashish mumkin"}</label>
  <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2">{ru?"Текущие фотографии сохранятся. После изменения объявление будет проверено модератором.":"Mavjud rasmlar saqlanadi. O‘zgartirishdan so‘ng e’lon moderator tomonidan qayta tekshiriladi."}</p>
  <button className="rounded-full bg-blue-700 px-5 py-3 font-bold text-white sm:col-span-2">{ru?"Сохранить изменения":"O‘zgarishlarni saqlash"}</button>
  </form></main><Footer/></>;
}
