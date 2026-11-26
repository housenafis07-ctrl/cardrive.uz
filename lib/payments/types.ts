export type PaymentProvider = "payme" | "click";
export type PaymentCurrency = "UZS";
export type PaymentOrderStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export interface PayableOrder {
  id: string;
  customer_profile_id: string;
  status: PaymentOrderStatus;
  total_amount: number | string;
  currency: PaymentCurrency;
}

export interface VerifiedPayment {
  provider: PaymentProvider;
  providerEventId: string;
  providerReference: string;
  orderId: string;
  amount: string;
  currency: PaymentCurrency;
}

export interface CheckoutSession {
  provider: PaymentProvider;
  orderId: string;
  checkoutUrl: string;
}

export interface PaymentProviderAdapter<TCallback = unknown> {
  readonly provider: PaymentProvider;
  verifyCallback(payload: TCallback): boolean;
}
