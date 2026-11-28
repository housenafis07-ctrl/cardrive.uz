import { NextResponse } from "next/server";
import { getTelegramRuntimeConfig } from "@/lib/telegram-runtime";
import { verifyTelegramWebAppInitData } from "@/lib/telegram-webapp-auth";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const { token } = getTelegramRuntimeConfig();
  if (!token) return NextResponse.json({ error: "TELEGRAM_NOT_CONFIGURED" }, { status: 503 });
  const body = await request.json().catch(() => null) as { initData?: unknown } | null;
  if (!body || typeof body.initData !== "string") return NextResponse.json({ error: "INIT_DATA_REQUIRED" }, { status: 400 });
  const verified = verifyTelegramWebAppInitData(body.initData, token);
  if (!verified) return NextResponse.json({ error: "INVALID_OR_EXPIRED_INIT_DATA" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    telegramUser: {
      id: String(verified.user.id),
      firstName: verified.user.first_name,
      lastName: verified.user.last_name ?? null,
      username: verified.user.username ?? null,
    },
    authDate: verified.authDate,
  }, { headers: { "Cache-Control": "no-store" } });
}
