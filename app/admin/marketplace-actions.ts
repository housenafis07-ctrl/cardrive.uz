"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";

const text = (formData: FormData, key: string) => { const value=formData.get(key); return typeof value === "string" && value.trim() ? value.trim() : null; };
const integer = (formData: FormData, key: string) => { const value=text(formData,key); return value===null ? 0 : Number.parseInt(value,10)||0; };
const checked = (formData: FormData, key: string) => formData.get(key)==="on";

export async function createCategoryAction(formData: FormData) {
  const user=await requireAdminUser(); const c=createServiceRoleClient();
  const result=await c.from("car_categories").insert({key:text(formData,"key"),name_uz:text(formData,"nameUz"),name_ru:text(formData,"nameRu"),icon:text(formData,"icon"),sort_order:integer(formData,"sortOrder"),is_active:checked(formData,"isActive")}).select().single();
  if(result.error) redirect(`/admin/categories?error=${encodeURIComponent(result.error.message)}`);
  await c.from("audit_logs").insert({actor_id:user.id,action:"category.created",entity_type:"car_category",entity_id:result.data.id,metadata:{}});
  revalidatePath("/admin/categories"); revalidatePath("/");
}
export async function updateCategoryAction(formData: FormData) {
  const user=await requireAdminUser(); const id=text(formData,"id");
  if(!id) redirect("/admin/categories?error=Kategoriya+topilmadi");
  const c=createServiceRoleClient();
  const result=await c.from("car_categories").update({key:text(formData,"key"),name_uz:text(formData,"nameUz"),name_ru:text(formData,"nameRu"),icon:text(formData,"icon"),sort_order:integer(formData,"sortOrder"),is_active:checked(formData,"isActive")}).eq("id",id);
  if(result.error) redirect(`/admin/categories?error=${encodeURIComponent(result.error.message)}`);
  await c.from("audit_logs").insert({actor_id:user.id,action:"category.updated",entity_type:"car_category",entity_id:id,metadata:{}});
  revalidatePath("/admin/categories"); revalidatePath("/");
}
export async function toggleCategoryAction(formData: FormData) { await requireAdminUser(); const id=text(formData,"id"); const active=checked(formData,"isActive"); if(!id) throw new Error("Kategoriya topilmadi"); const c=createServiceRoleClient(); await c.from("car_categories").update({is_active:active}).eq("id",id); revalidatePath("/admin/categories"); revalidatePath("/"); }

export async function createBannerAction(formData: FormData) {
  const user=await requireAdminUser(); const c=createServiceRoleClient(); const file=formData.get("image");
  if(!(file instanceof File)||file.size===0) redirect(`/admin/banners?error=${encodeURIComponent("Banner rasmi tanlanmagan.")}`);
  if(!file.type.startsWith("image/")) redirect(`/admin/banners?error=${encodeURIComponent("Faqat JPG, PNG yoki WEBP rasm yuklang.")}`);
  if(file.size>10*1024*1024) redirect(`/admin/banners?error=${encodeURIComponent("Rasm hajmi 10 MB dan oshmasligi kerak.")}`);
  const extension=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg"; const storagePath=`banners/${crypto.randomUUID()}.${extension}`;
  const upload=await c.storage.from("car-images").upload(storagePath,file,{contentType:file.type,upsert:false,cacheControl:"31536000"});
  if(upload.error) redirect(`/admin/banners?error=${encodeURIComponent(`Rasmni yuklashda xatolik: ${upload.error.message}`)}`);
  const imageUrl=c.storage.from("car-images").getPublicUrl(storagePath).data.publicUrl;
  const result=await c.from("home_banners").insert({title_uz:text(formData,"titleUz"),title_ru:text(formData,"titleRu"),description_uz:text(formData,"descriptionUz"),description_ru:text(formData,"descriptionRu"),image_url:imageUrl,cta_uz:text(formData,"ctaUz"),cta_ru:text(formData,"ctaRu"),href:text(formData,"href"),sort_order:integer(formData,"sortOrder"),is_active:checked(formData,"isActive")}).select().single();
  if(result.error){await c.storage.from("car-images").remove([storagePath]); redirect(`/admin/banners?error=${encodeURIComponent(result.error.message)}`);}
  await c.from("audit_logs").insert({actor_id:user.id,action:"banner.created",entity_type:"home_banner",entity_id:result.data.id,metadata:{storage_path:storagePath}}); revalidatePath("/admin/banners"); revalidatePath("/");
}
export async function updateBannerAction(formData: FormData) {
  const user=await requireAdminUser(); const id=text(formData,"id"); if(!id) redirect("/admin/banners?error=Banner+topilmadi"); const c=createServiceRoleClient();
  const current=await c.from("home_banners").select("image_url").eq("id",id).single(); if(current.error) redirect(`/admin/banners?error=${encodeURIComponent(current.error.message)}`);
  let imageUrl=current.data.image_url; const file=formData.get("image"); let newStoragePath:string|null=null;
  if(file instanceof File && file.size>0){ if(!file.type.startsWith("image/")) redirect(`/admin/banners?error=${encodeURIComponent("Faqat rasm yuklang.")}`); if(file.size>10*1024*1024) redirect(`/admin/banners?error=${encodeURIComponent("Rasm hajmi 10 MB dan oshmasligi kerak.")}`); const extension=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg"; newStoragePath=`banners/${crypto.randomUUID()}.${extension}`; const upload=await c.storage.from("car-images").upload(newStoragePath,file,{contentType:file.type,upsert:false,cacheControl:"31536000"}); if(upload.error) redirect(`/admin/banners?error=${encodeURIComponent(upload.error.message)}`); imageUrl=c.storage.from("car-images").getPublicUrl(newStoragePath).data.publicUrl; }
  const result=await c.from("home_banners").update({title_uz:text(formData,"titleUz"),title_ru:text(formData,"titleRu"),description_uz:text(formData,"descriptionUz"),description_ru:text(formData,"descriptionRu"),image_url:imageUrl,cta_uz:text(formData,"ctaUz"),cta_ru:text(formData,"ctaRu"),href:text(formData,"href"),sort_order:integer(formData,"sortOrder"),is_active:checked(formData,"isActive")}).eq("id",id);
  if(result.error){if(newStoragePath) await c.storage.from("car-images").remove([newStoragePath]); redirect(`/admin/banners?error=${encodeURIComponent(result.error.message)}`);}
  await c.from("audit_logs").insert({actor_id:user.id,action:"banner.updated",entity_type:"home_banner",entity_id:id,metadata:{}}); revalidatePath("/admin/banners"); revalidatePath("/");
}
export async function toggleBannerAction(formData: FormData){await requireAdminUser();const id=text(formData,"id");const active=checked(formData,"isActive");if(!id)throw new Error("Banner topilmadi");const c=createServiceRoleClient();await c.from("home_banners").update({is_active:active}).eq("id",id);revalidatePath("/admin/banners");revalidatePath("/");}
export async function deleteBannerAction(formData: FormData){const user=await requireAdminUser();const id=text(formData,"id");const imageUrl=text(formData,"imageUrl");if(!id)throw new Error("Banner topilmadi");const c=createServiceRoleClient();const result=await c.from("home_banners").delete().eq("id",id).select("id").single();if(result.error)redirect(`/admin/banners?error=${encodeURIComponent(result.error.message)}`);const marker="/storage/v1/object/public/car-images/";if(imageUrl?.includes(marker)){const storagePath=decodeURIComponent(imageUrl.split(marker)[1].split("?")[0]);await c.storage.from("car-images").remove([storagePath]);}await c.from("audit_logs").insert({actor_id:user.id,action:"banner.deleted",entity_type:"home_banner",entity_id:id,metadata:{image_url:imageUrl}});revalidatePath("/admin/banners");revalidatePath("/");}
