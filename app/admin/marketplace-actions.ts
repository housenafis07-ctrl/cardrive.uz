"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
};
const integer = (formData: FormData, key: string) => {
  const value = text(formData, key);
  return value === null ? 0 : Number.parseInt(value, 10) || 0;
};
const checked = (formData: FormData, key: string) => formData.get(key) === "on";

export async function createCategoryAction(formData: FormData) {
  const user = await requireAdminUser();
  const c = createServiceRoleClient();
  const result = await c.from("car_categories").insert({ key: text(formData, "key"), name_uz: text(formData, "nameUz"), name_ru: text(formData, "nameRu"), icon: text(formData, "icon"), sort_order: integer(formData, "sortOrder"), is_active: checked(formData, "isActive") }).select().single();
  if (result.error) redirect(`/admin/categories?error=${encodeURIComponent(result.error.message)}`);
  await c.from("audit_logs").insert({ actor_id: user.id, action: "category.created", entity_type: "car_category", entity_id: result.data.id, metadata: {} });
  revalidatePath("/admin/categories"); revalidatePath("/");
}

export async function toggleCategoryAction(formData: FormData) {
  await requireAdminUser();
  const id = text(formData, "id");
  const active = checked(formData, "isActive");
  if (!id) throw new Error("Kategoriya topilmadi");
  const c = createServiceRoleClient();
  await c.from("car_categories").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/categories"); revalidatePath("/");
}

export async function createBannerAction(formData: FormData) {
  const user = await requireAdminUser();
  const c = createServiceRoleClient();
  const result = await c.from("home_banners").insert({ title_uz: text(formData, "titleUz"), title_ru: text(formData, "titleRu"), description_uz: text(formData, "descriptionUz"), description_ru: text(formData, "descriptionRu"), image_url: text(formData, "imageUrl"), cta_uz: text(formData, "ctaUz"), cta_ru: text(formData, "ctaRu"), href: text(formData, "href"), sort_order: integer(formData, "sortOrder"), is_active: checked(formData, "isActive") }).select().single();
  if (result.error) redirect(`/admin/banners?error=${encodeURIComponent(result.error.message)}`);
  await c.from("audit_logs").insert({ actor_id: user.id, action: "banner.created", entity_type: "home_banner", entity_id: result.data.id, metadata: {} });
  revalidatePath("/admin/banners"); revalidatePath("/");
}

export async function toggleBannerAction(formData: FormData) {
  await requireAdminUser();
  const id = text(formData, "id");
  const active = checked(formData, "isActive");
  if (!id) throw new Error("Banner topilmadi");
  const c = createServiceRoleClient();
  await c.from("home_banners").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/banners"); revalidatePath("/");
}
