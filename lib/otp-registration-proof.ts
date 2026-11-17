import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/supabase/server";
import { normalizeUzbekPhone } from "@/schemas/common";
import type { OtpPurpose } from "@/types/domain";

const COOKIE_NAME = "cardrive_otp_registration_proof";
const PROOF_TTL_SECONDS = 5 * 60;

type ProofPayload = {
  otpId: string;
  phone: string;
  purpose: OtpPurpose;
  expiresAt: number;
};

function signingKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function sign(value: string): string {
  const key = signingKey();
  if (!key) throw new Error("OTP proof signing key is not configured");
  return createHmac("sha256", key).update(value, "utf8").digest("base64url");
}

function encode(payload: ProofPayload): string {
  const value = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${value}.${sign(value)}`;
}

function decode(value: string): ProofPayload | null {
  const [encoded, suppliedSignature] = value.split(".");
  if (!encoded || !suppliedSignature) return null;

  const expectedSignature = sign(encoded);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ProofPayload;
    if (
      typeof payload.otpId !== "string" ||
      typeof payload.phone !== "string" ||
      !["login", "order"].includes(payload.purpose) ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now()
    ) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setOtpRegistrationProof(input: {
  otpId: string;
  phone: string;
  purpose: OtpPurpose;
}): Promise<void> {
  const store = await cookies();
  store.set(
    COOKIE_NAME,
    encode({
      otpId: input.otpId,
      phone: normalizeUzbekPhone(input.phone),
      purpose: input.purpose,
      expiresAt: Date.now() + PROOF_TTL_SECONDS * 1000,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: PROOF_TTL_SECONDS,
    },
  );
}

/**
 * Atomically consumes the verified OTP row. A copied/replayed proof cannot
 * create a second profile because only one UPDATE can set consumed_at.
 */
export async function consumeOtpRegistrationProof(phone: string): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  const payload = raw ? decode(raw) : null;
  const normalizedPhone = normalizeUzbekPhone(phone);

  const clearProof = () => store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  if (!payload || payload.phone !== normalizedPhone) {
    clearProof();
    return false;
  }

  const now = new Date().toISOString();
  const result = await createServiceRoleClient()
    .from("otp_verifications")
    .update({ consumed_at: now })
    .eq("id", payload.otpId)
    .eq("phone", normalizedPhone)
    .eq("purpose", payload.purpose)
    .not("verified_at", "is", null)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();

  clearProof();
  return !result.error && Boolean(result.data?.id);
}
