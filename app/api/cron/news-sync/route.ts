import { NextResponse } from "next/server";
import { syncNewsFeeds } from "@/lib/news-aggregator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const news = await syncNewsFeeds({ force: true });
    const ok = news.failed === 0;
    return NextResponse.json({ ok, news }, { status: ok ? 200 : 502 });
  } catch (error) {
    console.error("[cron:news-sync] News sync failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown news sync error",
      },
      { status: 502 },
    );
  }
}
