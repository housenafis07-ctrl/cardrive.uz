# Database migration reconciliation plan

## Current finding — do not replay migrations

The current Supabase Production migration history contains 13 rows. The GitHub `main` branch contains 13 SQL migration files. Only one migration has an exact version/name match (`20260818061953_financing_management_v2`). The remaining histories diverge in both version identifiers and migration names.

Examples:

| Production history | GitHub migration file |
| --- | --- |
| `20260817055436_phase_6_marketplace_foundation` | `20260817100000_phase_6_marketplace_foundation.sql` and `20260817110000_phase6_marketplace_foundation.sql` |
| `20260817085357_allow_car_images_storage_writes` | No exact file found |
| `20260817184059_add_dealers_and_financing_programs` | `20260817120000_dealers_financing_scoping.sql` plus earlier financing migrations |
| `20260818041645_ensure_credit_application_financing_program` | No exact file found |
| `20260818042024_order_financing_program` | `20260818090000_order_financing_program.sql` |
| `20260818050542_financing_ui_compat` | `20260818130000_financing_ui_compat.sql` |
| `20260818061953_financing_management_v2` | Exact version/name match |
| `20260819112007_financing_program_rules` | `20260819120000_financing_program_rules.sql` |
| `20260822133301_sync_car_categories_v4` | No exact file found |
| `20260822144826_add_extended_car_specs` | No exact file found |
| `20260827073308_add_credit_application_consent_and_submission_timestamps` | `20260827100000_credit_oneid_consent.sql` is not an exact match |
| `20260827095327_add_manager_order_overrides` | No exact file found |
| `20260827095337_add_order_edit_audit_index` | No exact file found |

The GitHub repository also contains migration files not represented by the Production migration versions, including `20260810120000_initial_foundation.sql`, `20260813120000_public_active_banks_policy.sql`, `20260813130000_financing_programs.sql`, `20260813140000_credit_application_financing.sql`, `20260826160000_localization_content_fields.sql`, and `20260827100000_credit_oneid_consent.sql`.

This is migration-history drift. It is not safe to run `supabase db push`, replay the repository migrations, reset the project, or mark migrations as applied until the schema has been reconciled.

## Reconciliation procedure

1. Freeze Production DDL and preserve the current database.
2. Export the live schema (tables, columns, constraints, indexes, policies, triggers, functions, grants, extensions, storage policies and enums).
3. Export the complete GitHub migration history and calculate file hashes.
4. Compare the live schema against a clean local replay of the repository migrations.
5. Classify every difference as: Production-only, repository-only, equivalent-but-renamed, partial/manual change, or destructive conflict.
6. Build a canonical baseline migration from the verified live schema. Do not blindly rename or rewrite already-applied historical migrations.
7. Add forward-only reconciliation migrations for deliberate changes.
8. Verify on an isolated database/Preview project, run data-integrity queries and application regression tests.
9. Take and verify a restorable backup before the Production migration window.
10. Apply only the approved forward migration and verify the resulting schema and data.

## Required evidence before Production DDL

- Schema-only dump from Production.
- Full migration history from Supabase.
- GitHub migration file list and SHA-256 checksums.
- Diff report for every table, column, index, constraint, trigger, function, policy and grant.
- Row counts and key integrity checks for business tables.
- A tested restore procedure and named rollback/forward-fix plan.

## Prohibited until reconciliation is complete

- `supabase db reset` against Production.
- `supabase db push` against Production.
- Applying all repository migrations to Production.
- Deleting or renaming existing columns/tables.
- Changing existing enum values used by current orders or financing applications.
- Editing migration history rows to make the version lists appear aligned.
