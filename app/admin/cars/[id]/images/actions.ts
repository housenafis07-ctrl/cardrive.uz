"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { AdminImageService } from "@/services/admin-image-service";

function revalidateCarImageViews(carId: string) {
  revalidatePath("/", "page");
  revalidatePath("/cars", "page");
  revalidatePath("/cars/[slug]", "page");
  revalidatePath(`/admin/cars/${carId}/images`, "page");
}

export async function uploadCarImageAction(formData: FormData) {
  await requireAdminUser();
  const carId = String(formData.get("carId") ?? "");
  const file = formData.get("image");
  if (!carId || !(file instanceof File) || file.size === 0) throw new Error("Rasmni tanlang");

  const result = await new AdminImageService().upload(carId, file);
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
