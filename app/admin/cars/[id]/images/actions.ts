"use server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { AdminImageService } from "@/services/admin-image-service";
export async function uploadCarImageAction(formData:FormData){const user=await requireAdminUser();void user;const carId=String(formData.get("carId")??"");const file=formData.get("image");if(!carId||!(file instanceof File)||file.size===0)throw new Error("Rasmni tanlang");await new AdminImageService().upload(carId,file);revalidatePath("/admin/cars/"+carId+"/images");revalidatePath("/cars");}
export async function setPrimaryImageAction(formData:FormData){await requireAdminUser();const carId=String(formData.get("carId")??"");const imageId=String(formData.get("imageId")??"");await new AdminImageService().setPrimary(carId,imageId);revalidatePath("/admin/cars/"+carId+"/images");revalidatePath("/cars");}
export async function deleteCarImageAction(formData:FormData){await requireAdminUser();const carId=String(formData.get("carId")??"");const imageId=String(formData.get("imageId")??"");await new AdminImageService().remove(carId,imageId);revalidatePath("/admin/cars/"+carId+"/images");revalidatePath("/cars");}
