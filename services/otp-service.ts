import "server-only";
import { z } from "zod";
import { uzbekPhoneSchema } from "@/schemas/common";
import { otpSchema } from "@/schemas/orders";
import { OtpRepository } from "@/repositories/otp-repository";
import { SmsService } from "@/services/sms/sms-service";
import { hashOtpCode, verifyOtpCode } from "@/lib/otp-hash";

const OTP_TTL_SECONDS = 300;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const TEMPORARY_OTP = "000000";
const otpRequestSchema = z.object({ phone: uzbekPhoneSchema, purpose: z.enum(["login", "order"]) });

export class OtpService {
  constructor(private readonly sms: SmsService, private readonly otp: OtpRepository = new OtpRepository()) {}

  async requestOtp(input: unknown) {
    const { phone, purpose } = otpRequestSchema.parse(input);
    const existing = await this.otp.findLatestUnverified(phone, purpose);
    if (existing.data) {
      const elapsed = (Date.now() - new Date(existing.data.created_at).getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) throw new Error("Yangi kod so'rashdan oldin biroz kuting.");
      await this.otp.expireId(existing.data.id);
    }

    const code = TEMPORARY_OTP;
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
    const result = await this.otp.create({ phone, codeHash, purpose, expiresAt });
    if (result.error) throw new Error("Kodni yuborib bo'lmadi");
    await this.sms.sendOtp(phone, code);
    return { phone, purpose, expiresInSeconds: OTP_TTL_SECONDS };
  }

  async verifyOtp(input: unknown) {
    const { phone, code, purpose } = otpSchema.parse(input);
    const existing = await this.otp.findLatestUnverified(phone, purpose);
    if (!existing.data) throw new Error("Kod topilmadi. Yangi kod so'rang.");
    const row = existing.data;
    if (row.attempts >= MAX_ATTEMPTS) throw new Error("Urinishlar soni tugadi. Yangi kod so'rang.");
    if (new Date(row.expires_at).getTime() <= Date.now()) throw new Error("Kod muddati tugagan. Yangi kod so'rang.");
    if (!verifyOtpCode(code, row.code_hash)) {
      await this.otp.updateAttempts(row.id, row.attempts + 1);
      throw new Error("Kod noto'g'ri");
    }
    const verified = await this.otp.markVerified(row.id);
    if (verified.error) throw new Error("Kodni tasdiqlab bo'lmadi");
    return { phone, purpose };
  }
}
