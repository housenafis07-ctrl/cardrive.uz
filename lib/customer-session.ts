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

  const supabase = createServiceRoleClient();
  const result = await supabase
    .from("profiles")
    .select("id,phone,is_active")
    .eq("phone", normalized)
    .maybeSingle();

  if (result.error) throw new Error("Mijoz ma'lumotlarini tekshirib bo'lmadi");

  let profile = result.data;

  // OTP orqali birinchi marta kirayotgan yangi mijoz uchun profilni avtomatik yaratamiz.
  if (!profile) {
    const created = await supabase
      .from("profiles")
      .insert({ phone: normalized, is_active: true })
      .select("id,phone,is_active")
      .single();

    if (created.error || !created.data) {
      // Parallel login paytida duplicate insert bo'lishi mumkin; qayta o'qiymiz.
      const existing = await supabase
        .from("profiles")
        .select("id,phone,is_active")
        .eq("phone", normalized)
        .maybeSingle();

      if (existing.error || !existing.data) {
        throw new Error("Mijoz profilini yaratib bo'lmadi");
      }
      profile = existing.data;
    } else {
      profile = created.data;
    }
  }

  if (profile.is_active === false) {
    throw new Error("Bu mijoz profili faol emas");
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
