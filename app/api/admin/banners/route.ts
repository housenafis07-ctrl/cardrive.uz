import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Banner rasmi tanlanmagan." }, { status: 400 });
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return NextResponse.json({ error: "Faqat JPG, PNG yoki WEBP rasm yuklang." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Rasm hajmi 10 MB dan oshmasligi kerak." }, { status: 400 });
    const c = createServiceRoleClient();
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `banners/${crypto.randomUUID()}.${extension}`;
    const body = Buffer.from(await file.arrayBuffer());
    const upload = await c.storage.from("car-images").upload(storagePath, body, { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (upload.error) return NextResponse.json({ error: `Rasmni yuklashda xatolik: ${upload.error.message}` }, { status: 500 });
    const imageUrl = c.storage.from("car-images").getPublicUrl(storagePath).data.publicUrl;
    const result = await c.from("home_banners").insert({ title_uz: text(formData, "titleUz"), title_ru: text(formData, "titleRu"), description_uz: text(formData, "descriptionUz"), description_ru: text(formData, "descriptionRu"), image_url: imageUrl, cta_uz: text(formData, "ctaUz"), cta_ru: text(formData, "ctaRu"), href: text(formData, "href"), sort_order: Number.parseInt(text(formData, "sortOrder") || "0", 10) || 0, is_active: formData.get("isActive") === "on" }).select().single();
    if (result.error) { await c.storage.from("car-images").remove([storagePath]); return NextResponse.json({ error: `Bannerni saqlashda xatolik: ${result.error.message}` }, { status: 500 }); }
    await c.from("audit_logs").insert({ actor_id: user.id, action: "banner.created", entity_type: "home_banner", entity_id: result.data.id, metadata: { storage_path: storagePath } });
    revalidatePath("/admin/banners"); revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Banner yuklashda noma'lum xatolik." }, { status: 500 });
  }
}
