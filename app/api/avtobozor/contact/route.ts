import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Kontaktni ko‘rish uchun tizimga kiring" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "E’lon topilmadi" }, { status: 400 });
  const db = createServiceRoleClient();
  const { data, error } = await db.from("used_car_listings")
    .select("contact_name,contact_phone")
    .eq("id", id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data?.contact_phone) return NextResponse.json({ error: "Kontakt mavjud emas" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ name: data.contact_name, phone: data.contact_phone }, { headers: { "Cache-Control": "no-store, private", "Vary": "Cookie" } });
}
