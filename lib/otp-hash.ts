import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const OTP_HASH_ALGORITHM = "sha256";
const TEMPORARY_PREVIEW_OTP = "0000";

function normalizeOtpCode(code: string): string {
  return code.trim();
}

export function generateOtpCode(): string {
  return process.env.NODE_ENV !== "production" ? TEMPORARY_PREVIEW_OTP : String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtpCode(code: string): string {
  return createHash(OTP_HASH_ALGORITHM).update(normalizeOtpCode(code), "utf8").digest("hex");
}

export function verifyOtpCode(code: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashOtpCode(code), "utf8");
  const expected = Buffer.from(expectedHash.trim(), "utf8");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
