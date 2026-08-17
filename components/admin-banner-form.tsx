"use client";

import { useEffect, useState } from "react";

export default function AdminBannerForm({ action: _action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) { setPreview(null); return; }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null); setSaving(true);
    try {
      const response = await fetch("/api/admin/banners", { method: "POST", body: new FormData(event.currentTarget) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = "/admin/banners";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  return <form onSubmit={submit} encType="multipart/form-data" className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm">
    <h2 className="col-span-full text-xl font-black">Yangi banner</h2>
    {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
    <label className="text-sm font-semibold">Sarlavha — UZ<input name="titleUz" required className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Sarlavha — RU<input name="titleRu" required className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Tavsif — UZ<textarea name="descriptionUz" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Tavsif — RU<textarea name="descriptionRu" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Banner rasmi<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={onFileChange} className="mt-1 block w-full rounded-lg border p-3"/><span className="mt-1 block text-xs text-slate-500">JPG, PNG yoki WEBP · maksimal 10 MB</span></label>
    {preview ? <div className="overflow-hidden rounded-xl border bg-slate-50 p-2"><p className="mb-2 text-xs font-semibold text-slate-500">Ko‘rinishi</p><img src={preview} alt="Banner preview" className="h-40 w-full rounded-lg object-cover"/></div> : null}
    <label className="text-sm font-semibold">Tugma — UZ<input name="ctaUz" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Tugma — RU<input name="ctaRu" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Havola<input name="href" className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="text-sm font-semibold">Tartib<input name="sortOrder" type="number" defaultValue={0} className="mt-1 w-full rounded-lg border p-3"/></label>
    <label className="flex gap-2 text-sm font-semibold"><input type="checkbox" name="isActive" defaultChecked/>Faol</label>
    <button disabled={saving} className="col-span-full rounded-full bg-slate-950 py-3 font-bold text-white disabled:opacity-50">{saving ? "Yuklanmoqda..." : "Rasmni yuklash va saqlash"}</button>
  </form>;
}
