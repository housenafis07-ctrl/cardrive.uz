import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getServerEnv } from "@/lib/env";
import { createTelegramAiListingClient } from "@/supabase/server";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { id } = await params;
  const db = createTelegramAiListingClient();
  const draft = await db.from("telegram_ai_listing_drafts").select("claimed_profile_id,status,expires_at").eq("id", id).maybeSingle();
  if (draft.error || !draft.data || draft.data.claimed_profile_id !== customer.id || draft.data.status !== "review" || new Date(draft.data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "DRAFT_NOT_AVAILABLE" }, { status: 404 });
  }
  const env = getServerEnv();
  if (!env.TELEGRAM_BOT_TOKEN) return NextResponse.json({ error: "TELEGRAM_NOT_CONFIGURED" }, { status: 503 });
  const photoRows = await db.from("telegram_ai_listing_draft_photos").select("telegram_file_id,sort_order").eq("draft_id", id).order("sort_order", { ascending: true }).order("created_at", { ascending: true }).limit(8);
  if (photoRows.error) return NextResponse.json({ error: "DRAFT_PHOTOS_UNAVAILABLE" }, { status: 503 });
  const ids = (photoRows.data ?? []).map((row: { telegram_file_id: string }) => row.telegram_file_id);
  const images = [];
  for (const fileId of ids) {
    const metaResponse = await fetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/getFile?file_id=" + encodeURIComponent(fileId), { cache: "no-store" });
    if (!metaResponse.ok) return NextResponse.json({ error: "TELEGRAM_FILE_UNAVAILABLE" }, { status: 502 });
    const meta = await metaResponse.json() as { ok?: boolean; result?: { file_path?: string } };
    const path = meta.result?.file_path;
    if (!meta.ok || !path || path.includes("..")) return NextResponse.json({ error: "TELEGRAM_FILE_UNAVAILABLE" }, { status: 502 });
    const imageResponse = await fetch("https://api.telegram.org/file/bot" + env.TELEGRAM_BOT_TOKEN + "/" + path, { cache: "no-store" });
    if (!imageResponse.ok) return NextResponse.json({ error: "TELEGRAM_FILE_UNAVAILABLE" }, { status: 502 });
    const type = imageResponse.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    if (!["image/jpeg", "image/png", "image/webp"].includes(type)) continue;
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) continue;
    images.push({ name: "telegram-photo-" + (images.length + 1), dataUrl: "data:" + type + ";base64," + bytes.toString("base64") });
  }
  return NextResponse.json({ images }, { headers: { "Cache-Control": "private, no-store" } });
}
