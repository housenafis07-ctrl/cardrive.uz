import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/supabase/server";
import { getServerEnv } from "@/lib/env";

const COOKIE_NAME = "cardrive_customer_session";
const MAX_AGE = 60 * 60 * 24 * 30;

type Customer = { id: string; phone: string | null };

function secret() {
  return getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
}

function sign(phone: string) {
  return createHmac("sha256", secret()).update(phone).digest("base64url");
}

function encode(phone: string) {
  return `${Buffer.from(phone, "utf8").toString("base64url")}.${sign(phone)}`;
}

function decode(value: string) {
  const [encodedPhone, providedSignature] = value.split(".");
  if (!encodedPhone || !providedSignature) return null;
  let phone: string;
  try {
    phone = Buffer.from(encodedPhone, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(phone);
  const a = Buffer.from(providedSignature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return phone;
}

export async function establishCustomerSession(phone: string) {
  const normalized = phone.trim();
  if (!normalized) throw new Error("Telefon raqami yaroqsiz");

  const result = await createServiceRoleClient()
    .from("profiles")
    .select("id,phone,is_active")
    .eq("phone", normalized)
    .maybeSingle();

  if (result.error) throw new Error("Mijoz ma'lumotlarini tekshirib bo'lmadi");
  if (!result.data || result.data.is_active === false) {
    throw new Error("Bu telefon raqami bilan mijoz topilmadi");
  }

  const store = await cookies();
  store.set(COOKIE_NAME, encode(normalized), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const phone = decode(value);
  if (!phone) return null;

  const result = await createServiceRoleClient()
    .from("profiles")
    .select("id,phone,is_active")
    .eq("phone", phone)
    .maybeSingle();

  if (result.error || !result.data || result.data.is_active === false) return null;
  return { id: result.data.id, phone: result.data.phone };
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
