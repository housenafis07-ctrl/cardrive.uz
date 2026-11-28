import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type TelegramWebAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export function verifyTelegramWebAppInitData(initData: string, botToken: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!initData || initData.length > 8192 || !botToken) return null;
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  const rawUser = params.get("user");
  if (!receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash) ||
      !Number.isInteger(authDate) || !rawUser || authDate > nowSeconds + 30 ||
      nowSeconds - authDate > 10 * 60) return null;

  params.delete("hash");
  params.delete("signature");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => key + "=" + value)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const expected = Buffer.from(expectedHash, "hex");
  const received = Buffer.from(receivedHash, "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const user = JSON.parse(rawUser) as TelegramWebAppUser;
    if (!Number.isSafeInteger(user.id) || user.id <= 0 || typeof user.first_name !== "string") return null;
    return { user, authDate };
  } catch {
    return null;
  }
}
