"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/supabase/server";

export async function moderateNewsArticleAction(formData: FormData) {
  const moderator = await requireAdminUser();
  const id = String(formData.get("articleId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !["approved", "rejected"].includes(status)) {
    redirect("/admin/news?error=" + encodeURIComponent("Noto‘g‘ri moderatsiya so‘rovi"));
  }

  const db = createServiceRoleClient();
  const result = await db.from("news_articles")
    .update({ moderation_status: status, is_published: status === "approved" })
    .eq("id", id)
    .eq("moderation_status", "pending")
    .select("id")
    .maybeSingle();

  if (result.error || !result.data) {
    redirect("/admin/news?error=" + encodeURIComponent(result.error?.message || "Maqola holati yangilanmadi"));
  }

  await db.from("audit_logs").insert({
    actor_id: moderator.id,
    action: "news_article.moderated",
    entity_type: "news_article",
    entity_id: id,
    metadata: { moderation_status: status },
  });

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
  redirect("/admin/news?updated=1");
}
