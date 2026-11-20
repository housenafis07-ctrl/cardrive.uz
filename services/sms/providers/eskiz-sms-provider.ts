import "server-only";

import type { SmsProvider } from "@/services/sms/sms-provider";
import { getServerEnv } from "@/lib/env";

const ESKIZ_API_BASE = "https://notify.eskiz.uz/api";
let cachedToken: string | null = null;

type EskizApiResponse = {
  data?: { token?: string };
  id?: string;
  status?: string;
  message?: string;
};

async function readJson(response: Response): Promise<EskizApiResponse | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as EskizApiResponse;
  } catch {
    return { message: text };
  }
}

function getEskizError(data: EskizApiResponse | null, fallback: string): Error {
  // Do not include credentials, access tokens, OTP codes, or request bodies in errors.
  return new Error(data?.message?.slice(0, 300) || fallback);
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
    signal: AbortSignal.timeout(15_000),
  });

  const data = await readJson(response);
  const token = data?.data?.token;
  if (!response.ok || typeof token !== "string" || !token) {
    throw getEskizError(data, "Eskiz autentifikatsiyasi muvaffaqiyatsiz tugadi");
  }

  cachedToken = token;
  return token;
}

async function sendWithToken(
  token: string,
  input: { phone: string; message: string },
): Promise<Response> {
  const env = getServerEnv();
  const mobilePhone = input.phone.replace(/\D/g, "");
  if (!/^998\d{9}$/.test(mobilePhone)) {
    throw new Error("Telefon raqami Eskiz uchun noto'g'ri formatda");
  }

  const form = new FormData();
  form.set("mobile_phone", mobilePhone);
  form.set("message", input.message);
  form.set("from", env.ESKIZ_FROM || "4546");

  return fetch(`${ESKIZ_API_BASE}/message/sms/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
}

async function sendAcceptedMessage(input: { phone: string; message: string }): Promise<void> {
  let token = cachedToken ?? (await login());
  let response = await sendWithToken(token, input);

  if (response.status === 401) {
    cachedToken = null;
    token = await login();
    response = await sendWithToken(token, input);
  }

  const data = await readJson(response);
  // Eskiz may return HTTP 200 with a JSON error. Treat a message as accepted
  // only when its API response contains the dispatch ID and status.
  if (
    !response.ok ||
    typeof data?.id !== "string" ||
    !data.id ||
    typeof data.status !== "string" ||
    !data.status ||
    data.status.toLowerCase() === "error"
  ) {
    throw getEskizError(data, "SMS Eskiz tomonidan qabul qilinmadi");
  }
}

export class EskizSmsProvider implements SmsProvider {
  async sendOtp(input: {
    phone: string;
    code: string;
    expiresInSeconds: number;
  }): Promise<void> {
    // Keep the already-approved Cardrive login template unchanged.
    const message = `Код верификации для входа к мобильному приложению cardrive.uz: ${input.code}`;
    await sendAcceptedMessage({ phone: input.phone, message });
  }

  async sendMessage(input: { phone: string; message: string }): Promise<void> {
    await sendAcceptedMessage(input);
  }
}
