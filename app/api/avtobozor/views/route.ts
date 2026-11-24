import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/supabase/server";

export const dynamic = "force-dynamic";
const COOKIE = "cardrive_avtobozor_visitor";
const MAX_AGE = 60 * 60 * 24 * 365;

function signature(id: string) {
  return createHmac("sha256", getServerEnv().SUPABASE_SERVICE_ROLE_KEY)
    .update("avtobozor-viewer:" + id).digest("base64url");
}

function readVisitor(value?: string) {
  if (!value) return null;
  const [id, provided] = value.split(".");
  if (!id || !provided || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const expected = signature(id);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export async function POST(request: Request) {
  let body: { listingId?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Noto‘g‘ri so‘rov" }, { status: 400 });
  }
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) {
    return NextResponse.json({ error: "E’lon identifikatori noto‘g‘ri" }, { status: 400 });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const rawCookie = cookieHeader.split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  const existing = readVisitor(rawCookie);
  const visitorId = existing || randomUUID();
  const visitorHash = createHmac("sha256", getServerEnv().SUPABASE_SERVICE_ROLE_KEY)
    .update("avtobozor-view:" + visitorId).digest("hex");

  const db = createServiceRoleClient();
  const { data, error } = await db.rpc("record_used_car_listing_view", {
    p_listing_id: listingId,
    p_visitor_hash: visitorHash,
  });
  if (error) {
    console.error("[avtobozor-views] record failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Ko‘rish hisoblagichini yangilab bo‘lmadi" }, { status: 503 });
  }

  const response = NextResponse.json({ viewCount: Number(data) || 0 }, {
    headers: { "Cache-Control": "no-store, private" },
  });
  if (!existing) response.cookies.set(COOKIE, visitorId + "." + signature(visitorId), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
  return response;
}
