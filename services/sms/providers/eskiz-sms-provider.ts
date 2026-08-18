import "server-only";

import type { SmsProvider } from "@/services/sms/sms-provider";
import { getServerEnv } from "@/lib/env";

const ESKIZ_API_BASE = "https://notify.eskiz.uz/api";
let cachedToken: string | null = null;

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

async function login(): Promise<string> {
  const env = getServerEnv();
  if (!env.ESKIZ_EMAIL || !env.ESKIZ_PASSWORD) {
    throw new Error("Eskiz SMS sozlamalari topilmadi");
  }

  const form = new FormData();
  form.set("email", env.ESKIZ_EMAIL);
  form.set("password", env.ESKIZ_PASSWORD);

  const response = await fetch(`${ESKIZ_API_BASE}/auth/login`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  const data = await readJson(response);
  const token = data?.data?.token;
  if (!response.ok || typeof token !== "string" || !token) {
    throw new Error(data?.message || "Eskiz autentifikatsiyasi muvaffaqiyatsiz tugadi");
  }

  cachedToken = token;
  return token;
}

async function sendWithToken(token: string, input: { phone: string; code: string; expiresInSeconds: number }) {
  const env = getServerEnv();
  const mobilePhone = input.phone.replace(/\D/g, "");

  // Eskiz'da moderatsiyadan o'tgan tasdiqlangan SMS shabloni.
  // Tasdiqlangan shablondagi 0000 o'rni real OTP kodi bilan almashtiriladi.
  const message = `Код верификации для входа к мобильному приложению autohouse.uz: ${input.code}`;

  const form = new FormData();
  form.set("mobile_phone", mobilePhone);
  form.set("message", message);
  form.set("from", env.ESKIZ_FROM || "4546");

  return fetch(`${ESKIZ_API_BASE}/message/sms/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
  });
}

export class EskizSmsProvider implements SmsProvider {
  async sendOtp(input: { phone: string; code: string; expiresInSeconds: number }): Promise<void> {
    let token = cachedToken ?? (await login());
    let response = await sendWithToken(token, input);

    if (response.status === 401) {
      cachedToken = null;
      token = await login();
      response = await sendWithToken(token, input);
    }

    if (!response.ok) {
      const data = await readJson(response);
      throw new Error(data?.message || "SMS yuborilmadi");
    }
  }

  async sendMessage(input: { phone: string; message: string }): Promise<void> {
    let token = cachedToken ?? (await login());
    const env = getServerEnv();
    const form = new FormData();
    form.set("mobile_phone", input.phone.replace(/\D/g, ""));
    form.set("message", input.message);
    form.set("from", env.ESKIZ_FROM || "4546");

    let response = await fetch(`${ESKIZ_API_BASE}/message/sms/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      cache: "no-store",
    });

    if (response.status === 401) {
      cachedToken = null;
      token = await login();
      response = await fetch(`${ESKIZ_API_BASE}/message/sms/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        cache: "no-store",
      });
    }

    if (!response.ok) {
      const data = await readJson(response);
      throw new Error(data?.message || "SMS yuborilmadi");
    }
  }
}
