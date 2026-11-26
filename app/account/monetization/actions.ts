"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-session";
import { getServerEnv } from "@/lib/env";
import { createServiceRoleClient } from "@/supabase/server";

export async function startMonetizationPaymentAction(form: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login?next=%2Faccount%2Fmonetization");

  const code = String(form.get("product_code") ?? "").trim();
  const listingId = String(form.get("listing_id") ?? "").trim() || null;
  const idempotencyKey = String(form.get("idempotency_key") ?? "").trim();
  const provider = String(form.get("provider") ?? "").trim();
  if (provider !== "payme" && provider !== "click") redirect("/account/monetization?error=To%27lov+usulini+tanlang");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    redirect("/account/monetization?error=Buyurtma+kaliti+noto%27g%27ri.+Sahifani+yangilang");
  }
  if (!/^[a-z0-9_]{2,80}$/.test(code)) redirect("/account/monetization?error=Mahsulot+noto%27g%27ri");

  const env = getServerEnv();
  if (provider === "payme" && (!env.PAYME_MERCHANT_ID || !env.PAYME_MERCHANT_KEY)) {
    redirect("/account/monetization?error=Payme+hali+sozlanmagan");
  }
  if (provider === "click" && (!env.CLICK_SERVICE_ID || !env.CLICK_MERCHANT_ID || !env.CLICK_SECRET_KEY)) {
    redirect("/account/monetization?error=Click+hali+sozlanmagan");
  }

  const db = createServiceRoleClient();
  const { data, error } = await db.rpc("create_monetization_order", {
    p_customer_profile_id: customer.id,
    p_product_code: code,
    p_target_listing_id: listingId,
    p_idempotency_key: idempotencyKey,
  });
  const order = Array.isArray(data) ? data[0] : data;
  if (error || !order?.order_id || order.currency !== "UZS") {
    redirect("/account/monetization?error=" + encodeURIComponent(
      error?.message?.includes("product_unavailable") ? "Mahsulot hozircha mavjud emas yoki narxi belgilanmagan" :
      order?.currency !== "UZS" ? "Payme orqali faqat UZS valyutasidagi mahsulotlar to‘lanadi" :
      "Buyurtma yaratilmadi. Qayta urinib ko‘ring"
    ));
  }

  if (order.status !== "pending") {
    redirect("/account/monetization?error=Bu+buyurtma+allaqachon+qayta+ishlangan.+Yangi+xarid+uchun+sahifani+yangilang");
  }

  if (provider === "click") {
    const amount = Number(order.total_amount);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100))) {
      await db.from("monetization_orders").update({ status: "failed" }).eq("id", order.order_id).eq("status", "pending");
      redirect("/account/monetization?error=Buyurtma+summasi+noto%27g%27ri");
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cardrive.uz";
    const returnUrl = new URL("/account/monetization", siteUrl);
    returnUrl.searchParams.set("payment", "click");
    const checkout = new URL("https://my.click.uz/services/pay");
    checkout.searchParams.set("service_id", env.CLICK_SERVICE_ID!);
    checkout.searchParams.set("merchant_id", env.CLICK_MERCHANT_ID!);
    checkout.searchParams.set("amount", amount.toFixed(2));
    checkout.searchParams.set("transaction_param", order.order_id);
    checkout.searchParams.set("return_url", returnUrl.toString());

    const { error: updateError } = await db.from("monetization_orders")
      .update({ payment_provider: "click", provider_reference: order.order_id })
      .eq("id", order.order_id).eq("status", "pending");
    if (updateError) {
      redirect("/account/monetization?error=Buyurtma+to%27lovga+tayyorlanmadi");
    }
    redirect(checkout.toString());
  }

  const amountTiyin = Math.round(Number(order.total_amount) * 100);
  if (!Number.isSafeInteger(amountTiyin) || amountTiyin < 1) {
    await db.from("monetization_orders").update({ status: "failed" }).eq("id", order.order_id).eq("status", "pending");
    redirect("/account/monetization?error=Buyurtma+summasi+noto%27g%27ri");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cardrive.uz";
  const responseUrl = env.PAYME_RESPONSE_URL ?? new URL("/account/monetization", siteUrl).toString();
  const callbackUrl = env.PAYME_SERVER_CALLBACK_URL ?? new URL("/api/payments/payme/callback", siteUrl).toString();
  const params: Record<string, string | number> = {
    amount: amountTiyin,
    currency: "UZS",
    merchant_id: env.PAYME_MERCHANT_ID,
    order_desc: "Cardrive " + code,
    order_id: order.order_id,
    server_callback_url: callbackUrl,
    response_url: responseUrl,
  };
  const signatureText = [env.PAYME_MERCHANT_KEY, ...Object.keys(params).sort().map(key => String(params[key]))].join("|");
  const signature = createHash("sha1").update(signatureText, "utf8").digest("hex");

  let response: Response;
  try {
    response = await fetch("https://pay.payme.uz/api/checkout/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: { ...params, signature } }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    await db.from("monetization_orders").update({ status: "failed" }).eq("id", order.order_id).eq("status", "pending");
    redirect("/account/monetization?error=Payme+bilan+bog%27lanishda+xatolik");
  }

  const payload = await response.json().catch(() => null) as { response?: { checkout_url?: string; response_status?: string } } | null;
  if (!response.ok || payload?.response?.response_status !== "success" || !payload.response.checkout_url) {
    await db.from("monetization_orders").update({ status: "failed" }).eq("id", order.order_id).eq("status", "pending");
    redirect("/account/monetization?error=Payme+to%27lov+havolasini+yaratmadi");
  }

  await db.from("monetization_orders")
    .update({ payment_provider: "payme", provider_reference: order.order_id })
    .eq("id", order.order_id).eq("status", "pending");

  redirect(payload.response.checkout_url);
}
