import { NextResponse } from "next/server";
import { syncCbuUsdRate } from "@/lib/cbu-exchange-rates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncCbuUsdRate();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron:cbu-rates] sync failed", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown CBU sync error",
    }, { status: 502 });
  }
}
