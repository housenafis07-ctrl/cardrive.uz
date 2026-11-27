import { createHash, timingSafeEqual } from "node:crypto";
import type { PaymentCurrency } from "../types";

export interface ClickShopCallback {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id?: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: "0" | "1";
  error: string;
  error_note?: string;
  sign_time: string;
  sign_string: string;
}

export interface ClickShopCredentials {
  serviceId: string;
  secretKey: string;
}

export interface ClickShopResponse {
  click_trans_id: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  merchant_confirm_id?: string;
  error: number;
  error_note: string;
}

export const CLICK_CURRENCY: PaymentCurrency = "UZS";

export function verifyClickShopSignature(
  payload: ClickShopCallback,
  credentials: ClickShopCredentials,
): boolean {
  if (payload.service_id !== credentials.serviceId) return false;
  const fields = [
    payload.click_trans_id,
    payload.service_id,
    credentials.secretKey,
    payload.merchant_trans_id,
  ];
  if (payload.action === "1") {
    if (!payload.merchant_prepare_id) return false;
    fields.push(payload.merchant_prepare_id);
  } else if (payload.action !== "0") {
    return false;
  }
  fields.push(payload.amount, payload.action, payload.sign_time);
  const expected = createHash("md5").update(fields.join(""), "utf8").digest("hex");
  const actualBuffer = Buffer.from(String(payload.sign_string ?? "").toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function parseClickAmount(value: string): number {
  if (!/^\d+$/.test(value)) throw new Error("invalid_click_amount");
  const amount = Number(value);
  if (!/^\d+$/.test(value)) throw new Error("invalid_click_amount");
  return amount;
}

export function clickShopError(
  payload: Pick<ClickShopCallback, "click_trans_id" | "merchant_trans_id">,
  error: number,
  errorNote: string,
  ids: { prepareId?: string; confirmId?: string } = {},
): ClickShopResponse {
  return {
    click_trans_id: payload.click_trans_id,
    merchant_trans_id: payload.merchant_trans_id,
    ...(ids.prepareId ? { merchant_prepare_id: ids.prepareId } : {}),
    ...(ids.confirmId ? { merchant_confirm_id: ids.confirmId } : {}),
    error,
    error_note: errorNote,
  };
}
