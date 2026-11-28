"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient, createTelegramAiListingClient } from "@/supabase/server";

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
  const aiDraftId = text(form, "aiDraftId");
  const db = createServiceRoleClient();
  if (aiDraftId) {
    const draftDb = createTelegramAiListingClient();
    const draft = await draftDb.from("telegram_ai_listing_drafts").select("id,status,claimed_profile_id,expires_at")
      .eq("id", aiDraftId).maybeSingle();
    if (draft.error || !draft.data || draft.data.status !== "review" ||
        draft.data.claimed_profile_id !== customer.id || new Date(draft.data.expires_at).getTime() < Date.now()) {
      redirect("/avtobozor?error=AI+Draft+tasdiqlanmadi+yoki+muddati+tugagan");
    }
  }

  const brand = text(form, "brand");
  const model = text(form, "model");
  const year = number(form, "year");
  const mileageRaw = text(form, "mileageKm");
  const mileage = Number(mileageRaw);
  const vehicleCondition = text(form, "vehicleCondition");
  const conditionDescription = text(form, "conditionDescription");
  const price = number(form, "price");
  const region = text(form, "region");
  const descriptionBase = text(form, "description");
  const description = [descriptionBase, text(form, "trim") ? "Komplektatsiya: " + text(form, "trim") : "", text(form, "gasCylinder") ? "Gaz balloni: " + text(form, "gasCylinder") : ""].filter(Boolean).join("\\n");
  const contactName = text(form, "contactName");
  const currency = text(form, "currency") || "UZS";
  const files = form.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);

  if (!brand || brand.length > 80 || !model || model.length > 100) redirect("/avtobozor/yangi-elon?error=Brend+va+modelni+tekshiring");
  if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 1) redirect("/avtobozor/yangi-elon?error=Ishlab+chiqarilgan+yil+notogri");
  if (!mileageRaw || !Number.isInteger(mileage) || mileage < 0 || mileage > 2_000_000) redirect("/avtobozor/yangi-elon?error=Yurgan+masofani+tekshiring");
  if (!["ideal", "good", "minor_defects", "body_repair", "major_repair", "parts_only"].includes(vehicleCondition) || conditionDescription.length < 10 || conditionDescription.length > 1200) redirect("/avtobozor/yangi-elon?error=Avtomobil+holatini+tekshiring");
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000_000_000) redirect("/avtobozor/yangi-elon?error=Narxni+tekshiring");
  if (!["UZS", "USD"].includes(currency)) redirect("/avtobozor/yangi-elon?error=Valyuta+notogri");
  if (!["uzbekistan", "foreign", "unknown"].includes(text(form, "countryOfOrigin")) || !region || region.length > 80 || description.length < 20 || description.length > 5000 || !contactName || contactName.length > 100) redirect("/avtobozor/yangi-elon?error=Majburiy+maydonlarni+tolldiring");
  if (files.length > 8) redirect("/avtobozor/yangi-elon?error=Eng+kopi+8+ta+rasm+yuklash+mumkin");
  if (files.some(file => !allowedMime.has(file.type) || file.size > 8 * 1024 * 1024)) redirect("/avtobozor/yangi-elon?error=Rasmlar+JPG,+PNG+yoki+WEBP+va+8MB+dan+kichik+bolishi+kerak");

  const profile = await db.from("profiles").select("full_name,phone,is_active").eq("id", customer.id).maybeSingle();
  if (profile.error || !profile.data || profile.data.is_active === false || !profile.data.phone) redirect("/account/login");

  const id = randomUUID();
  const reservation = await db.rpc("reserve_used_car_listing_slot", {
    p_customer_profile_id: customer.id,
    p_listing_id: id,
  });
  const reservationRow = Array.isArray(reservation.data) ? reservation.data[0] : reservation.data;
  if (reservation.error || !reservationRow?.allowed) {
    redirect("/avtobozor/yangi-elon?error=" + encodeURIComponent(
      reservationRow?.reason === "free_limit_reached"
        ? "3 ta bepul e'lon limiti tugagan. Yangi e'lon uchun qo'shimcha e'lon slotini xarid qiling."
        : "E'lon limiti tekshiruvida xatolik. Qayta urinib ko'ring."
    ));
  }
  const releaseSlot = async () => {
    await db.rpc("release_used_car_listing_slot", {
      p_customer_profile_id: customer.id,
      p_listing_id: id,
    });
  };
  const slug = `${slugPart(brand)}-${slugPart(model)}-${year}-${id.slice(0, 8)}`;
  const inserted = await db.from("used_car_listings").insert({
    id, owner_profile_id: customer.id, slug, brand, model, year, mileage_km: mileage,
    price, currency, country_of_origin: text(form, "countryOfOrigin") || "unknown", region, district: text(form, "district") || null,
    body_type: text(form, "bodyType") || null, fuel_type: text(form, "fuelType") || null,
    transmission: text(form, "transmission") || null,
    engine_volume: text(form, "engineVolume") ? number(form, "engineVolume") : null,
    color: text(form, "color") || null, vehicle_condition: vehicleCondition,
    condition_description: conditionDescription, description, contact_name: contactName,
    contact_phone: profile.data.phone, seller_type: "private",
    is_negotiable: form.get("isNegotiable") === "on", status: "pending_review",
  }).select("id").single();
  if (inserted.error) {
    await releaseSlot();
    redirect(`/avtobozor/yangi-elon?error=${encodeURIComponent("E'lonni saqlab bo'lmadi. Qayta urinib ko'ring.")}`);
  }

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
    await releaseSlot();
    redirect("/avtobozor/yangi-elon?error=Rasmlarni+yuklashda+xatolik.+Qayta+urinib+koring");
  }

  const finalized = await db.rpc("finalize_used_car_listing_slot", {
    p_customer_profile_id: customer.id,
    p_listing_id: id,
  });
  if (finalized.error || finalized.data !== true) {
    await db.from("used_car_listings").delete().eq("id", id).eq("owner_profile_id", customer.id);
    if (uploaded.length) await db.storage.from("used-car-images").remove(uploaded);
    await releaseSlot();
    redirect("/avtobozor/yangi-elon?error=Limit+tasdigida+xatolik.+Qayta+urinib+koring");
  }

  if (aiDraftId) {
    const draftDb = createTelegramAiListingClient();
    const draftUpdate = await draftDb.from("telegram_ai_listing_drafts")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", aiDraftId).eq("claimed_profile_id", customer.id).eq("status", "review");
    if (draftUpdate.error) console.error("[avtobozor-ai-draft] status update failed", { code: draftUpdate.error.code });
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
    .eq("id", id).eq("owner_profile_id", customer.id).in("status", ["active", "reserved"]);
  if (result.error) redirect("/account/my-listings?error=Holatni+ozgartirib+bolmadi");
  await db.from("audit_logs").insert({
    actor_id: customer.id, action: `used_car_listing.${status}`,
    entity_type: "used_car_listing", entity_id: id, metadata: {},
  });
  revalidatePath("/avtobozor");
  revalidatePath("/account/my-listings");
  redirect("/account/my-listings?updated=1");
}

export async function updateMyUsedCarListingAction(form: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=%2Faccount%2Fmy-listings");
  const id = text(form, "listingId");
  const brand = text(form, "brand"), model = text(form, "model");
  const year = number(form, "year"), mileage = number(form, "mileageKm"), price = number(form, "price");
  const currency = text(form, "currency") || "UZS", origin = text(form, "countryOfOrigin") || "unknown";
  const condition = text(form, "vehicleCondition"), conditionDescription = text(form, "conditionDescription");
  const description = text(form, "description"), region = text(form, "region"), contactName = text(form, "contactName");
  if (!id || !brand || brand.length > 80 || !model || model.length > 100 ||
      !Number.isInteger(year) || year < 1950 || year > new Date().getFullYear()+1 ||
      !Number.isInteger(mileage) || mileage < 0 || mileage > 2000000 ||
      !Number.isFinite(price) || price <= 0 || !["UZS","USD"].includes(currency) ||
      !["uzbekistan","foreign"].includes(origin) ||
      !["ideal","good","minor_defects","body_repair","major_repair","parts_only"].includes(condition) ||
      conditionDescription.length < 10 || conditionDescription.length > 1200 ||
      description.length < 20 || description.length > 5000 || !region || region.length > 80 ||
      !contactName || contactName.length > 100) redirect("/account/my-listings?error=Maydonlarni+tekshiring");
  const db = createServiceRoleClient();
  const result = await db.from("used_car_listings").update({
    brand, model, year, mileage_km:mileage, price, currency, country_of_origin:origin,
    region, district:text(form,"district")||null, body_type:text(form,"bodyType")||null,
    fuel_type:text(form,"fuelType")||null, transmission:text(form,"transmission")||null,
    engine_volume:text(form,"engineVolume")?number(form,"engineVolume"):null,
    color:text(form,"color")||null, vehicle_condition:condition, condition_description:conditionDescription,
    description, contact_name:contactName, is_negotiable:form.get("isNegotiable")==="on",
    status:"pending_review", moderation_note:null, updated_at:new Date().toISOString(),
  }).eq("id",id).eq("owner_profile_id",customer.id).in("status",["active","pending_review","rejected","reserved"]);
  if (result.error) redirect("/account/my-listings?error=E'lonni+yangilab+bo'lmadi");
  await db.from("audit_logs").insert({actor_id:customer.id,action:"used_car_listing.updated",entity_type:"used_car_listing",entity_id:id,metadata:{status:"pending_review"}});
  revalidatePath("/avtobozor"); revalidatePath("/account/my-listings");
  redirect("/account/my-listings?updated=1");
}
