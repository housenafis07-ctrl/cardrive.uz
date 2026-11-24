import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Tizimga kiring" }, { status: 401 });
  const db = createServiceRoleClient();
  const { data, error } = await db.from("used_car_inquiries")
    .select("id,listing_id,seller_profile_id,buyer_profile_id,message,status,created_at,updated_at,used_car_listings(brand,model,year,slug)")
    .or("buyer_profile_id.eq." + customer.id + ",seller_profile_id.eq." + customer.id)
    .order("updated_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Murojaatlarni yuklab bo‘lmadi" }, { status: 500 });
  return NextResponse.json({ inquiries: data ?? [] }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Murojaat yuborish uchun tizimga kiring" }, { status: 401 });
  let body: { listingId?: unknown; message?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Noto‘g‘ri so‘rov" }, { status: 400 });
  }
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(listingId) || message.length < 3 || message.length > 1000) {
    return NextResponse.json({ error: "Xabar 3–1000 belgi bo‘lishi kerak" }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { data: listing, error: listingError } = await db.from("used_car_listings")
    .select("id,owner_profile_id").eq("id", listingId).eq("status", "active")
    .gt("expires_at", new Date().toISOString()).maybeSingle();
  if (listingError || !listing) return NextResponse.json({ error: "Faol e’lon topilmadi" }, { status: 404 });
  if (listing.owner_profile_id === customer.id) {
    return NextResponse.json({ error: "O‘zingizning e’loningizga murojaat yubora olmaysiz" }, { status: 400 });
  }

  const { data, error } = await db.from("used_car_inquiries").insert({
    listing_id: listing.id,
    seller_profile_id: listing.owner_profile_id,
    buyer_profile_id: customer.id,
    message,
    status: "new",
  }).select("id,listing_id,seller_profile_id,buyer_profile_id,message,status,created_at,updated_at").single();
  if (error) {
    console.error("[avtobozor-inquiries] create failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Murojaatni saqlab bo‘lmadi" }, { status: 500 });
  }
  return NextResponse.json({ inquiry: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
