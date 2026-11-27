import "server-only";

import { createServiceRoleClient } from "@/supabase/server";
import type { PaymentCurrency, PaymentProvider, PayableOrder, VerifiedPayment } from "./types";

function toMinorUnits(amount: number | string): number {
  const parsed = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("invalid_payment_amount");
  const minor = Math.round(parsed * 100);
  if (!Number.isSafeInteger(minor) || Math.abs(parsed * 100 - minor) > 0.000001) {
    throw new Error("invalid_payment_precision");
  }
  return minor;
}

export async function getPayableOrder(orderId: string): Promise<PayableOrder> {
  const db = createServiceRoleClient();
  const { data, error } = await db
    .from("monetization_orders")
    .select("id,customer_profile_id,status,total_amount,currency")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error("payment_order_lookup_failed");
  if (!data) throw new Error("payment_order_not_found");
  if (data.status !== "pending") throw new Error("payment_order_not_payable");
  if (data.currency !== "UZS") throw new Error("payment_currency_not_supported");
  toMinorUnits(data.total_amount);
  return data as PayableOrder;
}

export function assertPaymentMatchesOrder(
  order: Pick<PayableOrder, "total_amount" | "currency">,
  payment: Pick<VerifiedPayment, "amount" | "currency">,
): void {
  if (payment.currency !== order.currency || toMinorUnits(payment.amount) !== toMinorUnits(order.total_amount)) {
    throw new Error("payment_amount_or_currency_mismatch");
  }
}

export async function confirmVerifiedPayment(payment: VerifiedPayment): Promise<void> {
  const db = createServiceRoleClient();
  const { error, data } = await db.rpc("confirm_monetization_payment", {
    p_order_id: payment.orderId,
    p_provider: payment.provider satisfies PaymentProvider,
    p_provider_event_id: payment.providerEventId,
    p_provider_reference: payment.providerReference,
    p_paid_amount: Number(payment.amount),
    p_currency: payment.currency satisfies PaymentCurrency,
  });
  if (error || data !== true) throw new Error("payment_confirmation_failed");
}
