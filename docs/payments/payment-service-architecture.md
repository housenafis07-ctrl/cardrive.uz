# Cardrive Payment Service

## Proven reference

The integration model is adapted from the working RoyalHouse repository (housenafis07-ctrl/prohouse), not by copying its credentials or database. Both providers use one durable payment-attempt ledger; each provider has a protocol-specific adapter.

## Canonical records

- monetization_orders remains the commercial order and immutable price snapshot.
- monetization_payment_attempts stores one Payme/Click attempt: customer, provider, amount, currency, provider transaction ID, Click prepare ID, checkout URL, status and callback payload.
- monetization_payment_events is the provider-event ledger with unique (provider, provider_event_id).
- confirm_monetization_payment is the single entitlement/promotion grant path.
- confirm_monetization_payment_attempt locks the attempt and invokes the shared confirmation function before marking the attempt paid.

## Checkout

1. Customer authenticates and selects an existing catalog product and (where required) their own listing.
2. Server creates the order using the database catalog price.
3. Server creates/reuses a provider-specific idempotent payment attempt.
4. Server creates and persists a hosted checkout URL. The browser never supplies amount, customer ID or provider credentials.
5. Click uses merchant_trans_id = payment_attempt.id; Payme uses account.order_id = monetization_orders.id.

## Payme Merchant API

- Hosted checkout URL follows Payme's Base64 GET format: https://checkout.paycom.uz/{base64(m=...;ac.order_id=...;a=...;l=...;c=...)}.
- Payme Merchant Cabinet must register https://cardrive.uz/api/payments/payme/callback as the JSON-RPC callback and use Basic Auth username Paycom with the server-side merchant key as password.
- Callback authenticates the Basic Authorization header using constant-time comparison.
- Implemented JSON-RPC methods: CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction, CheckTransaction, and GetStatement.
- Payme sends amount in tiyin. The callback validates integer tiyin against the UZS order amount multiplied by 100.
- Successful PerformTransaction calls the shared payment-attempt confirmation RPC. CancelTransaction before payment cancels the attempt; cancellation after payment records a refund, changes the order to refunded and revokes its entitlements/promotions.

## Click Shop API

- Hosted checkout URL uses https://my.click.uz/services/pay with service_id, merchant_id, amount, transaction_param (payment attempt UUID) and return_url.
- Click sends form-encoded POST callbacks with action=0 (Prepare) and action=1 (Complete).
- Signature is MD5 over the Click-defined concatenated fields; comparison is constant-time.
- Prepare validates service ID, signature, attempt, amount and order state, then allocates and persists merchant_prepare_id.
- Complete validates the same transaction, prepare ID and amount. A successful callback calls the shared confirmation RPC; negative callbacks mark the attempt failed/cancelled without granting entitlements.
- Click sends whole UZS amounts; Cardrive rejects non-integer UZS amounts. Payme's tiyin format is handled separately.
- Repeated Prepare/Complete callbacks are idempotent; conflicting transaction IDs are rejected.

## Explicit activation switches

Server-only Vercel environment variables:

- Payme: PAYME_ENABLED=true, PAYME_MERCHANT_ID, PAYME_MERCHANT_KEY.
- Click: CLICK_ENABLED=true, CLICK_SERVICE_ID, CLICK_MERCHANT_ID, CLICK_SECRET_KEY.

Keep both enable switches false until merchant credentials, registered callback URLs, sandbox tests and production callback reachability have been verified. Never expose secrets through NEXT_PUBLIC_*.

## Safety

Preview currently shares Production Supabase credentials. Do not create test orders or invoke payment callbacks against Preview. Run database lifecycle tests only against the isolated PostgreSQL fixture in GitHub Actions until a separate non-production Supabase database is approved. Do not apply migrations to Production without a verified backup/export and explicit approval.
