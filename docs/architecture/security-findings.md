# Cardrive security audit and remediation plan

Audit scope: current GitHub `main`, Supabase project `cardrive`, and Supabase Security Advisor output retrieved 2026-11-17. Findings below are evidence, not proof of exploitation.

## Confirmed findings

### OTP / account creation

- `lib/otp-hash.ts` generates six-digit codes with `Math.random()`; use a cryptographically secure generator.
- OTP hashes are plain SHA-256 of a six-digit code. A database-only compromise permits trivial offline brute force; use a server-side HMAC pepper.
- `createCustomerProfileAction(phone, fullName)` currently calls `createCustomerProfile` without requiring evidence that the phone's OTP was verified. A caller can invoke the Server Action directly and attempt to create/update a profile for a phone number without completing the UI OTP step.
- Existing OTP records track expiry and attempt count, but the repository does not currently implement a one-time consumed state for registration proof.
- The customer cookie is an HMAC-signed phone value with a 30-day browser lifetime. It has no signed issued-at/expiry claim and no server-side session revocation identifier. Treat this as a separate session-hardening task; do not change the cookie format without a migration/compatibility plan.

### Database security advisor

Observed findings:

- RLS is enabled but there are no policies on `public.audit_logs`, `public.otp_verifications`, and `public.promo_codes`.
- `public.set_updated_at()` has no fixed `search_path`.
- `public.redeem_promo_code(text)` is `SECURITY DEFINER` and executable by `anon` and `authenticated`.
- `public.sync_all_car_category_items()`, `public.sync_car_category_items(uuid)`, and `public.sync_car_category_items_trigger()` are `SECURITY DEFINER` and executable by `anon` and `authenticated`.
- The three category sync functions are used by database triggers. Their privileged execution may be required for trigger-maintained category rows; the fix is to revoke direct client execution while preserving trigger behavior, not blindly convert them to invoker functions.
- No direct `redeem_promo_code` caller was found in the inspected repository. The proposed migration restricts it to `service_role`; verify no external client or out-of-repository integration depends on the RPC before applying it.

## Remediation controls

1. Generate OTP using Node.js `crypto.randomInt`.
2. HMAC OTP values with a server-only pepper; never expose the pepper.
3. Require a short-lived, signed, one-time verification proof before profile creation. Bind the proof to the verified phone and OTP record ID; consume it atomically in the database.
4. Keep OTP records server-only: no direct `anon` or `authenticated` table privileges and no client-facing RLS policies.
5. Keep audit logs server-only; no client read/write policies.
6. Remove direct client execution of trigger-only SECURITY DEFINER functions; preserve function-owner/trigger execution.
7. Pin `search_path` for every SECURITY DEFINER function and schema-qualify referenced objects.
8. Review promo-code RPC callers, then restrict it to the intended server-side role or implement an authenticated, rate-limited redemption API.
9. Add tests for OTP replay, OTP expiry, wrong phone, wrong purpose, direct Server Action invocation, attempt exhaustion and concurrent proof consumption.
10. Run Supabase Security Advisor after the migration and confirm that no new public execution or RLS gaps remain.

## Session hardening follow-up

- Replace phone-only session payload with a signed session ID, issued-at and expiry.
- Store/validate session ID for revocation on logout and account deactivation.
- Rotate the session secret deliberately and invalidate legacy sessions safely.
- Add rate limiting by normalized phone and request origin/IP at the OTP request boundary.
- Avoid logging OTPs, phone numbers, or raw authentication tokens.

## Release rule

The SQL migration is not to be applied to Production from this PR. First run it against an isolated test database, validate function/trigger behavior, verify the OTP one-time challenge flow, and complete the migration reconciliation plan.
