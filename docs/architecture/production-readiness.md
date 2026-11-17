# Cardrive Production readiness and operations plan

## Supabase plan and backups

Owner decision: Cardrive will remain on Supabase Free; no Pro upgrade or paid PITR is authorized. Accept the Free-tier limitations explicitly: no Supabase-managed daily database backups, possible pausing after a week of low activity, and limited log retention.

Free-tier continuity plan:
1. Run the repository's encrypted GitHub Actions logical backup daily (after the three repository secrets are configured).
2. Keep encrypted artifacts private with 7-day retention; GitHub artifact quota and availability are additional dependencies.
3. Export PostgreSQL roles, schema and data; export Auth user metadata separately; download Storage objects separately.
4. Keep the encryption passphrase in an independent password manager/offline recovery location, never in the same artifact or repository.
5. Complete a restore drill against an isolated target before treating the workflow as a verified disaster-recovery control.
6. Keep an independent second copy of encrypted backups in a separately controlled storage destination when one is approved.

This is a logical export workaround, not equivalent to Supabase-managed physical backups or point-in-time recovery. Auth export is metadata-only and does not preserve password hashes, active sessions, MFA secrets or provider credentials. Storage object bytes are not included in the database dump.

## Node.js / CI / Vercel

Observed configuration:

- `.nvmrc` = Node 22.
- GitHub Actions CI uses Node 22 and `npm install`.
- Vercel project runtime = Node 24.x.
- The repository has no package-lock file in the inspected root tree.

Remediation:
- Align `.nvmrc`, CI and Vercel to Node 24 (the current Vercel project runtime).
- Generate and commit a reviewed `package-lock.json` before switching CI from `npm install` to `npm ci`.
- Pin GitHub Actions to reviewed immutable SHAs in a follow-up hardening change.
- Keep typecheck, lint and production build as required checks.
- Add migration/static SQL checks and security tests without running migrations against Production in CI.

## Monitoring

Observed:
- No Vercel log/trace drain is configured for this project.
- Vercel Observability Plus is not enabled for the team.
- Supabase project logs/advisors are accessible, but current Free-plan log retention is limited.

Minimum monitoring baseline:
- Vercel deployment/build status and runtime error logs.
- Supabase Auth, Postgres, Storage and Edge Function error monitoring.
- Daily security and performance advisor review during rollout.
- Alerts for OTP send/verify failures, failed order creation, payment failures, 5xx rate and database connection saturation.
- Dashboard KPIs: active listings, pending moderation, leads, lead response time, orders, credit applications and service bookings.
- Keep personal data and secrets out of log payloads.

Paid log drains and third-party monitoring should be evaluated only after estimating cost and selecting a destination. Do not create a drain without a confirmed endpoint and owner.

## Release gates

- CI green.
- Preview deployment READY.
- OTP/security regression tests pass.
- Supabase advisors reviewed.
- Migration diff approved.
- Backup restore drill passed.
- Production migration and deploy are separately approved.
