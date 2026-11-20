import "server-only";

import { z } from "zod";
import { uzbekPhoneSchema } from "@/schemas/common";
import { otpSchema } from "@/schemas/orders";
import { OtpRepository } from "@/repositories/otp-repository";
import { SmsService } from "@/services/sms/sms-service";
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
} from "@/lib/otp-hash";

const OTP_TTL_SECONDS = 300;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const otpRequestSchema = z.object({
  phone: uzbekPhoneSchema,
  purpose: z.enum(["login", "order"]),
});

export class OtpService {
  constructor(
    private readonly sms: SmsService,
    private readonly otp: OtpRepository = new OtpRepository(),
  ) {}

  async requestOtp(input: unknown) {
    const { phone, purpose } = otpRequestSchema.parse(input);

    // Check the resend cooldown before consuming the broader rate-limit slot.
    const existing = await this.otp.findLatestUnverified(phone, purpose);
    if (existing.data) {
      const elapsed =
        (Date.now() - new Date(existing.data.created_at).getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        throw new Error("Yangi kod so'rashdan oldin biroz kuting.");
      }
    }

    const rateLimit = await this.otp.consumeRequestSlot(phone, purpose);
    if (rateLimit.error) {
      throw new Error("Kodni yuborish vaqtincha mavjud emas");
    }
    if (rateLimit.data !== true) {
      throw new Error("SMS-kod so'rovlari limiti tugadi. Keyinroq urinib ko'ring.");
    }

    if (existing.data) {
      const expired = await this.otp.expireId(existing.data.id);
      if (expired.error) {
        throw new Error("Avvalgi SMS-kodni yangilab bo'lmadi");
      }
    }

    const code = generateOtpCode();
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
    const result = await this.otp.create({ phone, codeHash, purpose, expiresAt });
    if (result.error || !result.data?.id) {
      throw new Error("Kodni yuborib bo'lmadi");
    }

    try {
      await this.sms.sendOtp(phone, code);
    } catch {
      // Do not leave an active OTP row or block a retry when Eskiz rejects
      // the request, credentials expire, or its API is temporarily unavailable.
      await this.otp.expireId(result.data.id);
      throw new Error("SMS yuborilmadi. Eskiz sozlamalari yoki SMS xizmati holatini tekshiring.");
    }

    return { phone, purpose, expiresInSeconds: OTP_TTL_SECONDS };
  }

  async verifyOtp(input: unknown) {
    const { phone, code, purpose } = otpSchema.parse(input);
    const existing = await this.otp.findLatestUnverified(phone, purpose);
    if (!existing.data) throw new Error("Kod topilmadi. Yangi kod so'rang.");

    const row = existing.data;
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new Error("Urinishlar soni tugadi. Yangi kod so'rang.");
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      throw new Error("Kod muddati tugagan. Yangi kod so'rang.");
    }

    if (!verifyOtpCode(code, row.code_hash)) {
      const attemptUpdate = await this.otp.updateAttempts(
        row.id,
        row.attempts + 1,
        row.attempts,
      );
      if (attemptUpdate.error || !attemptUpdate.data) {
        throw new Error("Kod tekshiruvini qayta urinib ko'ring");
      }
      throw new Error("Kod noto'g'ri");
    }

    const verified = await this.otp.markVerified(row.id, MAX_ATTEMPTS);
    if (verified.error || !verified.data) {
      throw new Error("Kodni tasdiqlab bo'lmadi");
    }

    return { id: verified.data.id, phone, purpose };
  }
}
