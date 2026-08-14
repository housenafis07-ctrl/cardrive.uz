import "server-only";
import type { SmsProvider } from "./sms-provider";
export class SmsService { constructor(private readonly provider: SmsProvider) {} sendOtp(phone:string,code:string){return this.provider.sendOtp({phone,code,expiresInSeconds:300});} sendMessage(phone:string,message:string){return this.provider.sendMessage({phone,message});} }
