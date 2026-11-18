"use client";

import { useRef, useState } from "react";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import { createUsedCarListingAction } from "@/app/avtobozor/actions";
import type { Locale } from "@/lib/i18n";

export function UsedCarListingForm({ locale, isAuthenticated, error }: { locale: Locale; isAuthenticated: boolean; error?: string }) {
  const ru = locale === "ru";
  const formRef = useRef<HTMLFormElement>(null);
  const pendingForm = useRef<FormData | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [submitting, setSubmitting] = useState(false);

  async function submitListing(data: FormData) {
    setSubmitting(true);
    await createUsedCarListingAction(data);
    setSubmitting(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (authenticated) {
      void submitListing(data);
      return;
    }
    pendingForm.current = data;
    setShowAuth(true);
  }

  async function handleAuthenticated() {
    setAuthenticated(true);
    setShowAuth(false);
    if (pendingForm.current) {
      const data = pendingForm.current;
      pendingForm.current = null;
      await submitListing(data);
    }
  }

  return (
    <>
      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <form ref={formRef} onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
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
        <p className="col-span-full rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{ru ? "Номер телефона будет использован из подтверждённого аккаунта. Если вы ещё не зарегистрированы, подтверждение номера понадобится только после заполнения объявления. Объявление сначала проходит модерацию." : "Telefon raqamingiz tasdiqlangan akkauntingizdan olinadi. Ro'yxatdan o'tmagan bo'lsangiz, raqam faqat e'lon ma'lumotlarini to'ldirgandan keyin tasdiqlanadi. E'lon avval moderator tekshiruvidan o'tadi."}</p>
        <button disabled={submitting} className="col-span-full rounded-full bg-slate-950 px-5 py-3.5 font-bold text-white disabled:opacity-50">{submitting ? (ru ? "Отправка..." : "Yuborilmoqda...") : (ru ? "Отправить на модерацию" : "Moderatsiyaga yuborish")}</button>
      </form>
      {showAuth ? <section className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-black">{ru ? "Подтвердите номер для публикации" : "E'lonni yuborish uchun telefon raqamini tasdiqlang"}</h2><PhoneOtpAuth purpose="login" locale={locale} onAuthenticated={handleAuthenticated} title={ru ? "Вход или регистрация" : "Kirish yoki ro'yxatdan o'tish"} /></section> : null}
    </>
  );
}
