import { NextResponse } from "next/server";
import { syncCbuUsdRate } from "@/lib/cbu-exchange-rates";
import { syncNewsFeeds } from "@/lib/news-aggregator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  } = {
    cbu: { ok: false },
    news: { ok: false },
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

  const ok = results.cbu.ok && results.news.ok;
  return NextResponse.json({ ok, ...results }, { status: ok ? 200 : 502 });
}
