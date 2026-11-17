# Cardrive Production readiness and operations plan

## Supabase plan and backups

The connected Supabase project is currently presented under a Free organization/account context. Free projects do not receive automatic daily database backups and can pause after a week of low activity. A Production marketplace should move to at least Pro once the owner approves the recurring cost.

Current public pricing checked 2026-11-17:

- Supabase Pro starts at **$25/month**.
- Pro includes daily database backups with **7-day retention**.
- Compute and usage beyond included allowances can add charges.
- PITR is a separate add-on; the published 7-day PITR rate is approximately **$100/month**, so do not enable it by default for this MVP.

Before any plan change:
1. Confirm billing owner and payment method.
2. Review current database size, compute size, egress, Storage and expected usage.
3. Upgrade the organization to Pro.
4. Verify the first available daily backup in Dashboard → Database → Backups.
5. Perform a restore drill to a separate project before relying on the backup.
6. Keep Storage object backups separately; database backups do not include Storage object bytes.

Until the upgrade is approved, schedule a manual encrypted logical database export and off-site storage. Store the backup encryption key separately from the backup. A database dump does not back up Storage object files.

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
