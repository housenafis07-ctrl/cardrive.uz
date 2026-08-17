import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/supabase/server";
import { getServerEnv } from "@/lib/env";

const COOKIE_NAME = "cardrive_customer_session";
const MAX_AGE = 60 * 60 * 24 * 30;
type Customer = { id: string; phone: string | null; full_name?: string | null };
function secret() { return getServerEnv().SUPABASE_SERVICE_ROLE_KEY; }
function sign(phone: string) { return createHmac("sha256", secret()).update(phone).digest("base64url"); }
function encode(phone: string) { return `${Buffer.from(phone, "utf8").toString("base64url")}.${sign(phone)}`; }
function decode(value: string) { const [encodedPhone, providedSignature] = value.split("."); if (!encodedPhone || !providedSignature) return null; let phone: string; try { phone = Buffer.from(encodedPhone, "base64url").toString("utf8"); } catch { return null; } const expected = sign(phone); const a = Buffer.from(providedSignature); const b = Buffer.from(expected); if (a.length !== b.length || !timingSafeEqual(a, b)) return null; return phone; }
async function setSession(phone: string) { const store = await cookies(); store.set(COOKIE_NAME, encode(phone), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE }); }
export async function establishCustomerSession(phone: string) { const normalized = phone.trim(); if (!normalized) throw new Error("Telefon raqami yaroqsiz"); const result = await createServiceRoleClient().from("profiles").select("id,phone,is_active").eq("phone", normalized).maybeSingle(); if (result.error) throw new Error("Mijoz ma'lumotlarini tekshirib bo'lmadi"); if (!result.data || result.data.is_active === false) throw new Error("Bu telefon raqami bilan mijoz topilmadi"); await setSession(normalized); }
export async function registerCustomer(phone: string, fullName: string) {
  const normalized = phone.trim(); const name = fullName.trim();
  if (!normalized) throw new Error("Telefon raqami yaroqsiz");
  if (name.length < 2) throw new Error("Ism va familiyangizni kiriting");
  const db = createServiceRoleClient();
  const existing = await db.from("profiles").select("id,phone,is_active").eq("phone", normalized).maybeSingle();
  if (existing.error) throw new Error("Mijoz ma'lumotlarini tekshirib bo'lmadi");
  if (existing.data) { if (existing.data.is_active === false) throw new Error("Mijoz profili faol emas"); await setSession(normalized); return; }
  const auth = await db.auth.admin.createUser({ phone: normalized, phone_confirm: true, user_metadata: { full_name: name } });
  if (auth.error || !auth.data.user) throw new Error("Mijoz akkauntini yaratib bo'lmadi");
  const created = await db.from("profiles").insert({ id: auth.data.user.id, phone: normalized, full_name: name, role: "customer", is_active: true }).select("id,phone").single();
  if (created.error || !created.data) { await db.auth.admin.deleteUser(auth.data.user.id); throw new Error("Mijoz profilini yaratib bo'lmadi"); }
  await setSession(normalized);
}
export async function getCurrentCustomer(): Promise<Customer | null> { const store = await cookies(); const value = store.get(COOKIE_NAME)?.value; if (!value) return null; const phone = decode(value); if (!phone) return null; const result = await createServiceRoleClient().from("profiles").select("id,phone,is_active,full_name").eq("phone", phone).maybeSingle(); if (result.error || !result.data || result.data.is_active === false) return null; return { id: result.data.id, phone: result.data.phone, full_name: result.data.full_name }; }
export async function clearCustomerSession() { const store = await cookies(); store.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 }); }
