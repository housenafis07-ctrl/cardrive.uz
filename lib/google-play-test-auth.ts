import "server-only";

const TEST_PHONE = process.env.GOOGLE_PLAY_TEST_PHONE?.trim() ?? "";
const TEST_OTP = process.env.GOOGLE_PLAY_TEST_OTP?.trim() ?? "";

export function isGooglePlayTestAccount(phone: string): boolean {
  return Boolean(TEST_PHONE && TEST_OTP && phone.trim() === TEST_PHONE);
}

export function verifyGooglePlayTestOtp(phone: string, code: string): boolean {
  return isGooglePlayTestAccount(phone) && code.trim() === TEST_OTP;
}

export function getGooglePlayTestPhone(): string | null {
  return TEST_PHONE || null;
}
