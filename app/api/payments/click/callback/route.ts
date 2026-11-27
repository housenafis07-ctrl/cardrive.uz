import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/supabase/server";
import { verifyClickShopSignature, type ClickShopCallback } from "@/lib/payments/providers/click-shop";

export const dynamic = "force-dynamic";
const C = { ok: 0, sign: -1, amount: -2, action: -3, paid: -4, order: -5, transaction: -6, update: -7, request: -8 };

function response(p: Pick<ClickShopCallback,"click_trans_id"|"merchant_trans_id">, error: number, error_note: string, extra: Record<string,unknown> = {}) {
  return NextResponse.json({ click_trans_id: Number(p.click_trans_id || 0), merchant_trans_id: p.merchant_trans_id || "", error, error_note, ...extra });
}
function field(form: URLSearchParams, key: string) { return (form.get(key) || "").trim(); }

export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.CLICK_SERVICE_ID || !env.CLICK_MERCHANT_ID || !env.CLICK_SECRET_KEY) {
    return NextResponse.json({ error: "CLICK_NOT_CONFIGURED" }, { status: 503 });
  }
  try {
    const form = new URLSearchParams(await request.text());
    const p: ClickShopCallback = {
      click_trans_id: field(form,"click_trans_id"),
      service_id: field(form,"service_id"),
      click_paydoc_id: field(form,"click_paydoc_id") || undefined,
      merchant_trans_id: field(form,"merchant_trans_id"),
      merchant_prepare_id: field(form,"merchant_prepare_id") || undefined,
      amount: field(form,"amount"),
      action: field(form,"action") as "0"|"1",
      error: field(form,"error"),
      error_note: field(form,"error_note") || undefined,
      sign_time: field(form,"sign_time"),
      sign_string: field(form,"sign_string"),
    };
    const ids = { click_trans_id: p.click_trans_id || "0", merchant_trans_id: p.merchant_trans_id || "" };
    if (!/^\d{1,30}$/.test(p.click_trans_id) || !/^[0-9a-f-]{36}$/i.test(p.merchant_trans_id) ||
        !p.service_id || !p.amount || !p.sign_time || !p.sign_string || !/^-?\d+$/.test(p.error)) {
      return response(ids,C.request,"Invalid request");
    }
    if (p.service_id !== env.CLICK_SERVICE_ID ||
        !verifyClickShopSignature(p,{serviceId:env.CLICK_SERVICE_ID,secretKey:env.CLICK_SECRET_KEY})) {
      return response(ids,C.sign,"SIGN CHECK FAILED!");
    }
    if (p.action !== "0" && p.action !== "1") return response(ids,C.action,"Action not found");
    if (!/^\d+$/.test(p.amount) || !Number.isSafeInteger(Number(p.amount)) || Number(p.amount) <= 0) {
      return response(ids,C.amount,"Incorrect amount");
    }
    const amount = Number(p.amount);
    const db = createServiceRoleClient();
    const { data: attempt, error: loadError } = await db.from("monetization_payment_attempts")
      .select("id,order_id,provider,status,amount_uzs,currency,provider_payment_id,provider_prepare_id,provider_payload")
      .eq("id",p.merchant_trans_id).eq("provider","click").maybeSingle();
    if (loadError) throw loadError;
    if (!attempt) return response(ids,C.order,"Order not found");
    if (Number(attempt.amount_uzs) !== amount || attempt.currency !== "UZS") return response(ids,C.amount,"Incorrect amount");
    if (attempt.provider_payment_id && attempt.provider_payment_id !== p.click_trans_id) return response(ids,C.update,"Payment transaction mismatch");

    if (p.action === "0") {
      const { data, error } = await db.rpc("prepare_monetization_click_payment",{
        p_attempt_id:attempt.id,
        p_click_trans_id:p.click_trans_id,
        p_click_paydoc_id:p.click_paydoc_id || null,
        p_amount:amount,
        p_service_id:p.service_id,
        p_payload:Object.fromEntries(form.entries()),
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) throw error || new Error("CLICK_PREPARE_FAILED");
      return response(ids,Number(row.error_code),String(row.error_note),{
        ...(row.merchant_prepare_id == null ? {} : {merchant_prepare_id:Number(row.merchant_prepare_id)}),
      });
    }

    const prepareId = Number(p.merchant_prepare_id);
    if (!p.merchant_prepare_id || !Number.isSafeInteger(prepareId) || prepareId !== Number(attempt.provider_prepare_id)) {
      return response(ids,C.transaction,"Transaction not found");
    }
    if (attempt.status === "paid") return response(ids,C.paid,"Already paid",{merchant_confirm_id:prepareId});

    if (Number(p.error) !== 0) {
      const status = Number(p.error) === -9 ? "cancelled" : "failed";
      const { error } = await db.from("monetization_payment_attempts").update({
        status,
        provider_paydoc_id:p.click_paydoc_id || null,
        provider_payload:{...(attempt.provider_payload || {}),click_complete:Object.fromEntries(form.entries())},
        updated_at:new Date().toISOString(),
      }).eq("id",attempt.id).eq("status","processing");
      if (error) throw error;
      return response(ids,C.ok,"Success",{merchant_confirm_id:prepareId});
    }

    const { data, error } = await db.rpc("confirm_monetization_payment_attempt",{
      p_attempt_id:attempt.id,
      p_provider_payment_id:p.click_trans_id,
      p_provider_paydoc_id:p.click_paydoc_id || null,
      p_paid_amount:amount,
      p_currency:"UZS",
      p_provider_payload:Object.fromEntries(form.entries()),
    });
    if (error || !data?.paid) throw error || new Error("CLICK_CONFIRMATION_FAILED");
    return response(ids,C.ok,"Success",{merchant_confirm_id:prepareId});
  } catch (error) {
    console.error("[click-callback] processing failed",{reason:error instanceof Error?error.message:"unknown"});
    return NextResponse.json({click_trans_id:0,merchant_trans_id:"",error:C.update,error_note:"Failed to update transaction"});
  }
}
