"use client";

import { useEffect, useState, useTransition } from "react";
import { createUsedCarListingAction } from "@/app/avtobozor/actions";
import { VEHICLE_BRANDS } from "@/lib/vehicle-catalog";

type DraftAiPayload = {
  brand?: string | null;
  model?: string | null;
  trim?: string | null;
  gas_cylinder?: string | null;
  year?: number | null;
  mileage_km?: number | null;
  price?: number | null;
  currency?: "UZS" | "USD" | null;
  country_of_origin?: "uzbekistan" | "foreign" | "unknown" | null;
  region?: string | null;
  district?: string | null;
  body_type?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  engine_volume?: number | null;
  color?: string | null;
  vehicle_condition?: string | null;
  condition_description?: string | null;
  description?: string | null;
  contact_name?: string | null;
  is_negotiable?: boolean;
  primary_image_index?: number | null;
  image_quality_scores?: number[];
};
type PlateRegion = { image_index: number; x: number; y: number; width: number; height: number; confidence: number };
type Draft = {
  id: string;
  ai_payload: DraftAiPayload;
  missing_fields: string[];
  photo_count: number;
  plate_regions?: PlateRegion[];
};
function cls(missing: boolean) {
  return "w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 " +
    (missing ? "border-red-500 bg-red-50 focus:ring-red-200" : "border-slate-300 bg-white focus:ring-blue-200");
}
export function TelegramAiDraftForm({ draft }: { draft: Draft }) {
  const p: DraftAiPayload = draft.ai_payload ?? {};
  const aliases: Record<string, string> = { mileage_km: "mileageKm", condition_description: "conditionDescription", vehicle_condition: "vehicleCondition" };
  const missing = new Set((draft.missing_fields ?? []).map(key => aliases[key] ?? key));
  const conditionChoices = [
    { value: "ideal", label: "Ideal holat", template: "Avtomobil ideal holatda. Kuzov va salonda ko‘zga tashlanadigan nuqsonlar yo‘q." },
    { value: "good", label: "Yaxshi holat", template: "Avtomobilda foydalanish bilan bog‘liq tabiiy izlar bor. Jiddiy shikastlanishlar mavjud emas." },
    { value: "minor_defects", label: "Mayda kamchiliklari bor", template: "Kuzovda mayda botiqlar, tirnalishlar yoki foydalanish izlari mavjud." },
    { value: "body_repair", label: "Kuzov ta’miri kerak", template: "Ayrim kuzov qismlarida ta’mirlash ishlari talab etiladi." },
    { value: "major_repair", label: "Jiddiy ta’mir talab etiladi", template: "Avtomobil harakatlanishi uchun jiddiy ta’mir talab etiladi." },
    { value: "parts_only", label: "Ehtiyot qismlar uchun", template: "Avtomobil asosan ehtiyot qismlar uchun taklif qilinadi." },
  ] as const;
  const rawCondition = String(p.vehicle_condition ?? "").toLowerCase();
  const initialCondition = conditionChoices.some(item => item.value === rawCondition) ? rawCondition
    : /ideal/.test(rawCondition) ? "ideal"
    : /ta.mir|repair/.test(rawCondition) ? "body_repair"
    : /kamchilik|defect/.test(rawCondition) ? "minor_defects" : "good";
  const [vehicleCondition, setVehicleCondition] = useState<string>(initialCondition);
  const [conditionDescription, setConditionDescription] = useState(
    (p.condition_description ?? "").trim().length >= 10
      ? String(p.condition_description)
      : conditionChoices.find(item => item.value === initialCondition)!.template
  );
  const [color, setColor] = useState(String(p.color ?? "Oq"));
  const initialBrand = VEHICLE_BRANDS.find(item => item.name.toLowerCase() === String(p.brand ?? "").toLowerCase());
  const [brand, setBrand] = useState(initialBrand?.name ?? String(p.brand ?? "Chevrolet"));
  const [model, setModel] = useState(String(p.model ?? ""));
  const brandInfo = VEHICLE_BRANDS.find(item => item.name === brand);
  const colorChoices = [
    ["Marvarid oq","#f8fafc"],["Oq","#ffffff"],["Qora","#202124"],["Grafit","#45484d"],
    ["Kulrang","#92979d"],["Kumushrang","#c0c6cc"],["Metallik kulrang","#737b84"],
    ["To‘q ko‘k","#102f58"],["Ko‘k","#2563eb"],["Havorang","#65b9e8"],["Qizil","#dc2626"],
    ["Olcha rang","#8f1d35"],["Bordo","#651b32"],["Yashil","#16834a"],["Zaytunrang","#747b38"],
    ["Feruza","#26a6a1"],["Binafsha","#7650a8"],["Pushti","#e78aa7"],["Bej","#cbb99b"],
    ["Kremrang","#eee0c2"],["Jigarrang","#80543b"],["Bronza","#9a6846"],["Oltinrang","#c5a34d"],
    ["To‘q sariq","#ea7a24"],["Sariq","#eabf32"],["Boshqa","conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)"]
  ] as const;
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoStatus, setPhotoStatus] = useState("Telegram rasmlari yuklanmoqda…");
  const [photoProgress, setPhotoProgress] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const urls = photos.map(file => URL.createObjectURL(file));
    setPhotoUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [photos]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/telegram-ai-draft/" + encodeURIComponent(draft.id) + "/photos", { cache: "no-store" });
        if (!response.ok) throw new Error("Telegram rasmlarini olish imkoni bo‘lmadi");
        const payload = await response.json() as { images: Array<{ dataUrl: string; name: string }> };
        const files: File[] = [];
        for (const [index, item] of payload.images.entries()) {
          const blob = await (await fetch(item.dataUrl)).blob();
          const bitmap = await createImageBitmap(blob);
          try {
            const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            const context = canvas.getContext("2d");
            if (!context) continue;
            context.filter = "brightness(1.035) contrast(1.045)";
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            context.filter = "none";
            const plate = (draft.plate_regions ?? []).find(region => region.image_index === index && region.confidence >= 0.92);
            if (plate && plate.width > 15 && plate.height > 8 && plate.x + plate.width <= 1000 && plate.y + plate.height <= 1000) {
              const x = plate.x / 1000 * canvas.width, y = plate.y / 1000 * canvas.height;
              const w = plate.width / 1000 * canvas.width, h = plate.height / 1000 * canvas.height;
              context.fillStyle = "#f8fafc";
              context.fillRect(x, y, w, h);
              context.strokeStyle = "#0f5132";
              context.lineWidth = Math.max(1, h * 0.045);
              context.strokeRect(x, y, w, h);
              context.fillStyle = "#14532d";
              context.font = "900 " + Math.max(8, Math.floor(h * 0.52)) + "px Arial";
              context.textAlign = "center";
              context.textBaseline = "middle";
              context.fillText("CARDRIVE", x + w / 2, y + h / 2, w * 0.92);
            }
            let webp: Blob | null = null;
            for (const quality of [0.84, 0.76, 0.68, 0.6, 0.52]) {
              webp = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", quality));
              if (webp && webp.size <= 220 * 1024) break;
            }
            if (webp) files.push(new File([webp], "cardrive-" + (index + 1) + ".webp", { type: "image/webp" }));
          } finally {
            bitmap.close();
          }
        }
        if (!cancelled) {
          setPhotos(files);
          setPhotoStatus(files.length + " ta rasm tayyorlandi");
          setPhotoProgress(files.length + "/" + draft.photo_count + " rasm brauzerga muvaffaqiyatli olindi");
        }
      } catch (e) {
        if (!cancelled) {
          setPhotoStatus(e instanceof Error ? e.message : "Rasmlar yuklanmadi");
          setPhotoProgress("Rasmlarni qayta olish yoki qo‘lda tanlash kerak");
        }
      }
    }
    if (draft.photo_count) void load();
    else {
      setPhotoStatus("Draft’da Telegram rasmlari yo‘q. Quyidan rasm qo‘shishingiz mumkin.");
      setPhotoProgress("Hozircha rasm biriktirilmagan");
    }
    return () => { cancelled = true; };
  }, [draft.id, draft.photo_count]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    data.set("aiDraftId", draft.id);
    data.set("brand", brand.trim());
    data.set("model", model.trim());
    data.set("vehicleCondition", vehicleCondition);
    data.set("conditionDescription", conditionDescription.trim());
    data.set("color", color);
    const primary = Number.isInteger(p.primary_image_index) ? Number(p.primary_image_index) : 0;
    const ranked = photos.map((file, index) => ({ file, index, score: Number(p.image_quality_scores?.[index] ?? 0) }))
      .sort((a, b) => b.score - a.score);
    const mainIndex = primary >= 0 && primary < photos.length ? primary : ranked[0]?.index ?? 0;
    const orderedPhotos = photos.length
      ? [photos[mainIndex], ...ranked.filter(item => item.index !== mainIndex).map(item => item.file)]
      : photos;
    for (const file of orderedPhotos) data.append("photos", file, file.name);
    if (conditionDescription.trim().length < 10) {
      setError("Avtomobil holati haqida kamida 10 ta belgidan iborat izoh kiriting.");
      return;
    }
    setUploadStatus("E’lon va " + orderedPhotos.length + " ta rasm serverga yuborilmoqda…");
    startTransition(() => {
      void createUsedCarListingAction(data).catch(e => {
        if (e && typeof e === "object" && "digest" in e && String((e as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
        setError(e instanceof Error ? e.message : "E’lon yuborilmadi");
        setUploadStatus("Yuklash yakunlanmadi. Xatoni tuzatib qayta urinib ko‘ring.");
      });
    });
  }

  const field = (key: string, label: string, value: unknown, type = "text", required = true) => (
    <label className="block space-y-1.5">
      <span className={"text-sm font-semibold " + (missing.has(key) ? "text-red-700" : "text-slate-700")}>
        {label}{required ? " *" : ""}{missing.has(key) ? " — to‘ldirish/tekshirish shart" : ""}
      </span>
      <input name={key} type={type} required={required} defaultValue={value == null ? "" : String(value)}
        className={cls(missing.has(key))} />
    </label>
  );

  return <form onSubmit={submit} className="mt-6 space-y-5">
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
      AI e’lon ma’lumotlarini tayyorladi. Qizil rangdagi maydonlarni to‘ldiring yoki tekshiring. E’lon moderator tasdig‘idan keyin chiqadi.
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Brend *</span>
        <span className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3">
          {brandInfo?.logo ? <img src={brandInfo.logo} alt="" className="h-8 w-8 object-contain" /> : <span className="flex h-8 w-8 items-center justify-center text-xs font-black">{brand.slice(0,2).toUpperCase()}</span>}
          <select value={brand} onChange={e => { setBrand(e.target.value); setModel(""); }} className="min-w-0 flex-1 bg-transparent p-3 outline-none">
            {VEHICLE_BRANDS.map(item => <option key={item.slug} value={item.name}>{item.name}</option>)}
            {!initialBrand && <option value={brand}>{brand}</option>}
            <option value="Other">Boshqa brend</option>
          </select>
        </span>
        {brand === "Other" && <input aria-label="Brend nomi" value={brand === "Other" ? "" : brand} onChange={e => setBrand(e.target.value || "Other")} placeholder="Brend nomini kiriting" className={cls(false)} />}
      </label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Model *</span>
        {brandInfo?.models.length ? <select value={model} onChange={e => setModel(e.target.value)} className={cls(missing.has("model"))}>
          <option value="">Modelni tanlang</option>{brandInfo.models.map(item => <option key={item} value={item}>{item}</option>)}<option value="__other__">Boshqa model</option>
        </select> : null}
        {(!brandInfo?.models.length || model === "__other__") && <input value={model === "__other__" ? "" : model} onChange={e => setModel(e.target.value)} placeholder="Model nomini kiriting" className={cls(missing.has("model"))} />}
      </label>
      {field("trim", "Komplektatsiya / pozitsiya", p.trim, "text", false)}
      {field("gasCylinder", "Gaz balloni", p.gas_cylinder, "text", false)}
      {field("year", "Ishlab chiqarilgan yil", p.year, "number")}
      {field("mileageKm", "Yurgan masofasi (km)", p.mileage_km, "number")}
      {field("price", "Narx", p.price, "number")}
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Valyuta *</span><select name="currency" required defaultValue={p.currency ?? ""} className={cls(missing.has("currency"))}><option value="">Tanlang</option><option value="USD">USD</option><option value="UZS">UZS</option></select></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Kelib chiqishi *</span><select name="countryOfOrigin" required defaultValue={p.country_of_origin === "unknown" ? "" : p.country_of_origin ?? ""} className={cls(missing.has("country_of_origin"))}><option value="">Tanlang</option><option value="uzbekistan">O‘zbekistonda ishlab chiqarilgan</option><option value="foreign">Import</option></select></label>
      {field("region", "Hudud", p.region)}
      {field("district", "Tuman/shahar", p.district, "text", false)}
      {field("bodyType", "Kuzov turi", p.body_type, "text", false)}
      {field("fuelType", "Yoqilg‘i", p.fuel_type, "text", false)}
      {field("transmission", "Uzatmalar qutisi", p.transmission, "text", false)}
      {field("engineVolume", "Dvigatel hajmi (litr)", p.engine_volume, "number", false)}
      <fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-semibold">Avtomobil rangi *</legend>
        <input type="hidden" name="color" value={color} />
        <div className="flex gap-3 overflow-x-auto px-1 py-2">{colorChoices.map(([name,hex]) => <button key={name} type="button" title={name} aria-label={name} aria-pressed={color===name} onClick={() => setColor(name)} className={"h-10 w-10 shrink-0 rounded-full border-2 " + (color===name ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2" : "border-slate-300")} style={{background:hex}} />)}</div>
        <p className="text-xs text-slate-500">Tanlangan rang: {color}</p>
      </fieldset>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Avtomobil holati *</span>
        <select value={vehicleCondition} onChange={e => { setVehicleCondition(e.target.value); const item=conditionChoices.find(x=>x.value===e.target.value); if(item && conditionDescription.trim().length<10) setConditionDescription(item.template); }} className={cls(missing.has("vehicle_condition"))}>
          {conditionChoices.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
    </div>
    <label className="block space-y-1.5 sm:col-span-2"><span className="text-sm font-semibold">Holati haqida izoh *</span>
      <textarea name="conditionDescription" required minLength={10} maxLength={1200} rows={3} value={conditionDescription} onChange={e=>setConditionDescription(e.target.value)} className={cls(missing.has("condition_description"))} />
    </label>
    {field("contactName", "Aloqa uchun ism", p.contact_name)}
    <label className="block space-y-1.5"><span className="text-sm font-semibold">E’lon tavsifi *</span><textarea name="description" required minLength={20} maxLength={5000} defaultValue={p.description ?? ""} className={cls(missing.has("description")) + " min-h-32"} /></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isNegotiable" defaultChecked={Boolean(p.is_negotiable)} /> Narx kelishiladi</label>
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="font-bold">Avtomobil rasmlari</p>
      <p className="mt-1 text-xs text-slate-600">{photoStatus}</p>
      {photoProgress && <p className="mt-1 text-xs font-medium text-emerald-700">{photoProgress}</p>}
      {photos.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((file, i) => <div key={file.name + i} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {photoUrls[i] ? <img src={photoUrls[i]} alt={"Avtomobil rasmi " + (i+1)} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] animate-pulse bg-slate-200" />}
        <span className="block truncate px-2 py-1.5 text-xs">{i === (p.primary_image_index ?? 0) ? "⭐ Asosiy rasm" : "Rasm " + (i + 1)}</span>
      </div>)}</div>}
      <input className="mt-3 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => {
        const selected = Array.from(e.target.files ?? []).slice(0, Math.max(0, 8 - photos.length));
        setPhotos(current => [...current, ...selected].slice(0, 8));
        setPhotoStatus("Qo‘lda tanlangan rasmlar qo‘shildi");
        setPhotoProgress((photos.length + selected.length) + " ta rasm tayyor");
        e.currentTarget.value = "";
      }} />
      <p className="mt-2 text-xs text-slate-500">Rasm soni 8 tagacha. Telegram’dan kelgan rasmlar avtomatik qo‘shiladi.</p>
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {uploadStatus && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{uploadStatus}</p>}
    <button disabled={pending} className="w-full rounded-full bg-blue-700 px-5 py-4 font-bold text-white disabled:opacity-50">{pending ? "Rasmlar saqlanmoqda…" : "E’lonni joylashtirish"}</button>
    <p className="text-xs text-slate-500">E’lon darhol ommaga chiqmaydi — mavjud moderatsiya tekshiruviga yuboriladi.</p>
  </form>;
}
