"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";

export async function moderateUsedCarListingAction(form: FormData) {
  const moderator = await requireAdminUser();
  const id = String(form.get("listingId") ?? "").trim();
  const status = String(form.get("status") ?? "").trim();
  const note = String(form.get("moderationNote") ?? "").trim().slice(0, 500);
  if (!id || !["active","rejected"].includes(status)) redirect("/admin/used-listings?error=Invalid+request");
  const db = createServiceRoleClient();
  const result = await db.from("used_car_listings").update({
    status, moderation_note: status === "rejected" ? (note || "Ma'lumotlarni to'ldiring va qayta yuboring") : null,
  }).eq("id", id).eq("status", "pending_review").select("id").maybeSingle();
  if (result.error || !result.data) redirect("/admin/used-listings?error=E'lon+holatini+yangilab+bolmadi");
  await db.from("audit_logs").insert({
    actor_id: moderator.id, action: "used_car_listing.moderated",
    entity_type: "used_car_listing", entity_id: id, metadata: { status, has_note: Boolean(note) },
  });
  revalidatePath("/admin/used-listings");
  revalidatePath("/avtobozor");
  redirect("/admin/used-listings?updated=1");
}
