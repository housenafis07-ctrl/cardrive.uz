export interface SmsProvider { sendOtp(input: { phone: string; code: string; expiresInSeconds: number }): Promise<void>; sendMessage(input: { phone: string; message: string }): Promise<void>; }
