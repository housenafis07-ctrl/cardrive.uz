import "server-only";
import { getServerEnv } from "@/lib/env";

export function getTelegramRuntimeConfig() {
  const env = getServerEnv();
  if (process.env.VERCEL_ENV === "preview") {
    return {
      token: env.TELEGRAM_PREVIEW_BOT_TOKEN,
      secret: env.TELEGRAM_PREVIEW_WEBHOOK_SECRET,
      appUrl: process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "https://cardrive.uz",
    };
  }
  return {
    token: env.TELEGRAM_BOT_TOKEN,
    secret: env.TELEGRAM_WEBHOOK_SECRET,
    appUrl: "https://cardrive.uz",
  };
}
