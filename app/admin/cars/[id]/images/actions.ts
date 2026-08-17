"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";
import { AdminImageService } from "@/services/admin-image-service";

function revalidateCarImageViews(carId: string) {
  revalidatePath("/", "page");
  revalidatePath("/cars", "page");
  revalidatePath("/cars/[slug]", "page");
  revalidatePath(`/admin/cars/${carId}/images`, "page");
}

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export async function createColorAction(formData: FormData) {
  const user = await requireAdminUser();
  const carId = text(formData, "carId");
  const nameUz = text(formData, "nameUz");
  const nameRu = text(formData, "nameRu");
  const hexCode = text(formData, "hexCode");
  if (!carId || !nameUz || !nameRu || !hexCode || !/^#[0-9a-fA-F]{6}$/.test(hexCode)) throw new Error("Rang ma'lumotlari noto‘g‘ri");
  const c = createServiceRoleClient();
  const existing = await c.from("car_colors").select("sort_order").eq("car_id", carId);
  const sortOrder = Math.max(-1, ...(existing.data ?? []).map((row) => row.sort_order)) + 1;
  const result = await c.from("car_colors").insert({ car_id: carId, name_uz: nameUz, name_ru: nameRu, hex_code: hexCode, sort_order: sortOrder, is_active: true }).select().single();
  if (result.error) throw new Error(result.error.message);
  await c.from("audit_logs").insert({ actor_id: user.id, action: "car_color.created", entity_type: "car_color", entity_id: result.data.id, metadata: {} });
  revalidateCarImageViews(carId);
}

export async function uploadCarImageAction(formData: FormData) {
  await requireAdminUser();
  const carId = String(formData.get("carId") ?? "");
  const colorId = text(formData, "colorId");
  const file = formData.get("image");
  if (!carId || !(file instanceof File) || file.size === 0) throw new Error("Rasmni tanlang");

  const result = await new AdminImageService().upload(carId, file, colorId);
  if (result?.error) throw new Error(result.error.message ?? "Rasmni yuklashda xatolik");

  revalidateCarImageViews(carId);
}

export async function setPrimaryImageAction(formData: FormData) {
  await requireAdminUser();
  const carId = String(formData.get("carId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!carId || !imageId) throw new Error("Rasm ma'lumotlari topilmadi");
  const result = await new AdminImageService().setPrimary(carId, imageId);
  if (result?.error) throw new Error(result.error.message ?? "Asosiy rasmni belgilashda xatolik");
  revalidateCarImageViews(carId);
}

export async function deleteCarImageAction(formData: FormData) {
  await requireAdminUser();
  const carId = String(formData.get("carId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!carId || !imageId) throw new Error("Rasm ma'lumotlari topilmadi");
  const result = await new AdminImageService().remove(carId, imageId);
  if (result?.error) throw new Error(result.error.message ?? "Rasmni o‘chirishda xatolik");
  revalidateCarImageViews(carId);
}
