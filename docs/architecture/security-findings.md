# Cardrive security audit and remediation plan

Audit scope: current GitHub `main`, Supabase project `cardrive`, and Supabase Security Advisor output retrieved 2026-11-17. Findings below are evidence, not proof of exploitation.

## Confirmed findings

### OTP / account creation

- `lib/otp-hash.ts` generates six-digit codes with `Math.random()`; use a cryptographically secure generator.
- OTP hashes are plain SHA-256 of a six-digit code. A database-only compromise permits trivial offline brute force; use a server-side HMAC pepper.
- `createCustomerProfileAction(phone, fullName)` currently calls `createCustomerProfile` without requiring evidence that the phone's OTP was verified. A caller can invoke the Server Action directly and attempt to create/update a profile for a phone number without completing the UI OTP step.
- Existing OTP records track expiry and attempt count. The branch adds a one-time consumed state, a database expiry check at consumption, atomic attempt increments, and an attempt-ceiling condition on the successful verification update.
- The customer cookie is an HMAC-signed phone value with a 30-day browser lifetime. It has no signed issued-at/expiry claim and no server-side session revocation identifier. Treat this as a separate session-hardening task; do not change the cookie format without a migration/compatibility plan.

### Database security advisor

Observed findings:

- RLS is enabled but there are no policies on `public.audit_logs`, `public.otp_verifications`, and `public.promo_codes`. A read-only grant audit additionally confirmed that `anon`/`authenticated` still hold broad table privileges on `audit_logs` and `otp_verifications` despite the lack of policies; the pending migration revokes those grants.
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
10. The PR adds an atomic database-backed issuance cap of 5 OTP requests per phone/purpose per rolling hour, with a 60-second minimum interval. This is a per-phone control; trusted-IP/device-level throttling remains a follow-up because the current action boundary does not yet establish a trusted client IP.
11. Run Supabase Security Advisor after the migration and confirm that no new public execution or RLS gaps remain.

## Session hardening follow-up

- Replace phone-only session payload with a signed session ID, issued-at and expiry.
- Store/validate session ID for revocation on logout and account deactivation.
- Rotate the session secret deliberately and invalidate legacy sessions safely.
- Add rate limiting by normalized phone and request origin/IP at the OTP request boundary.
- Avoid logging OTPs, phone numbers, or raw authentication tokens.

## Release rule

The SQL migration is not to be applied to Production from this PR. First run it against an isolated test database, validate function/trigger behavior, verify the OTP one-time challenge flow, and complete the migration reconciliation plan.


## Fresh Supabase Security Advisor snapshot — 2026-11-17

A read-only advisor scan of the active Cardrive project reported:

- RLS enabled with no policies on public.audit_logs, public.otp_verifications, and public.promo_codes (3 findings).
- Mutable function search path on public.set_updated_at().
- public.redeem_promo_code(text) is SECURITY DEFINER and executable by anon and authenticated.
- The three category synchronization helpers (sync_all_car_category_items(), sync_car_category_items(uuid), and sync_car_category_items_trigger()) are SECURITY DEFINER and have client-role EXECUTE grants. The direct RPC exposure must be removed while preserving trigger execution.
- Leaked-password protection is disabled in Supabase Auth.
- Performance advisor additionally reports two unindexed foreign keys, five RLS policies with per-row auth-function evaluation, unused-index candidates, and duplicate permissive policies. These are optimization findings, not a reason to blindly drop indexes or policies.

Read-only function-definition inspection confirmed that redeem_promo_code updates public.promo_codes under a definer context, and that the category sync functions update public.car_category_items. No Production grants, policies, functions, or Auth settings were changed during this scan.

Remediation order:
1. Reconcile the historical migrations and complete an encrypted backup + restore drill.
2. Validate the existing PR security migration on disposable PostgreSQL and local Supabase/Auth.
3. Confirm trigger-owner behavior and remove only direct client EXECUTE privileges from trigger-only functions.
4. Restrict promo redemption to a server-only pathway after checking external consumers.
5. Enable leaked-password protection after reviewing Auth settings and user impact.
6. Re-run Security Advisor and retain before/after evidence.

Do not execute the pending Production migration until the release gates above are satisfied.
