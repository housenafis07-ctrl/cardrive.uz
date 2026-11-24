import { NextResponse } from "next/server";
import { syncCbuUsdRate } from "@/lib/cbu-exchange-rates";
import { syncNewsFeeds } from "@/lib/news-aggregator";
import { createServiceRoleClient } from "@/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function archiveExpiredUsedCarListings() {
  const db = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data, count, error } = await db
    .from("used_car_listings")
    .update({ status: "archived" }, { count: "exact" })
    .eq("status", "active")
    .lte("expires_at", now)
    .select("id");

  if (error) throw error;
  return { archivedCount: count ?? data?.length ?? 0, checkedAt: now };
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const results: {
    cbu: { ok: boolean; data?: Awaited<ReturnType<typeof syncCbuUsdRate>>; error?: string };
    news: { ok: boolean; data?: Awaited<ReturnType<typeof syncNewsFeeds>>; error?: string };
    usedCarListings: { ok: boolean; data?: Awaited<ReturnType<typeof archiveExpiredUsedCarListings>>; error?: string };
  } = {
    cbu: { ok: false },
    news: { ok: false },
    usedCarListings: { ok: false },
  };

  try {
    results.cbu = { ok: true, data: await syncCbuUsdRate() };
  } catch (error) {
    results.cbu = { ok: false, error: error instanceof Error ? error.message : "Unknown CBU sync error" };
    console.error("[cron:daily-sync] CBU sync failed", error);
  }

  try {
    results.news = { ok: true, data: await syncNewsFeeds({ force: true }) };
  } catch (error) {
    results.news = { ok: false, error: error instanceof Error ? error.message : "Unknown news sync error" };
    console.error("[cron:daily-sync] news sync failed", error);
  }

  try {
    results.usedCarListings = { ok: true, data: await archiveExpiredUsedCarListings() };
  } catch (error) {
    results.usedCarListings = { ok: false, error: error instanceof Error ? error.message : "Unknown Avtobozor expiry error" };
    console.error("[cron:daily-sync] expired Avtobozor listings archive failed", error);
  }

  const ok = results.cbu.ok && results.news.ok && results.usedCarListings.ok;
  return NextResponse.json({ ok, ...results }, { status: ok ? 200 : 502 });
}
