"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
};
const number = (form: FormData, key: string) => Number(text(form, key));
const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
const slugPart = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35);

export async function createUsedCarListingAction(form: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=%2Favtobozor%2Fyangi-elon");

  const brand = text(form, "brand");
  const model = text(form, "model");
  const year = number(form, "year");
  const mileage = number(form, "mileageKm");
  const price = number(form, "price");
  const region = text(form, "region");
  const description = text(form, "description");
  const contactName = text(form, "contactName");
  const currency = text(form, "currency") || "UZS";
  const files = form.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);

  if (!brand || brand.length > 80 || !model || model.length > 100) redirect("/avtobozor/yangi-elon?error=Brend+va+modelni+tekshiring");
  if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) redirect("/avtobozor/yangi-elon?error=Ishlab+chiqarilgan+yil+notogri");
  if (!Number.isInteger(mileage) || mileage < 0 || mileage > 2_000_000) redirect("/avtobozor/yangi-elon?error=Yurgan+masofani+tekshiring");
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000_000_000) redirect("/avtobozor/yangi-elon?error=Narxni+tekshiring");
  if (!["UZS", "USD"].includes(currency)) redirect("/avtobozor/yangi-elon?error=Valyuta+notogri");
  if (!region || region.length > 80 || description.length < 20 || description.length > 5000 || !contactName || contactName.length > 100) redirect("/avtobozor/yangi-elon?error=Majburiy+maydonlarni+tolldiring");
  if (files.length > 8) redirect("/avtobozor/yangi-elon?error=Eng+kopi+8+ta+rasm+yuklash+mumkin");
  if (files.some(file => !allowedMime.has(file.type) || file.size > 8 * 1024 * 1024)) redirect("/avtobozor/yangi-elon?error=Rasmlar+JPG,+PNG+yoki+WEBP+va+8MB+dan+kichik+bolishi+kerak");

  const db = createServiceRoleClient();
  const profile = await db.from("profiles").select("full_name,phone,is_active").eq("id", customer.id).maybeSingle();
  if (profile.error || !profile.data || profile.data.is_active === false || !profile.data.phone) redirect("/account/login");

  const id = randomUUID();
  const slug = `${slugPart(brand)}-${slugPart(model)}-${year}-${id.slice(0, 8)}`;
  const inserted = await db.from("used_car_listings").insert({
    id, owner_profile_id: customer.id, slug, brand, model, year, mileage_km: mileage,
    price, currency, region, district: text(form, "district") || null,
    body_type: text(form, "bodyType") || null, fuel_type: text(form, "fuelType") || null,
    transmission: text(form, "transmission") || null,
    engine_volume: text(form, "engineVolume") ? number(form, "engineVolume") : null,
    color: text(form, "color") || null, description, contact_name: contactName,
    contact_phone: profile.data.phone, seller_type: "private",
    is_negotiable: form.get("isNegotiable") === "on", status: "pending_review",
  }).select("id").single();
  if (inserted.error) redirect(`/avtobozor/yangi-elon?error=${encodeURIComponent("E'lonni saqlab bo'lmadi. Qayta urinib ko'ring.")}`);

  const uploaded: string[] = [];
  try {
    for (const [index, file] of files.entries()) {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${customer.id}/${id}/${randomUUID()}.${extension}`;
      const upload = await db.storage.from("used-car-images").upload(path, file, {
        contentType: file.type, upsert: false, cacheControl: "31536000",
      });
      if (upload.error) throw new Error("Rasm yuklanmadi");
      uploaded.push(path);
      const publicUrl = db.storage.from("used-car-images").getPublicUrl(path).data.publicUrl;
      const imageInsert = await db.from("used_car_listing_images").insert({
        listing_id: id, storage_path: path, public_url: publicUrl,
        alt_text: `${brand} ${model}`, sort_order: index, is_primary: index === 0,
      });
      if (imageInsert.error) throw new Error("Rasm ma'lumotini saqlab bo'lmadi");
    }
  } catch {
    await db.from("used_car_listings").delete().eq("id", id);
    if (uploaded.length) await db.storage.from("used-car-images").remove(uploaded);
    redirect("/avtobozor/yangi-elon?error=Rasmlarni+yuklashda+xatolik.+Qayta+urinib+koring");
  }

  await db.from("audit_logs").insert({
    actor_id: customer.id, action: "used_car_listing.created",
    entity_type: "used_car_listing", entity_id: id, metadata: { status: "pending_review", image_count: uploaded.length },
  });
  revalidatePath("/avtobozor");
  revalidatePath("/account/my-listings");
  redirect("/account/my-listings?submitted=1");
}

export async function updateMyUsedCarListingStatusAction(form: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");
  const id = text(form, "listingId");
  const status = text(form, "status");
  if (!id || !["sold", "archived"].includes(status)) redirect("/account/my-listings?error=Sorov+yaroqsiz");
  const db = createServiceRoleClient();
  const result = await db.from("used_car_listings")
    .update({ status, sold_at: status === "sold" ? new Date().toISOString() : null })
    .eq("id", id).eq("owner_profile_id", customer.id).in("status", ["active", "reserved", "rejected"]);
  if (result.error) redirect("/account/my-listings?error=Holatni+ozgartirib+bolmadi");
  await db.from("audit_logs").insert({
    actor_id: customer.id, action: `used_car_listing.${status}`,
    entity_type: "used_car_listing", entity_id: id, metadata: {},
  });
  revalidatePath("/avtobozor");
  revalidatePath("/account/my-listings");
  redirect("/account/my-listings?updated=1");
}
