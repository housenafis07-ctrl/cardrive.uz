# Cardrive Preview test safety

## Environment inventory (2026-11-17)

The Vercel project has no branch-specific Preview environment variables for `feat/cardrive-architecture-foundation-pr1`.

The following sensitive variables are configured for both Production and Preview targets using the same environment-variable entries:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ESKIZ_EMAIL` and `ESKIZ_PASSWORD`
- `GOOGLE_PLAY_TEST_PHONE` and `GOOGLE_PLAY_TEST_OTP`

The Cardrive Supabase project currently has no Supabase development branches. Therefore, a Vercel Preview deployment would connect to the same Supabase project as Production. An OTP end-to-end test against that Preview would risk creating/updating Production Auth users or profiles and may use the live SMS integration.

## Safety decision

Do not run real OTP sign-in, registration, SMS delivery, or OTP database mutation against the current Vercel Preview environment. Do not use the Google Play test bypass against Production data as a substitute for an isolated test database.

## Completed safe coverage

The PR adds CI checks that do not use Production credentials:

- OTP code generation and HMAC verification unit tests.
- PostgreSQL 17 disposable-database tests for the security foundation and OTP rate-limit migrations, including client-role privilege checks, server-role access, SECURITY DEFINER search_path, trigger execution, 5-per-hour limits, invalid input rejection, and rolling-hour reset.
- CI typecheck, lint, and production build.

## Required before Preview E2E

1. Provide an isolated Supabase Free project or another isolated PostgreSQL/Supabase test target. Do not upgrade the Cardrive organization to Pro.
2. Configure Vercel Preview variables to use only the isolated project's URL and publishable/anon key; keep its service-role key separate from Production.
3. Use a non-delivering SMS stub/test provider for Preview. Do not send real SMS during automated tests.
4. Seed disposable test users and execute the full request-code, verify-code, replay, expiry, wrong-purpose, attempt-exhaustion, resend-throttle, and registration-proof flows.
5. Confirm all test rows and Auth users exist only in the isolated project before marking Preview E2E complete.

No Production environment variables were changed and no Preview OTP request was sent.
