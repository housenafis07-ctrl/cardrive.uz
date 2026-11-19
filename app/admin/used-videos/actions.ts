"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";

export async function moderateUsedCarVideoAction(form: FormData) {
  const moderator = await requireAdminUser();
  const id = String(form.get("mediaId") ?? "").trim();
  const status = String(form.get("status") ?? "").trim();
  const note = String(form.get("moderationNote") ?? "").trim().slice(0, 500);
  if (!id || !["approved", "rejected"].includes(status)) redirect("/admin/used-videos?error=Invalid+request");
  const db = createServiceRoleClient();
  const result = await db.from("used_car_listing_media").update({
    status, moderation_note: status === "rejected" ? (note || "Video talabga mos emas") : null,
  }).eq("id", id).eq("status", "pending_review").select("id,listing_id").maybeSingle();
  if (result.error || !result.data) redirect("/admin/used-videos?error=Video+holatini+yangilab+bolmadi");
  await db.from("audit_logs").insert({
    actor_id: moderator.id, action: "used_car_listing_video.moderated",
    entity_type: "used_car_listing_media", entity_id: id, metadata: { status, has_note: Boolean(note) },
  });
  revalidatePath("/admin/used-videos");
  revalidatePath("/account/my-listings");
  revalidatePath("/avtobozor");
  redirect("/admin/used-videos?updated=1");
}
