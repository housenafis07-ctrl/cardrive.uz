"use client";

import { useEffect, useState, useTransition } from "react";
import { createUsedCarListingAction } from "@/app/avtobozor/actions";

type Draft = {
  id: string;
  ai_payload: Record<string, any>;
  missing_fields: string[];
  photo_count: number;
};
function cls(missing: boolean) {
  return "w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 " +
    (missing ? "border-red-500 bg-red-50 focus:ring-red-200" : "border-slate-300 bg-white focus:ring-blue-200");
}
export function TelegramAiDraftForm({ draft }: { draft: Draft }) {
  const p = draft.ai_payload ?? {};
  const missing = new Set(draft.missing_fields ?? []);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoStatus, setPhotoStatus] = useState("Telegram rasmlari yuklanmoqda…");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

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
          setPhotoStatus(files.length + " ta rasm e’lon uchun tayyor");
        }
      } catch (e) {
        if (!cancelled) setPhotoStatus(e instanceof Error ? e.message : "Rasmlar yuklanmadi");
      }
    }
    if (draft.photo_count) void load();
    else setPhotoStatus("Draft’da Telegram rasmlari yo‘q. Quyidan rasm qo‘shishingiz mumkin.");
    return () => { cancelled = true; };
  }, [draft.id, draft.photo_count]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    data.set("aiDraftId", draft.id);
    const primary = Number.isInteger(p.primary_image_index) ? Number(p.primary_image_index) : 0;
    const orderedPhotos = photos.length && primary >= 0 && primary < photos.length
      ? [photos[primary], ...photos.filter((_, index) => index !== primary)]
      : photos;
    for (const file of orderedPhotos) data.append("photos", file, file.name);
    startTransition(() => {
      void createUsedCarListingAction(data).catch(e => setError(e instanceof Error ? e.message : "E’lon yuborilmadi"));
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
      {field("brand", "Marka", p.brand)}
      {field("model", "Model", p.model)}
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
      {field("color", "Rangi", p.color, "text", false)}
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Avtomobil holati *</span><select name="vehicleCondition" required defaultValue={p.vehicle_condition ?? ""} className={cls(missing.has("vehicle_condition"))}><option value="">Tanlang</option><option value="ideal">Ideal</option><option value="good">Yaxshi</option><option value="minor_defects">Mayda kamchiliklari bor</option><option value="body_repair">Kuzov ta’miri kerak</option><option value="major_repair">Jiddiy ta’mir talab etiladi</option><option value="parts_only">Ehtiyot qismlar uchun</option></select></label>
    </div>
    {field("conditionDescription", "Holati haqida izoh", p.condition_description, "text")}
    {field("contactName", "Aloqa uchun ism", p.contact_name)}
    <label className="block space-y-1.5"><span className="text-sm font-semibold">E’lon tavsifi *</span><textarea name="description" required minLength={20} maxLength={5000} defaultValue={p.description ?? ""} className={cls(missing.has("description")) + " min-h-32"} /></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isNegotiable" defaultChecked={Boolean(p.is_negotiable)} /> Narx kelishiladi</label>
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="font-bold">Avtomobil rasmlari</p>
      <p className="mt-1 text-xs text-slate-500">{photoStatus}</p>
      {photos.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{photos.map((file, i) => <div key={file.name} className="rounded-lg bg-slate-100 p-2 text-xs">{i === (p.primary_image_index ?? 0) ? "⭐ Asosiy rasm" : "Rasm " + (i + 1)}</div>)}</div>}
      <input className="mt-3 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => {
        const selected = Array.from(e.target.files ?? []).slice(0, 8);
        setPhotos(current => [...current, ...selected].slice(0, 8));
        setPhotoStatus("Tanlangan rasmlar e’longa qo‘shiladi");
      }} />
      <p className="mt-2 text-xs text-slate-500">Rasm soni 8 tagacha. Telegram’dan kelgan rasmlar avtomatik qo‘shiladi.</p>
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={pending} className="w-full rounded-full bg-blue-700 px-5 py-4 font-bold text-white disabled:opacity-50">{pending ? "E’lon yuborilmoqda…" : "E’lonni joylashtirish"}</button>
    <p className="text-xs text-slate-500">E’lon darhol ommaga chiqmaydi — mavjud moderatsiya tekshiruviga yuboriladi.</p>
  </form>;
}
