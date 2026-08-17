"use server";

import { revalidatePath } from "next/cache";
import { OtpService } from "@/services/otp-service";
import { SmsService } from "@/services/sms/sms-service";
import { MockSmsProvider } from "@/services/sms/providers/mock-sms-provider";
import { establishCustomerSession, getCurrentCustomer } from "@/lib/customer-session";
import { OrderService } from "@/services/order-service";
import { CreditApplicationService } from "@/services/credit-application-service";
import type { OtpPurpose, PurchaseType } from "@/types/domain";

const smsProvider = new MockSmsProvider();
export type RequestOtpResult = { status: "sent" } | { status: "error"; message: string };
export type VerifyOtpResult = { status: "verified" } | { status: "error"; message: string };
export type CreateOrderResult = { status: "created"; orderId: string; orderNumber: string } | { status: "error"; message: string };
export type CancelOrderResult = { status: "cancelled" } | { status: "error"; message: string };

export async function requestCustomerOtpAction(phone: string, purpose: OtpPurpose): Promise<RequestOtpResult> { try { await new OtpService(new SmsService(smsProvider)).requestOtp({ phone, purpose }); return { status: "sent" }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Kodni yuborib bo'lmadi" }; } }
export async function verifyCustomerOtpAction(phone: string, code: string, purpose: OtpPurpose): Promise<VerifyOtpResult> { try { await new OtpService(new SmsService(smsProvider)).verifyOtp({ phone, code, purpose }); await establishCustomerSession(phone); revalidatePath("/account/orders"); return { status: "verified" }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Kodni tasdiqlab bo'lmadi" }; } }
export async function createOrderAction(input: { carId: string; purchaseType: PurchaseType; notes?: string }): Promise<CreateOrderResult> { const customer = await getCurrentCustomer(); if (!customer) return { status: "error", message: "Buyurtma berish uchun avval tasdiqlashdan o'ting" }; try { const result = await new OrderService().create(input, customer.id); if (result.error || !result.data) return { status: "error", message: "Buyurtmani yaratib bo'lmadi" }; revalidatePath("/account/orders"); return { status: "created", orderId: result.data.id, orderNumber: result.data.order_number }; } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Buyurtmani yaratib bo'lmadi" }; } }
export async function cancelOrderAction(formData: FormData): Promise<CancelOrderResult> { const customer = await getCurrentCustomer(); if (!customer) return { status: "error", message: "Buyurtmani bekor qilish uchun avval tasdiqlashdan o'ting" }; const orderId = formData.get("orderId"); if (typeof orderId !== "string" || !orderId.trim()) return { status: "error", message: "So'rov yaroqsiz" }; try { await new OrderService().cancelIfOwned(orderId.trim(), customer.id); } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Buyurtmani bekor qilishning iloji bo'lmadi" }; } try { await new CreditApplicationService().cancelIfNonTerminal(orderId.trim()); } catch {} revalidatePath(`/account/orders/${orderId.trim()}`); revalidatePath("/account/orders"); return { status: "cancelled" }; }
