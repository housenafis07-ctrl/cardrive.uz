"use server";


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
  if (provider === "payme" && (env.PAYME_ENABLED !== "true" || !env.PAYME_MERCHANT_ID || !env.PAYME_MERCHANT_KEY)) {
    redirect("/account/monetization?error=Payme+hali+sozlanmagan");
  }
  if (provider === "click" && (env.CLICK_ENABLED !== "true" || !env.CLICK_SERVICE_ID || !env.CLICK_MERCHANT_ID || !env.CLICK_SECRET_KEY)) {
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

  const { data: attemptData, error: attemptError } = await db.rpc("create_monetization_payment_attempt", {
    p_order_id: order.order_id,
    p_customer_profile_id: customer.id,
    p_provider: provider,
    p_idempotency_key: idempotencyKey,
  });
  const attempt = Array.isArray(attemptData) ? attemptData[0] : attemptData;
  if (attemptError || !attempt?.id || attempt.currency !== "UZS" || Number(attempt.amount_uzs) <= 0) {
    redirect("/account/monetization?error=To%27lov+urinishini+yaratib+bo%27lmadi");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cardrive.uz";
  let checkoutUrl = attempt.checkout_url as string | null;

  if (provider === "click") {
    if (!checkoutUrl) {
      const checkout = new URL("https://my.click.uz/services/pay");
      checkout.searchParams.set("service_id", env.CLICK_SERVICE_ID!);
      checkout.searchParams.set("merchant_id", env.CLICK_MERCHANT_ID!);
      if (env.CLICK_MERCHANT_USER_ID) checkout.searchParams.set("merchant_user_id", env.CLICK_MERCHANT_USER_ID);
      const clickAmount = Number(attempt.amount_uzs);
      if (!Number.isSafeInteger(clickAmount) || clickAmount <= 0) redirect("/account/monetization?error=Click+uchun+summa+butun+UZS+bo%27lishi+kerak");
      checkout.searchParams.set("amount", String(clickAmount));
      checkout.searchParams.set("transaction_param", attempt.id);
      checkout.searchParams.set("return_url", new URL("/account/monetization?payment=click", siteUrl).toString());
      checkoutUrl = checkout.toString();
    }
  } else {
    if (!checkoutUrl) {
      const paymeParams = [
        ["m", env.PAYME_MERCHANT_ID!],
        ["ac.order_id", order.order_id],
        ["a", String(Math.round(Number(attempt.amount_uzs) * 100))],
        ["l", "uz"],
        ["c", env.PAYME_RESPONSE_URL ?? new URL("/account/monetization?payment=payme", siteUrl).toString()],
        ["ct", "15000"],
        ["cr", "860"],
      ];
      const raw = paymeParams.map(([key, value]) => key + "=" + value).join(";");
      checkoutUrl = "https://checkout.paycom.uz/" + Buffer.from(raw, "utf8").toString("base64");
    }
  }

  const { error: checkoutSaveError } = await db.from("monetization_payment_attempts")
    .update({
      checkout_url: checkoutUrl,
      provider_payload: {
        ...(attempt.provider_payload || {}),
        checkout: { mode: provider === "payme" ? "payme_hosted_base64" : "click_hosted", created_at: new Date().toISOString() },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", attempt.id)
    .eq("customer_profile_id", customer.id);
  if (checkoutSaveError) {
    console.error("[monetization-checkout] failed to persist checkout URL", { code: checkoutSaveError.code });
    redirect("/account/monetization?error=To%27lov+havolasini+saqlab+bo%27lmadi");
  }

  redirect(checkoutUrl);
}
