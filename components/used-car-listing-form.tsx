"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneOtpAuth } from "@/components/phone-otp-auth";
import { createUsedCarListingAction } from "@/app/avtobozor/actions";
import { prepareCarDriveListingImage } from "@/lib/cardrive-image-branding";
import type { Locale } from "@/lib/i18n";
import { VEHICLE_BRANDS } from "@/lib/vehicle-catalog";
import { followServerActionRedirect } from "@/lib/follow-server-action-redirect";

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
  { value: "Marvarid oq", ru: "Жемчужно-белый", hex: "#f8fafc", border: true },
  { value: "Oq", ru: "Белый", hex: "#ffffff", border: true },
  { value: "Qora", ru: "Чёрный", hex: "#202124" },
  { value: "Grafit", ru: "Графитовый", hex: "#45484d" },
  { value: "Kulrang", ru: "Серый", hex: "#92979d" },
  { value: "Kumushrang", ru: "Серебристый", hex: "#c0c6cc" },
  { value: "Metallik kulrang", ru: "Серый металлик", hex: "#737b84" },
  { value: "To'q ko'k", ru: "Тёмно-синий", hex: "#102f58" },
  { value: "Ko'k", ru: "Синий", hex: "#2563eb" },
  { value: "Havorang", ru: "Голубой", hex: "#65b9e8" },
  { value: "Qizil", ru: "Красный", hex: "#dc2626" },
  { value: "Olcha rang", ru: "Вишнёвый", hex: "#8f1d35" },
  { value: "Bordo", ru: "Бордовый", hex: "#651b32" },
  { value: "Yashil", ru: "Зелёный", hex: "#16834a" },
  { value: "Zaytunrang", ru: "Оливковый", hex: "#747b38" },
  { value: "Feruza", ru: "Бирюзовый", hex: "#26a6a1" },
  { value: "Binafsha", ru: "Фиолетовый", hex: "#7650a8" },
  { value: "Pushti", ru: "Розовый", hex: "#e78aa7" },
  { value: "Bej", ru: "Бежевый", hex: "#cbb99b" },
  { value: "Kremrang", ru: "Кремовый", hex: "#eee0c2" },
  { value: "Jigarrang", ru: "Коричневый", hex: "#80543b" },
  { value: "Bronza", ru: "Бронзовый", hex: "#9a6846" },
  { value: "Oltinrang", ru: "Золотистый", hex: "#c5a34d" },
  { value: "To'q sariq", ru: "Оранжевый", hex: "#ea7a24" },
  { value: "Sariq", ru: "Жёлтый", hex: "#eabf32" },
  { value: "Boshqa", ru: "Другой", hex: "conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)" },
] as const;


export function UsedCarListingForm({ locale, isAuthenticated, error }: { locale: Locale; isAuthenticated: boolean; error?: string }) {
  const ru = locale === "ru";
  const pendingForm = useRef<FormData | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [condition, setCondition] = useState<(typeof conditions)[number]["value"]>("good");
  const [conditionDescription, setConditionDescription] = useState<string>(conditions[1][ru ? "ruTemplate" : "uzTemplate"]);
  const [color, setColor] = useState("Oq");
  const [showCondition, setShowCondition] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("Chevrolet");
  const [customBrand, setCustomBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const selectedBrandInfo = VEHICLE_BRANDS.find(item => item.name === selectedBrand);

  useEffect(() => {
    const urls = selectedPhotos.map(file => URL.createObjectURL(file));
    setPhotoUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedPhotos]);

  async function handlePhotoSelection(files: File[]) {
    const originals = files.slice(0, 8);
    setSelectedPhotos([]);
    setSubmitError("");
    if (!originals.length) return;
    setPhotoProcessing(true);
    try {
      const prepared: File[] = [];
      let totalBytes = 0;
      for (const original of originals) {
        const branded = await prepareCarDriveListingImage(original);
        totalBytes += branded.size;
        if (totalBytes > 2_400 * 1024) throw new Error("Rasmlarning umumiy hajmi 2.4 MB dan oshdi.");
        prepared.push(branded);
      }
      setSelectedPhotos(prepared);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Rasmlarni tayyorlab bo‘lmadi.");
    } finally {
      setPhotoProcessing(false);
    }
  }

  async function submitListing(data: FormData) {
    setSubmitting(true);
    setSubmitError("");
    try {
      if (photoProcessing) throw new Error("Rasmlar tayyorlanmoqda. Biroz kuting.");
      // Always rebuild the upload payload from the original File objects captured by the form.
      // The preview state is display-only; it must never determine which bytes reach Storage.
      const originalFiles = data.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
      const chosenFiles = originalFiles.length ? originalFiles : selectedPhotos;
      data.delete("photos");
      let totalBytes = 0;
      for (const original of chosenFiles) {
        // Apply watermark to the exact file that will be uploaded, after OTP as well.
        const branded = await prepareCarDriveListingImage(original);
        totalBytes += branded.size;
        if (totalBytes > 2_400 * 1024) {
          throw new Error("Rasmlarning umumiy hajmi katta. Rasmlar sonini yoki sifatini kamaytiring.");
        }
        data.append("photos", branded, branded.name);
      }
      await createUsedCarListingAction(data);
    } catch (error) {
      if (followServerActionRedirect(error)) return;
      const message = error instanceof Error ? error.message : "";
      setSubmitError(message.includes("Body exceeded") || message.includes("413")
        ? "Rasmlar hajmi server chegarasidan oshdi. Rasmlarni kichraytirib qayta yuboring."
        : message || "E'lon yuborilmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.");
      setSubmitting(false);
    }
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
      {error ? <div role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"><p>{error}</p>{error.includes("3 ta bepul e'lon limiti") ? <a href="/account/monetization" className="mt-2 inline-block font-bold underline">Tariflar va qo‘shimcha e’lon slotlari</a> : null}</div> : null}
      {submitError ? <p role="alert" className="col-span-full rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p> : null}
      <form onSubmit={handleSubmit} className="mt-6 grid w-full min-w-0 grid-cols-1 gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
        <h2 className="col-span-full text-lg font-black">{ru ? "Основная информация" : "Asosiy ma'lumotlar"}</h2>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Марка" : "Brend"} *{selectedBrand==="Other" ? <input name="brand" required maxLength={80} value={customBrand} onChange={event=>setCustomBrand(event.target.value)} placeholder={ru?"Введите марку":"Brend nomini kiriting"} className="mt-1 block w-full rounded-xl border p-3"/> : <span className="mt-1 flex min-w-0 items-center gap-2 rounded-xl border px-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center">{selectedBrandInfo?.logo ? <img src={selectedBrandInfo.logo} alt="" className="h-7 w-7 object-contain"/> : <span className="text-xs font-black">{selectedBrand.slice(0,2).toUpperCase()}</span>}</span><select name="brand" required value={selectedBrand} onChange={event=>{setSelectedBrand(event.target.value);setSelectedModel("");}} className="min-w-0 flex-1 border-0 bg-transparent p-3 outline-none">{VEHICLE_BRANDS.map(item=><option key={item.slug} value={item.name}>{item.name}</option>)}</select></span>}</label>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Модель" : "Model"} *{selectedBrand==="Other" || selectedModel==="__other__" || !selectedBrandInfo?.models.length ? <input name="model" required maxLength={100} value={customModel} onChange={event=>setCustomModel(event.target.value)} placeholder={ru ? "Введите модель" : "Modelni kiriting"} className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3"/> : <select name="model" required value={selectedModel} onChange={event=>setSelectedModel(event.target.value)} className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3"><option value="" disabled>{ru ? "Выберите модель" : "Modelni tanlang"}</option>{selectedBrandInfo.models.map(model=><option key={model} value={model}>{model}</option>)}<option value="__other__">{ru ? "Другая модель" : "Boshqa model"}</option></select>}</label>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Год выпуска" : "Ishlab chiqarilgan yil"} *<input name="year" type="number" min="1950" max={new Date().getFullYear()+1} required className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3" /></label>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Пробег, км" : "Yurgan masofasi, km"} *<input name="mileageKm" type="number" min="0" max="2000000" step="1" required placeholder={ru ? "Например: 85000" : "Masalan: 85000"} className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3" /><span className="mt-1 block text-xs font-normal text-slate-500">{ru ? "Укажите фактический пробег. 0 км допускается." : "Haqiqiy probegni kiriting. 0 km qiymati ham qabul qilinadi."}</span></label>
        <div className="col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,110px)] gap-2 sm:col-span-1">
          <label className="min-w-0 text-sm font-semibold">{ru ? "Цена" : "Narxi"} *<input name="price" type="number" min="1" step="any" required className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3" /></label>
          <label className="min-w-0 text-sm font-semibold">{ru ? "Валюта" : "Valyuta"}<select name="currency" className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3"><option value="UZS">UZS</option><option value="USD">USD</option></select></label>
        </div>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Страна производства" : "Ishlab chiqarilgan mamlakat"} *<select name="countryOfOrigin" required defaultValue="unknown" className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3"><option value="unknown">{ru ? "Не указано" : "Ko‘rsatilmagan"}</option><option value="uzbekistan">{ru ? "Узбекистан" : "O‘zbekiston"}</option><option value="foreign">{ru ? "Другая страна" : "Chet el"}</option></select></label>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Регион" : "Hudud"} *<select name="region" required className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3"><option value="">{ru ? "Выберите" : "Tanlang"}</option>{["Toshkent shahri","Toshkent viloyati","Andijon","Buxoro","Farg'ona","Jizzax","Xorazm","Namangan","Navoiy","Qashqadaryo","Qoraqalpog'iston","Samarqand","Sirdaryo","Surxondaryo"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Район / город" : "Tuman / shahar"}<input name="district" maxLength={80} className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3" /></label>

        <h2 className="col-span-full mt-2 text-lg font-black">{ru ? "Характеристики" : "Texnik xususiyatlar"}</h2>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Тип кузова" : "Kuzov turi"}<select name="bodyType" className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3"><option value="">—</option>{["Sedan","Hatchback","SUV","Crossover","Universal","Minivan","Coupe","Pickup"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Топливо" : "Yoqilg'i"}<select name="fuelType" className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3"><option value="">—</option>{["Benzin","Gaz","Benzin/Gaz","Dizel","Gibrid","Elektr"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Коробка передач" : "Uzatmalar qutisi"}<select name="transmission" className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3"><option value="">—</option>{["Mexanika","Avtomat","CVT","Robot"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="min-w-0 text-sm font-semibold">{ru ? "Объём двигателя, л" : "Dvigatel hajmi, litr"}<input name="engineVolume" type="number" min="0" max="20" step="0.1" className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3" /></label>

        <fieldset className="col-span-full min-w-0 max-w-full">
          <legend className="mb-3 text-sm font-bold">{ru ? "Цвет автомобиля" : "Avtomobil rangi"} *</legend>
          <input type="hidden" name="color" value={color} />
          <div className="max-w-full overflow-x-auto px-1 pb-3">
            <div className="flex w-max gap-3">
              {colors.map(item => {
                const selected = color === item.value;
                return <button key={item.value} type="button" aria-label={ru ? item.ru : item.value} aria-pressed={selected} title={ru ? item.ru : item.value} onClick={() => setColor(item.value)} className={"h-12 w-12 shrink-0 rounded-full border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 " + (selected ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2" : "border-slate-200")} style={{ background: item.hex }}><span className="sr-only">{ru ? item.ru : item.value}</span></button>;
              })}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 sm:hidden">{ru ? "Проведите в сторону, чтобы увидеть другие цвета" : "Boshqa ranglarni ko‘rish uchun yon tomonga suring"}</p>
          <p className="mt-2 text-xs text-slate-500">{ru ? "Выбранный цвет: " : "Tanlangan rang: "}{ru ? colors.find(item => item.value === color)?.ru : color}</p>
        </fieldset>

        <fieldset className="col-span-full min-w-0">
          <input type="hidden" name="vehicleCondition" value={condition} />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button
              type="button"
              aria-expanded={showCondition}
              onClick={() => setShowCondition(value => !value)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold">{ru ? "Состояние автомобиля" : "Avtomobil holati"}</span>
                <span className="mt-1 block truncate text-sm text-slate-500">{ru ? conditions.find(item => item.value === condition)?.ru : conditions.find(item => item.value === condition)?.uz}</span>
              </span>
              <svg aria-hidden="true" viewBox="0 0 20 20" className={"h-5 w-5 shrink-0 text-blue-600 transition-transform " + (showCondition ? "rotate-180" : "")} fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {showCondition ? (
              <div className="border-t border-slate-100 p-3 sm:p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {conditions.map(item => {
                    const selected = condition === item.value;
                    return <button key={item.value} type="button" aria-pressed={selected} onClick={() => { setCondition(item.value); setConditionDescription(item[ru ? "ruTemplate" : "uzTemplate"]); }} className={"rounded-xl border p-3 text-left transition " + (selected ? "border-blue-600 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-slate-400")}>
                      <span className="block text-sm font-bold">{ru ? item.ru : item.uz}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{ru ? item.ruTemplate : item.uzTemplate}</span>
                    </button>;
                  })}
                </div>
                <label className="mt-3 block min-w-0 text-sm font-semibold">{ru ? "Шаблон состояния (можно отредактировать)" : "Avto holati shabloni (tahrirlash mumkin)"}
                  <textarea name="conditionDescription" required minLength={10} maxLength={1200} rows={3} value={conditionDescription} onChange={event => setConditionDescription(event.target.value)} className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3 font-normal" />
                </label>
              </div>
            ) : (
              <input type="hidden" name="conditionDescription" value={conditionDescription} />
            )}
          </div>
        </fieldset>

        <label className="col-span-full min-w-0 text-sm font-semibold">{ru ? "Дополнительное описание" : "Qo'shimcha tavsif"} *<textarea name="description" required minLength={20} maxLength={5000} rows={5} className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3 font-normal" placeholder={ru ? "Комплектация, история обслуживания, дополнительные особенности..." : "Komplektatsiyasi, texnik xizmat tarixi va boshqa qo'shimcha ma'lumotlar..."} /></label>
        <div className="col-span-full min-w-0 text-sm font-semibold"><label>{ru ? "Фотографии (до 8, JPG/PNG/WEBP, до 8 МБ каждая)" : "Rasmlar (8 tagacha, JPG/PNG/WEBP, har biri 8 MB gacha)"}<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { void handlePhotoSelection(Array.from(event.target.files ?? [])); }} className="mt-2 block box-border w-full min-w-0 max-w-full rounded-xl border p-3 text-sm" /></label><span className="mt-1 block text-xs font-normal text-slate-500">{photoProcessing ? (ru ? "Добавляем водяной знак cardrive.uz…" : "Rasmlarga cardrive.uz watermark qo‘yilmoqda…") : (ru ? "Водяной знак cardrive.uz уже встроен в подготовленные фото." : "cardrive.uz watermark rasmlarning o‘ziga qo‘yildi.")}</span>
          {selectedPhotos.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{selectedPhotos.map((file, index) => <div key={file.name + index} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><div className="relative"><img src={photoUrls[index]} alt={"Avtomobil rasmi " + (index + 1)} draggable={false} className="block h-auto w-full" /></div><div className="p-2 text-[10px] text-slate-600">{ru ? "Водяной знак будет добавлен" : "Watermark rasmning o‘ziga yozilgan bo‘lishi kerak"}</div></div>)}</div>}
        </div>
        <label className="col-span-full flex min-w-0 items-center gap-2 text-sm"><input type="checkbox" name="isNegotiable" defaultChecked />{ru ? "Возможен торг" : "Savdolashish mumkin"}</label>
        <label className="col-span-full min-w-0 text-sm font-semibold">{ru ? "Имя продавца" : "Sotuvchi ismi"} *<input name="contactName" required maxLength={100} className="mt-1 block box-border w-full min-w-0 max-w-full rounded-xl border p-3" /></label>
        <p className="col-span-full rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{ru ? "Номер телефона будет использован из подтверждённого аккаунта. Если вы ещё не зарегистрированы, подтверждение номера понадобится только после заполнения объявления. Объявление сначала проходит модерацию." : "Telefon raqamingiz tasdiqlangan akkauntingizdan olinadi. Ro'yxatdan o'tmagan bo'lsangiz, raqam faqat e'lon ma'lumotlarini to'ldirgandan keyin tasdiqlanadi. E'lon avval moderator tekshiruvidan o'tadi."}</p>
        <button disabled={submitting || photoProcessing} className="col-span-full rounded-full bg-slate-950 px-5 py-3.5 font-bold text-white disabled:opacity-50">{photoProcessing ? (ru ? "Подготовка фото..." : "Rasmlar tayyorlanmoqda...") : submitting ? (ru ? "Отправка..." : "Yuborilmoqda...") : (ru ? "Отправить на модерацию" : "Moderatsiyaga yuborish")}</button>
      </form>
      {showAuth ? <section className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-black">{ru ? "Подтвердите номер для публикации" : "E'lonni yuborish uchun telefon raqamini tasdiqlang"}</h2><PhoneOtpAuth purpose="login" locale={locale} onAuthenticated={handleAuthenticated} title={ru ? "Вход или регистрация" : "Kirish yoki ro'yxatdan o'tish"} /></section> : null}
    </>
  );
}
