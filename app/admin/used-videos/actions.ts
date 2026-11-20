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

  if (!id || !["approved", "rejected"].includes(status)) {
    redirect("/admin/used-videos?error=Invalid+request");
  }

  const db = createServiceRoleClient();

  // Keep the pending_review condition to prevent stale/double moderation,
  // but do not request a PostgREST representation in the UPDATE itself.
  const update = await db
    .from("used_car_listing_media")
    .update({
      status,
      moderation_note: status === "rejected" ? (note || "Video talabga mos emas") : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending_review");

  if (update.error) {
    console.error("[used-video-moderation] update failed", {
      code: update.error.code,
      message: update.error.message,
      details: update.error.details,
      hint: update.error.hint,
    });
    redirect("/admin/used-videos?error=Video+holatini+saqlashda+ma%27lumotlar+bazasi+xatosi");
  }

  // Verify separately. UPDATE ... SELECT can fail to return a row even when
  // the write succeeds, which previously produced a false error in the UI.
  const verification = await db
    .from("used_car_listing_media")
    .select("id,listing_id,status")
    .eq("id", id)
    .maybeSingle();

  if (verification.error) {
    console.error("[used-video-moderation] verification failed", {
      code: verification.error.code,
      message: verification.error.message,
    });
    redirect("/admin/used-videos?error=Video+holatini+tekshirib+bolmadi");
  }

  if (!verification.data || verification.data.status !== status) {
    redirect("/admin/used-videos?error=Video+topilmadi+yoki+allaqachon+moderatsiya+qilingan");
  }

  const audit = await db.from("audit_logs").insert({
    actor_id: moderator.id,
    action: "used_car_listing_video.moderated",
    entity_type: "used_car_listing_media",
    entity_id: id,
    metadata: { status, has_note: Boolean(note) },
  });

  if (audit.error) {
    // Moderation has already been committed; audit failure must not report
    // the moderation itself as failed.
    console.error("[used-video-moderation] audit log insert failed", {
      code: audit.error.code,
      message: audit.error.message,
    });
  }

  revalidatePath("/admin/used-videos");
  revalidatePath("/account/my-listings");
  revalidatePath("/avtobozor");
  if (verification.data.listing_id) {
    revalidatePath("/avtobozor/" + verification.data.listing_id);
  }

  redirect("/admin/used-videos?updated=1");
}
