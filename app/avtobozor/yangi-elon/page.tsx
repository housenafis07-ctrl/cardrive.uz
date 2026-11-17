import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getLocale } from "@/lib/locale";
import { AccountLoginGate } from "@/components/account-login-gate";
import { createUsedCarListingAction } from "@/app/avtobozor/actions";

export const metadata = { title: "Avtobozor — E'lon joylashtirish | Cardrive.uz" };

export default async function NewUsedCarListingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const locale = await getLocale();
  const ru = locale === "ru";
  const customer = await getCurrentCustomer();
  const params = await searchParams;
  return <><Header /><main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <Link href="/avtobozor" className="text-sm font-semibold text-blue-700">← {ru ? "Авторынок" : "Avtobozor"}</Link>
    <h1 className="mt-3 text-3xl font-black">{ru ? "Разместить объявление" : "Avtomobil e'lonini joylashtirish"}</h1>
    <p className="mt-2 text-slate-600">{ru ? "Заполните данные автомобиля. После проверки модератором объявление появится в каталоге." : "Avtomobil ma'lumotlarini kiriting. Moderator tekshiruvidan so'ng e'lon Avtobozorda ko'rinadi."}</p>
    {!customer ? <div className="mt-6 rounded-2xl border p-5"><AccountLoginGate locale={locale} /></div> : <>
      {params.error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(params.error)}</p> : null}
      <form action={createUsedCarListingAction} className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <h2 className="col-span-full text-lg font-black">{ru ? "Основная информация" : "Asosiy ma'lumotlar"}</h2>
        <label className="text-sm font-semibold">{ru ? "Марка" : "Brend"} *<input name="brand" required maxLength={80} placeholder="Chevrolet" className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="text-sm font-semibold">{ru ? "Модель" : "Model"} *<input name="model" required maxLength={100} placeholder="Cobalt" className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="text-sm font-semibold">{ru ? "Год выпуска" : "Ishlab chiqarilgan yil"} *<input name="year" type="number" min="1950" max={new Date().getFullYear()+1} required className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="text-sm font-semibold">{ru ? "Пробег, км" : "Yurgan masofasi, km"} *<input name="mileageKm" type="number" min="0" max="2000000" required className="mt-1 w-full rounded-xl border p-3" /></label>
        <div className="grid grid-cols-[1fr_110px] gap-2">
          <label className="text-sm font-semibold">{ru ? "Цена" : "Narxi"} *<input name="price" type="number" min="1" step="any" required className="mt-1 w-full rounded-xl border p-3" /></label>
          <label className="text-sm font-semibold">{ru ? "Валюта" : "Valyuta"}<select name="currency" className="mt-1 w-full rounded-xl border p-3"><option value="UZS">UZS</option><option value="USD">USD</option></select></label>
        </div>
        <label className="text-sm font-semibold">{ru ? "Регион" : "Hudud"} *<select name="region" required className="mt-1 w-full rounded-xl border p-3"><option value="">{ru ? "Выберите" : "Tanlang"}</option>{["Toshkent shahri","Toshkent viloyati","Andijon","Buxoro","Farg'ona","Jizzax","Xorazm","Namangan","Navoiy","Qashqadaryo","Qoraqalpog'iston","Samarqand","Sirdaryo","Surxondaryo"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label className="text-sm font-semibold">{ru ? "Район / город" : "Tuman / shahar"}<input name="district" maxLength={80} className="mt-1 w-full rounded-xl border p-3" /></label>
        <h2 className="col-span-full mt-2 text-lg font-black">{ru ? "Характеристики" : "Texnik xususiyatlar"}</h2>
        <label className="text-sm font-semibold">{ru ? "Тип кузова" : "Kuzov turi"}<select name="bodyType" className="mt-1 w-full rounded-xl border p-3"><option value="">—</option>{["Sedan","Hatchback","SUV","Crossover","Universal","Minivan","Coupe","Pickup"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="text-sm font-semibold">{ru ? "Топливо" : "Yoqilg'i"}<select name="fuelType" className="mt-1 w-full rounded-xl border p-3"><option value="">—</option>{["Benzin","Gaz","Benzin/Gaz","Dizel","Gibrid","Elektr"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="text-sm font-semibold">{ru ? "Коробка передач" : "Uzatmalar qutisi"}<select name="transmission" className="mt-1 w-full rounded-xl border p-3"><option value="">—</option>{["Mexanika","Avtomat","CVT","Robot"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="text-sm font-semibold">{ru ? "Объём двигателя, л" : "Dvigatel hajmi, litr"}<input name="engineVolume" type="number" min="0" max="20" step="0.1" className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="text-sm font-semibold">{ru ? "Цвет" : "Rangi"}<input name="color" maxLength={40} className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="col-span-full text-sm font-semibold">{ru ? "Описание" : "Tavsif"} *<textarea name="description" required minLength={20} maxLength={5000} rows={5} className="mt-1 w-full rounded-xl border p-3" placeholder={ru ? "Состояние, комплектация, история обслуживания..." : "Holati, komplektatsiyasi, texnik xizmat tarixi..."} /></label>
        <label className="col-span-full text-sm font-semibold">{ru ? "Фотографии (до 8, JPG/PNG/WEBP, до 8 МБ каждая)" : "Rasmlar (8 tagacha, JPG/PNG/WEBP, har biri 8 MB gacha)"}<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-2 block w-full rounded-xl border p-3 text-sm" /></label>
        <label className="col-span-full flex items-center gap-2 text-sm"><input type="checkbox" name="isNegotiable" defaultChecked />{ru ? "Возможен торг" : "Savdolashish mumkin"}</label>
        <label className="col-span-full text-sm font-semibold">{ru ? "Имя продавца" : "Sotuvchi ismi"} *<input name="contactName" required maxLength={100} className="mt-1 w-full rounded-xl border p-3" /></label>
        <p className="col-span-full rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{ru ? "Телефон будет взят из подтверждённого аккаунта. Не публикуйте паспортные данные. Объявление сначала проходит модерацию." : "Telefon raqami tasdiqlangan akkauntingizdan olinadi. Pasport ma'lumotlarini kiritmang. E'lon avval moderator tekshiruvidan o'tadi."}</p>
        <button className="col-span-full rounded-full bg-slate-950 px-5 py-3.5 font-bold text-white">{ru ? "Отправить на модерацию" : "Moderatsiyaga yuborish"}</button>
      </form>
    </>}
  </main><Footer /></>;
}
