import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/supabase/server";

export const dynamic = "force-dynamic";
type PaymeCallback = Record<string, string | number | null | undefined> & {
  order_id?: string;
  amount?: string | number;
  currency?: string;
  merchant_id?: string | number;
  payment_id?: string | number;
  order_status?: string;
  response_status?: string;
  signature?: string;
  response_signature_string?: string;
};

function verifySignature(payload: PaymeCallback, secret: string) {
  if (!payload.signature) return false;
  const values = Object.keys(payload)
    .filter(key => key !== "signature" && key !== "response_signature_string")
    .sort()
    .map(key => payload[key])
    .filter(value => value !== null && value !== undefined && value !== "")
    .map(value => String(value));
  const expected = createHash("sha1").update([secret, ...values].join("|"), "utf8").digest("hex");
  const actualBytes = Buffer.from(payload.signature.toLowerCase(), "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.PAYME_MERCHANT_ID || !env.PAYME_MERCHANT_KEY) {
    return NextResponse.json({ error: "Payme is not configured" }, { status: 503 });
  }

  let payload: PaymeCallback;
  try {
    payload = await request.json() as PaymeCallback;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifySignature(payload, env.PAYME_MERCHANT_KEY)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (String(payload.merchant_id ?? "") !== env.PAYME_MERCHANT_ID) {
    return NextResponse.json({ error: "Merchant mismatch" }, { status: 403 });
  }

  const orderId = String(payload.order_id ?? "");
  const paymentId = String(payload.payment_id ?? "");
  const amountTiyin = Number(payload.amount);
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(orderId) || !paymentId ||
      !Number.isSafeInteger(amountTiyin) || amountTiyin < 1 || payload.currency !== "UZS") {
    return NextResponse.json({ error: "Invalid payment fields" }, { status: 400 });
  }

  const db = createServiceRoleClient();
  if (payload.response_status !== "success" || payload.order_status !== "approved") {
    const failureStatus = payload.order_status === "expired" ? "cancelled" : "failed";
    const { error } = await db.from("monetization_orders")
      .update({ status: failureStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId).eq("status", "pending").eq("payment_provider", "payme");
    if (error) return NextResponse.json({ error: "Order update failed" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await db.rpc("confirm_monetization_payment", {
    p_order_id: orderId,
    p_provider: "payme",
    p_provider_event_id: paymentId,
    p_provider_reference: paymentId,
    p_paid_amount: amountTiyin / 100,
    p_currency: "UZS",
  });
  if (error || data !== true) {
    console.error("[payme-callback] payment confirmation failed", { code: error?.code ?? "not_confirmed" });
    return NextResponse.json({ error: "Payment confirmation failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
