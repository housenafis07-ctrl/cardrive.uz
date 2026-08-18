"use client";
import { useEffect, useState } from "react";
import BannerImageEditor from "@/components/banner-image-editor";

type AdminBanner = {
  id: string;
  image_url?: string | null;
  title_uz?: string | null;
  title_ru?: string | null;
  description_uz?: string | null;
  description_ru?: string | null;
  cta_uz?: string | null;
  cta_ru?: string | null;
  href?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type Props = {
  banner: AdminBanner;
  action: (formData: FormData) => void | Promise<void>;
};

export default function AdminBannerEditForm({ banner, action }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [processed, setProcessed] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(banner.image_url || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const f = processed || file;
    if (!f) return;
    const u = URL.createObjectURL(f);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file, processed]);

  return (
    <details>
      <summary className="cursor-pointer font-bold text-blue-700">✏️ Tahrirlash</summary>
      <form action={async (fd) => {
        setSaving(true);
        if (processed) fd.set("image", processed, processed.name);
        else if (file) fd.set("image", file, file.name);
        await action(fd);
      }} className="mt-3 grid min-w-[320px] gap-2 rounded-xl border bg-slate-50 p-4">
        <input type="hidden" name="id" value={banner.id} />
        <label className="text-sm font-semibold">Sarlavha UZ<input name="titleUz" required defaultValue={banner.title_uz || ""} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold">Sarlavha RU<input name="titleRu" required defaultValue={banner.title_ru || ""} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold">Tavsif UZ<textarea name="descriptionUz" defaultValue={banner.description_uz || ""} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold">Tavsif RU<textarea name="descriptionRu" defaultValue={banner.description_ru || ""} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold">Yangi rasm<input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { setFile(e.target.files?.[0] || null); setProcessed(null); }} className="mt-1 w-full rounded-lg border p-2" /></label>
        <BannerImageEditor file={file} onReady={setProcessed} />
        {preview ? <img src={preview} alt="Banner" className="h-28 w-full rounded-lg object-cover" /> : null}
        <label className="text-sm font-semibold">Tugma UZ<input name="ctaUz" defaultValue={banner.cta_uz || ""} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold">Tugma RU<input name="ctaRu" defaultValue={banner.cta_ru || ""} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold">Havola<input name="href" defaultValue={banner.href || ""} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold">Tartib<input name="sortOrder" type="number" defaultValue={banner.sort_order || 0} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={banner.is_active ?? false} /> Faol</label>
        <button disabled={saving} className="rounded-lg bg-slate-950 px-3 py-2 font-bold text-white">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
      </form>
    </details>
  );
}
