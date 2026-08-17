"use client";

import { useEffect, useState } from "react";

export default function AdminBannerForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }

  return <form action={action} encType="multipart/form-data" className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm">
    <h2 className="col-span-full text-xl font-black">Yangi banner</h2>
    <label className="text-sm font-semibold">Sarlavha — UZ<input name="titleUz" required className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Sarlavha — RU<input name="titleRu" required className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Tavsif — UZ<textarea name="descriptionUz" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Tavsif — RU<textarea name="descriptionRu" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Banner rasmi
      <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={onFileChange} className="mt-1 block w-full rounded-lg border p-3"/>
      <span className="mt-1 block text-xs text-slate-500">JPG, PNG yoki WEBP · maksimal 10 MB</span>
    </label>
    {preview ? <div className="overflow-hidden rounded-xl border bg-slate-50 p-2"><p className="mb-2 text-xs font-semibold text-slate-500">Ko‘rinishi</p><img src={preview} alt="Banner preview" className="h-40 w-full rounded-lg object-cover"/></div> : null}
    <label className="text-sm font-semibold">Tugma — UZ<input name="ctaUz" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Tugma — RU<input name="ctaRu" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Havola<input name="href" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Tartib<input name="sortOrder" type="number" defaultValue={0} className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="isActive" defaultChecked/>Faol</label>
    <button className="col-span-full rounded-full bg-slate-950 py-3 font-bold text-white">Rasmni yuklash va saqlash</button>
  </form>;
}
