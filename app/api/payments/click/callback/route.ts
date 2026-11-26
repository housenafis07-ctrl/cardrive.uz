import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/supabase/server";
import {
  clickShopError,
  parseClickAmount,
  verifyClickShopSignature,
  type ClickShopCallback,
} from "@/lib/payments/providers/click-shop";

export const dynamic = "force-dynamic";

function value(form: FormData, key: string): string {
  const raw = form.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function response(
  payload: Pick<ClickShopCallback, "click_trans_id" | "merchant_trans_id">,
  error: number,
  errorNote: string,
  ids: { prepareId?: string; confirmId?: string } = {},
) {
  return NextResponse.json(clickShopError(payload, error, errorNote, ids));
}

export async function POST(request: Request) {
  const env = getServerEnv();
  if (!env.CLICK_SERVICE_ID || !env.CLICK_SECRET_KEY) {
    return NextResponse.json({ error: "Click is not configured" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected form-encoded Click request" }, { status: 400 });
  }

  const payload: ClickShopCallback = {
    click_trans_id: value(form, "click_trans_id"),
    service_id: value(form, "service_id"),
    click_paydoc_id: value(form, "click_paydoc_id") || undefined,
    merchant_trans_id: value(form, "merchant_trans_id"),
    merchant_prepare_id: value(form, "merchant_prepare_id") || undefined,
    amount: value(form, "amount"),
    action: value(form, "action") as "0" | "1",
    error: value(form, "error"),
    error_note: value(form, "error_note") || undefined,
    sign_time: value(form, "sign_time"),
    sign_string: value(form, "sign_string"),
  };

  const responseIds = {
    click_trans_id: payload.click_trans_id || "0",
    merchant_trans_id: payload.merchant_trans_id || "",
  };

  if (payload.service_id !== env.CLICK_SERVICE_ID) {
    return response(responseIds, -1, "Service ID mismatch");
  }
  if (!verifyClickShopSignature(payload, {
    serviceId: env.CLICK_SERVICE_ID,
    secretKey: env.CLICK_SECRET_KEY,
  })) {
    return response(responseIds, -1, "SIGN CHECK FAILED");
  }
  if (!/^[0-9]{1,30}$/.test(payload.click_trans_id) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.merchant_trans_id) ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(payload.sign_time) ||
      !/^-?\d+$/.test(payload.error) ||
      (payload.action !== "0" && payload.action !== "1")) {
    return response(responseIds, -3, "Invalid request parameters");
  }

  let amount: number;
  try {
    amount = parseClickAmount(payload.amount);
  } catch {
    return response(responseIds, -2, "Incorrect amount");
  }

  const db = createServiceRoleClient();
  if (payload.action === "0") {
    const { data, error } = await db.rpc("click_prepare_monetization_payment", {
      p_click_trans_id: payload.click_trans_id,
      p_click_paydoc_id: payload.click_paydoc_id || null,
      p_order_id: payload.merchant_trans_id,
      p_amount: amount,
      p_service_id: payload.service_id,
      p_sign_time: payload.sign_time,
    });

    const result = Array.isArray(data) ? data[0] : data;
    if (error || !result) {
      console.error("[click-callback] prepare failed", { code: error?.code ?? "empty_result" });
      return response(responseIds, -8, "Prepare processing failed");
    }
    return response(responseIds, Number(result.error_code), String(result.error_note), {
      prepareId: result.merchant_prepare_id == null ? undefined : String(result.merchant_prepare_id),
    });
  }

  if (!payload.merchant_prepare_id || !/^\d+$/.test(payload.merchant_prepare_id)) {
    return response(responseIds, -3, "merchant_prepare_id is required");
  }

  const { data, error } = await db.rpc("click_complete_monetization_payment", {
    p_click_trans_id: payload.click_trans_id,
    p_order_id: payload.merchant_trans_id,
    p_merchant_prepare_id: payload.merchant_prepare_id,
    p_amount: amount,
    p_click_error: Number(payload.error),
  });

  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result) {
    console.error("[click-callback] complete failed", { code: error?.code ?? "empty_result" });
    return response(responseIds, -8, "Complete processing failed");
  }
  return response(responseIds, Number(result.error_code), String(result.error_note), {
    confirmId: result.merchant_confirm_id == null ? undefined : String(result.merchant_confirm_id),
  });
}
