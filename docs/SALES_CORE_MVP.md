# Cardrive Sales Core MVP

## Sale completion contract

An order becomes an analytics sale only after the existing order flow reaches `completed` and an explicit sale-completion action is performed.

Existing order statuses remain unchanged: `pending -> confirmed -> processing -> completed` (or `cancelled`).

## Purchase types

The existing domain values remain authoritative: `cash`, `online`, `credit`, `installment`.

- `cash`: customer pays without financing.
- `online`: existing online-payment flow; do not silently convert it to cash.
- `credit`: financing program + bank are required when the sale is finalized.
- `installment`: dealer installment program; bank is not required.

## Analytics eligibility

Only finalized sales are counted in sales analytics. Draft, pending, processing and cancelled orders are excluded.

## Required final-sale facts

At finalization, preserve a historical snapshot of the commercial facts used for reporting: order, car, dealer, purchase type, sale price, financing program, bank (if applicable), financed amount, dealer-financed amount, rate, term, monthly payment, and completion timestamp.

The snapshot must not change when an administrator later edits a bank, dealer, car or financing-program record.

## Guardrails

- Never create two sales for the same order.
- Never finalize an order that is not `completed`.
- Never treat a bank-funded credit as a dealer installment.
- Never treat an online purchase as cash by data conversion.
- Keep the existing order status service and calculator behavior unchanged.

## Implementation sequence

1. Validate the real database schema.
2. Add the sales persistence layer in a separate migration.
3. Add server-side finalization with the guardrails above.
4. Add the admin action to the existing completed-order UI.
5. Add read-only analytics queries/views.
6. Run typecheck, lint and production build.
7. Verify manually before merging to `main`.
