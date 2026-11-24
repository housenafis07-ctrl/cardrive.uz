import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-session";
import { createServiceRoleClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Tizimga kiring" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Murojaat topilmadi" }, { status: 404 });
  const db = createServiceRoleClient();
  const { data: inquiry, error: inquiryError } = await db.from("used_car_inquiries")
    .select("id,buyer_profile_id,seller_profile_id,message,created_at,status")
    .eq("id", id).maybeSingle();
  if (inquiryError || !inquiry || (inquiry.buyer_profile_id !== customer.id && inquiry.seller_profile_id !== customer.id)) {
    return NextResponse.json({ error: "Murojaat topilmadi" }, { status: 404 });
  }
  const { data: messages, error } = await db.from("used_car_inquiry_messages")
    .select("id,sender_profile_id,message,created_at,read_at")
    .eq("inquiry_id", id).order("created_at", { ascending: true }).limit(500);
  if (error) return NextResponse.json({ error: "Xabarlarni yuklab bo‘lmadi" }, { status: 500 });
  return NextResponse.json({ inquiry, messages: messages ?? [] }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Xabar yuborish uchun tizimga kiring" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Murojaat topilmadi" }, { status: 404 });
  let body: { message?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Noto‘g‘ri so‘rov" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 1 || message.length > 2000) {
    return NextResponse.json({ error: "Xabar 1–2000 belgi bo‘lishi kerak" }, { status: 400 });
  }

  const db = createServiceRoleClient();
  const { data: inquiry, error: inquiryError } = await db.from("used_car_inquiries")
    .select("id,buyer_profile_id,seller_profile_id,status")
    .eq("id", id).maybeSingle();
  if (inquiryError || !inquiry || (inquiry.buyer_profile_id !== customer.id && inquiry.seller_profile_id !== customer.id)) {
    return NextResponse.json({ error: "Murojaat topilmadi" }, { status: 404 });
  }
  if (inquiry.status === "closed") return NextResponse.json({ error: "Yopilgan murojaatga xabar yuborib bo‘lmaydi" }, { status: 409 });

  const { data, error } = await db.from("used_car_inquiry_messages")
    .insert({ inquiry_id: id, sender_profile_id: customer.id, message })
    .select("id,sender_profile_id,message,created_at,read_at").single();
  if (error) return NextResponse.json({ error: "Xabarni saqlab bo‘lmadi" }, { status: 500 });

  const nextStatus = customer.id === inquiry.seller_profile_id ? "replied" : "read";
  await db.from("used_car_inquiries").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ message: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
