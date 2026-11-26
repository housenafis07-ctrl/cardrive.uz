# Cardrive Payment Service

## Purpose

One provider-neutral payment lifecycle for Avtobozor monetization. Provider adapters translate external protocols; the shared service owns order validation and the single entitlement-granting path.

## Current boundaries

- Order and product prices are created/read server-side from `monetization_products`.
- `monetization_orders` is the canonical commercial order.
- `confirm_monetization_payment` is the single database operation that changes an eligible pending order to paid and grants its entitlements/promotions.
- Provider event identity is persisted in `monetization_payment_events` with a unique `(provider, provider_event_id)` constraint.
- Amounts are normalized to UZS decimal amounts at the service boundary. Payme callback sends tiyin; its adapter must convert tiyin to UZS before calling the shared service. Click Shop API sends UZS amounts.

## Layers

1. **Checkout/UI** — asks for a provider choice and submits an existing server-generated order. It never supplies price, currency, customer ID or entitlement data.
2. **PaymentService** — loads a payable order, validates status/currency/amount and calls the one confirmation RPC.
3. **Provider adapters** — implement provider-specific checkout creation, signature verification, callback parsing and response formatting.
4. **Provider endpoints** — thin HTTP handlers. They authenticate the provider request, parse it, call the adapter and shared service, then return the provider's required response.
5. **Database** — owns order state, idempotency, event uniqueness and entitlement activation.

## Click Shop API flow

- Click sends form-encoded POST requests to the same callback URL with `action=0` (Prepare) and `action=1` (Complete).
- Prepare validates the MD5 signature, service ID, order ID, UZS amount and pending status, then records a durable prepared attempt and returns `merchant_prepare_id`.
- Complete validates the signature and the prepared attempt. A successful Click result is committed through the shared payment confirmation path; a negative Click result marks the attempt cancelled/failed without granting entitlements.
- Duplicate Prepare/Complete calls must return the original result. Conflicting reuse of a Click transaction ID must be rejected.
- Click amount is UZS decimal, not Payme tiyin. Convert and compare using integer minor units; do not compare floating-point values directly.

## Payme flow

The current implementation uses Payme hosted checkout URL creation and a signed callback. Keep the existing provider-specific signature and callback parsing in the Payme adapter; normalize its `actual_amount` from tiyin to UZS before the shared confirmation service.

## Required next implementation before Click can accept payments

- Add a durable `monetization_payment_attempts` table with unique provider transaction ID, prepare ID, order ID, amount/currency and state.
- Add transactional service-role-only RPCs for Click Prepare and Complete so attempt state and order confirmation commit atomically.
- Add `POST /api/payments/click/callback` with strict form parsing, MD5 signature verification and official Click error mapping.
- Add a provider selector / checkout URL flow and store Click invoice/transaction reference.
- Add tests for signature tampering, wrong service ID, wrong amount, duplicate Prepare, duplicate Complete, Complete without Prepare, negative Complete, callback retry and two concurrent Complete requests.
- Run Click sandbox tests after Click supplies service ID and secret key. Do not enable the provider in Production before those tests.

## Credentials

Server-side Vercel variables only:

- `CLICK_SERVICE_ID`
- `CLICK_SECRET_KEY`

Never expose provider secrets via `NEXT_PUBLIC_*`. Credentials are intentionally unset until Click provides the merchant onboarding details.

## Safety

Preview currently shares Production Supabase credentials. Do not create orders, call provider callbacks manually against Preview, or run payment writes there. Use isolated local/test database fixtures until a separate non-production database is available.
