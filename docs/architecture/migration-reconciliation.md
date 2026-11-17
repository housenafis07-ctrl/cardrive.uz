# Supabase migration reconciliation — Cardrive

## Scope and safety boundary

This is a read-only comparison of the repository branch `feat/cardrive-architecture-foundation-pr1` with Supabase project `wgfvnnapobfdevgjhfin` (Cardrive, ap-southeast-1). No migration was applied, repaired, deleted, or marked as applied. The project currently has no Supabase development branches.

## Evidence captured

- Supabase migration history was read with the Supabase project migration-list API on 2026-11-17.
- Repository migration files were read from the PR branch tree.
- The database project is ACTIVE_HEALTHY.
- Supabase reports 13 migration-history entries.
- The repository branch contains 15 SQL migration files: 13 older feature migrations plus two unmerged security/OTP migrations.
- The two new migrations `20261117090000_cardrive_security_foundation.sql` and `20261117100000_otp_request_rate_limit.sql` do not appear in the remote migration history, as expected while this PR remains unmerged and unapplied.

## Remote migration history

| Remote version | Remote name |
|---|---|
| 20260817055436 | phase_6_marketplace_foundation |
| 20260817085357 | allow_car_images_storage_writes |
| 20260817184059 | add_dealers_and_financing_programs |
| 20260818041645 | ensure_credit_application_financing_program |
| 20260818042024 | order_financing_program |
| 20260818050542 | financing_ui_compat |
| 20260818061953 | financing_management_v2 |
| 20260819112007 | financing_program_rules |
| 20260822133301 | sync_car_categories_v4 |
| 20260822144826 | add_extended_car_specs |
| 20260827073308 | add_credit_application_consent_and_submission_timestamps |
| 20260827095323 | add_manager_order_overrides |
| 20260827095337 | add_order_edit_audit_index |

## Repository migration files

| Repository version | File |
|---|---|
| 20260810120000 | initial_foundation.sql |
| 20260813120000 | public_active_banks_policy.sql |
| 20260813130000 | financing_programs.sql |
| 20260813140000 | credit_application_financing.sql |
| 20260817100000 | phase_6_marketplace_foundation.sql |
| 20260817110000 | phase6_marketplace_foundation.sql |
| 20260817120000 | dealers_financing_scoping.sql |
| 20260818061953 | financing_management_v2.sql |
| 20260818090000 | order_financing_program.sql |
| 20260818130000 | financing_ui_compat.sql |
| 20260819120000 | financing_program_rules.sql |
| 20260826160000 | localization_content_fields.sql |
| 20260827100000 | credit_oneid_consent.sql |
| 20261117090000 | cardrive_security_foundation.sql |
| 20261117100000 | otp_request_rate_limit.sql |

## Findings

1. The remote history and repository filenames do not reconcile by migration version. Only two older local filenames have version strings that exactly match a remote entry; several others have similar names but different timestamps.
2. The repository contains two separate Phase 6 foundation migrations. The remote history contains one Phase 6 migration with a different timestamp. These must not be treated as interchangeable without a schema/content comparison.
3. The remote history contains entries for Storage write policies, category synchronization, extended car specifications, manager order overrides, and an order audit index for which there is no same-version file in this branch.
4. The repository has earlier foundation and financing migrations that do not appear as same-version entries in the remote history.
5. Similar migration names are not proof of identical SQL. A `migration repair` that simply marks files applied could conceal real schema drift; a `db push` could replay DDL against existing objects.

## Required reconciliation sequence (not yet performed)

1. Preserve a fresh encrypted database backup and verify its checksum and decryptability before any DDL.
2. Export the remote schema (DDL only) and the complete remote migration history from the exact Cardrive project.
3. Compare each remote migration's effects with the current schema and with the SQL in this repository. Resolve duplicate Phase 6 migrations and all timestamp/name mismatches explicitly.
4. Produce a canonical baseline/history mapping. Keep historical migration IDs intact; do not rename or rewrite applied remote history.
5. Validate the canonical migration chain against an isolated PostgreSQL database. Apply all migrations from an empty database and compare the resulting schema with the exported remote schema.
6. Validate the security and OTP migrations on that isolated database, including grants, RLS, function ownership, trigger execution, and OTP limits.
7. Only after written evidence shows no destructive drift, prepare a separate production migration plan and rollback/forward-fix plan. Production execution remains a separate gated operation.

## Explicit blockers

- No isolated Supabase branch is currently available. Do not create one without first checking its cost; the project owner has declined the $25/month Pro upgrade.
- The current repository does not contain all exact historical SQL files corresponding to the remote history.
- No verified encrypted backup artifact or restore drill is yet available.
- Consequently, migration repair, `supabase db push`, and all Production DDL remain prohibited at this stage.
