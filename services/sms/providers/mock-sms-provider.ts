import "server-only";
import type { SmsProvider } from "@/services/sms/sms-provider";
export class MockSmsProvider implements SmsProvider { readonly sentOtps:{phone:string;code:string;expiresInSeconds:number}[]=[]; readonly sentMessages:{phone:string;message:string}[]=[]; async sendOtp(input:{phone:string;code:string;expiresInSeconds:number}){this.sentOtps.push(input);} async sendMessage(input:{phone:string;message:string}){this.sentMessages.push(input);} }
