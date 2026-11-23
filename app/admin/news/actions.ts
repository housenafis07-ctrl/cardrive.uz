"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";
import { createNewsEditorialClient } from "@/supabase/server";

export async function moderateNewsArticleAction(formData: FormData) {
  const moderator = await requireAdminUser();
  const id = String(formData.get("articleId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !["approved", "rejected"].includes(status)) redirect("/admin/news?error=" + encodeURIComponent("Noto‘g‘ri moderatsiya so‘rovi"));
  const db = createNewsEditorialClient();
  const result = await db.from("news_articles").update({ moderation_status: status, is_published: status === "approved" }).eq("id", id).eq("moderation_status", "pending").select("id").maybeSingle();
  if (result.error || !result.data) redirect("/admin/news?error=" + encodeURIComponent(result.error?.message || "Maqola holati yangilanmadi"));
  await db.from("audit_logs").insert({ actor_id: moderator.id, action: "news_article.moderated", entity_type: "news_article", entity_id: id, metadata: { moderation_status: status } });
  revalidatePath("/admin/news"); revalidatePath("/news"); revalidatePath("/"); revalidatePath("/sitemap.xml");
  redirect("/admin/news?updated=1");
}

export async function updateNewsEditorialAction(formData: FormData) {
  const moderator = await requireAdminUser();
  const id = String(formData.get("articleId") ?? "").trim();
  const value = (key: string) => String(formData.get(key) ?? "").trim();
  if (!id || !value("titleUz") || !value("titleRu") || !value("titleEn")) redirect("/admin/news?error=" + encodeURIComponent("Uch tildagi sarlavha majburiy"));
  const db = createNewsEditorialClient();
  const result = await db.from("news_articles").update({
    title_uz: value("titleUz"), title_ru: value("titleRu"), title_en: value("titleEn"),
    summary_uz: value("summaryUz") || null, summary_ru: value("summaryRu") || null, summary_en: value("summaryEn") || null,
    editorial_note_uz: value("editorialNoteUz") || null, editorial_note_ru: value("editorialNoteRu") || null,
    is_featured: formData.get("isFeatured") === "on",
    ticker_order: Math.max(0, Math.min(9999, Number.parseInt(value("tickerOrder") || "100", 10) || 100)),
  }).eq("id", id).select("id").maybeSingle();
  if (result.error || !result.data) redirect("/admin/news?error=" + encodeURIComponent(result.error?.message || "Maqola tahriri saqlanmadi"));
  await db.from("audit_logs").insert({ actor_id: moderator.id, action: "news_article.edited", entity_type: "news_article", entity_id: id, metadata: { is_featured: formData.get("isFeatured") === "on" } });
  revalidatePath("/admin/news"); revalidatePath("/news"); revalidatePath("/"); revalidatePath("/sitemap.xml");
  redirect("/admin/news?updated=1");
}
