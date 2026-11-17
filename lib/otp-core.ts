import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const OTP_HASH_ALGORITHM = "sha256";

function otpPepper(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error("OTP hashing secret is not configured");
  return value;
}

function normalizeOtpCode(code: string): string {
  return code.trim();
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 1_000_000));
}

export function hashOtpCode(code: string): string {
  return createHmac(OTP_HASH_ALGORITHM, otpPepper())
    .update(normalizeOtpCode(code), "utf8")
    .digest("hex");
}

export function verifyOtpCode(code: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOtpCode(code), "utf8");
  const expected = Buffer.from(expectedHash.trim(), "utf8");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
