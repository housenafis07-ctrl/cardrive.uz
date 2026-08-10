import "server-only";
import type { SmsProvider } from "./sms-provider";
/** Eskiz is injected only after its approved contract is available. */
export class SmsService { constructor(private readonly provider: SmsProvider) {} sendOtp(phone: string, code: string) { return this.provider.sendOtp({ phone, code, expiresInSeconds: 300 }); } }
