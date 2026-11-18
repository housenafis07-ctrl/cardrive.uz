"use client";

import { useRef, useState } from "react";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import { createUsedCarListingAction } from "@/app/avtobozor/actions";
import type { Locale } from "@/lib/i18n";

type VehicleCondition = {
  value: string;
  uz: string;
  ru: string;
  uzTemplate: string;
  ruTemplate: string;
};

const conditions: VehicleCondition[] = [
  {
    value: "ideal",
    uz: "Ideal holat",
    ru: "Идеальное состояние",
    uzTemplate: "Avtomobil ideal holatda. Kuzov va salonda ko'zga tashlanadigan nuqsonlar yo'q. Texnik holati yaxshi.",
    ruTemplate: "Автомобиль в идеальном состоянии. Видимых дефектов кузова и салона нет. Техническое состояние хорошее.",
  },
  {
    value: "good",
    uz: "Yaxshi holat",
    ru: "Хорошее состояние",
    uzTemplate: "Avtomobilda foydalanish bilan bog'liq tabiiy izlar bor. Jiddiy shikastlanishlar mavjud emas.",
    ruTemplate: "Есть естественные следы эксплуатации. Серьёзных повреждений нет.",
  },
  {
    value: "minor_defects",
    uz: "Mayda kamchiliklari bor",
    ru: "Есть небольшие недостатки",
    uzTemplate: "Kuzovda mayda botiqlar, tirnalishlar yoki foydalanish izlari mavjud. Avtomobil yurish holatida.",
    ruTemplate: "Есть небольшие вмятины, царапины или следы эксплуатации. Автомобиль на ходу.",
  },
  {
    value: "body_repair",
    uz: "Kuzov ta'miri kerak",
    ru: "Требуется ремонт кузова",
    uzTemplate: "Ayrim kuzov qismlarida ta'mirlash ishlari talab etiladi. Aniqlangan nuqsonlar tavsifda ko'rsatiladi.",
    ruTemplate: "Некоторые элементы кузова требуют ремонта. Выявленные дефекты указаны в описании.",
  },
  {
    value: "major_repair",
    uz: "Jiddiy ta'mir talab etiladi",
    ru: "Требуется серьёзный ремонт",
    uzTemplate: "Avtomobil harakatlanishi uchun ta'mir talab etiladi. Dvigatel, uzatmalar qutisi yoki yurish qismida muammolar bo'lishi mumkin.",
    ruTemplate: "Для эксплуатации автомобиля требуется ремонт. Возможны проблемы с двигателем, коробкой передач или ходовой частью.",
  },
  {
    value: "parts_only",
    uz: "Ehtiyot qismlar uchun",
    ru: "Только на запчасти",
    uzTemplate: "Avtomobil asosan ehtiyot qismlar uchun taklif qilinadi. Ta'mirlash qiymati avtomobil qiymatining 50 foizidan yuqori bo'lishi mumkin.",
    ruTemplate: "Автомобиль предлагается преимущественно на запчасти. Стоимость ремонта может превышать 50% стоимости автомобиля.",
  },
];

const colors = [
  { value: "Oq", ru: "Белый", hex: "#f8fafc", border: true },
  { value: "Qora", ru: "Чёрный", hex: "#262626" },
  { value: "Kulrang", ru: "Серый", hex: "#a3a3a3" },
  { value: "Ko'k", ru: "Синий", hex: "#2563eb" },
  { value: "Qizil", ru: "Красный", hex: "#ef4444" },
  { value: "Yashil", ru: "Зелёный", hex: "#16a34a" },
  { value: "To'q sariq", ru: "Оранжевый", hex: "#ea580c" },
  { value: "Sariq", ru: "Жёлтый", hex: "#eab308" },
  { value: "Jigarrang", ru: "Коричневый", hex: "#854d0e" },
  { value: "Boshqa", ru: "Другой", hex: "conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)" },
] as const;

export function UsedCarListingForm({ locale, isAuthenticated, error }: { locale: Locale; isAuthenticated: boolean; error?: string }) {
  const ru = locale === "ru";
  const pendingForm = useRef<FormData | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [submitting, setSubmitting] = useState(false);
  const [condition, setCondition] = useState<(typeof conditions)[number]["value"]>("good");
  const [conditionDescription, setConditionDescription] = useState<string>(conditions[1][ru ? "ruTemplate" : "uzTemplate"]);
  const [color, setColor] = useState("Oq");

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
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <h2 className="col-span-full text-lg font-black">{ru ? "Основная информация" : "Asosiy ma'lumotlar"}</h2>
        <label className="text-sm font-semibold">{ru ? "Марка" : "Brend"} *<input name="brand" required maxLength={80} placeholder="Chevrolet" className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="text-sm font-semibold">{ru ? "Модель" : "Model"} *<input name="model" required maxLength={100} placeholder="Cobalt" className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="text-sm font-semibold">{ru ? "Год выпуска" : "Ishlab chiqarilgan yil"} *<input name="year" type="number" min="1950" max={new Date().getFullYear()+1} required className="mt-1 w-full rounded-xl border p-3" /></label>
        <label className="text-sm font-semibold">{ru ? "Пробег, км" : "Yurgan masofasi, km"} *<input name="mileageKm" type="number" min="0" max="2000000" step="1" required placeholder={ru ? "Например: 85000" : "Masalan: 85000"} className="mt-1 w-full rounded-xl border p-3" /><span className="mt-1 block text-xs font-normal text-slate-500">{ru ? "Укажите фактический пробег. 0 км допускается." : "Haqiqiy probegni kiriting. 0 km qiymati ham qabul qilinadi."}</span></label>
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

        <fieldset className="col-span-full">
          <legend className="mb-3 text-sm font-bold">{ru ? "Цвет автомобиля" : "Avtomobil rangi"} *</legend>
          <input type="hidden" name="color" value={color} />
          <div className="flex flex-wrap gap-3">
            {colors.map(item => {
              const selected = color === item.value;
              return <button key={item.value} type="button" aria-label={ru ? item.ru : item.value} aria-pressed={selected} title={ru ? item.ru : item.value} onClick={() => setColor(item.value)} className={"h-12 w-12 rounded-full border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 " + (selected ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2" : "border-slate-200")} style={{ background: item.hex }}><span className="sr-only">{ru ? item.ru : item.value}</span></button>;
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500">{ru ? "Выбранный цвет: " : "Tanlangan rang: "}{ru ? colors.find(item => item.value === color)?.ru : color}</p>
        </fieldset>

        <fieldset className="col-span-full">
          <legend className="mb-3 text-sm font-bold">{ru ? "Состояние автомобиля" : "Avtomobil holati"} *</legend>
          <input type="hidden" name="vehicleCondition" value={condition} />
          <div className="grid gap-2 sm:grid-cols-2">
            {conditions.map(item => {
              const selected = condition === item.value;
              return <button key={item.value} type="button" aria-pressed={selected} onClick={() => { setCondition(item.value); setConditionDescription(item[ru ? "ruTemplate" : "uzTemplate"]); }} className={"rounded-2xl border p-4 text-left transition " + (selected ? "border-blue-600 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-slate-400")}>
                <span className="block font-bold">{ru ? item.ru : item.uz}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">{ru ? item.ruTemplate : item.uzTemplate}</span>
              </button>;
            })}
          </div>
          <label className="mt-4 block text-sm font-semibold">{ru ? "Шаблон состояния (можно отредактировать)" : "Avto holati shabloni (tahrirlash mumkin)"}
            <textarea name="conditionDescription" required minLength={10} maxLength={1200} rows={3} value={conditionDescription} onChange={event => setConditionDescription(event.target.value)} className="mt-1 w-full rounded-xl border p-3 font-normal" />
          </label>
        </fieldset>

        <label className="col-span-full text-sm font-semibold">{ru ? "Дополнительное описание" : "Qo'shimcha tavsif"} *<textarea name="description" required minLength={20} maxLength={5000} rows={5} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder={ru ? "Комплектация, история обслуживания, дополнительные особенности..." : "Komplektatsiyasi, texnik xizmat tarixi va boshqa qo'shimcha ma'lumotlar..."} /></label>
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
