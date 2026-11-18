# Avtobozor schema reconciliation

## Scope
This forward-only reconciliation is limited to the user-generated Avtobozor marketplace. It does not alter the curated new-car inventory tables (brands, car_models, cars, car_images), dealer inventory, orders, financing, or existing new-car media.

## Verified Production state (read-only inspection, 2026-11-18)
- Supabase project: cardrive (wgfvnnapobfdevgjhfin), PostgreSQL 17.
- Production migration history contains 13 entries, ending at 20260827095337.
- No Avtobozor tables were present in public: used_car_listings, used_car_listing_images, used_car_favorites, used_car_inquiries.
- The used-car-images Storage bucket was absent. Existing car-images bucket and its policies are not modified.
- The new-car catalog remains separate and is not touched.

## Migration order
1. 20261117120000_used_car_marketplace_mvp.sql — creates the four Avtobozor tables, indexes, trigger, RLS policies and image bucket.
2. 20261118130000_avtobozor_schema_reconciliation.sql — ensures 0 km is valid, adds structured vehicle-condition fields, reasserts indexes/RLS policies/read-only grants and bucket configuration.
3. 20261118100000_used_car_condition_and_mileage.sql (from the in-progress UI branch) may also be present. It is additive and idempotent; its condition/mileage changes are reasserted by step 2. If it is merged after step 2, verify the remote migration ledger and run the pending migration as a separate controlled operation.

The reconciliation migration is idempotent for repeatable policy/index/column setup. It is not a substitute for repairing unrelated historical migration-version mismatches. Do not mark historical migrations as applied or rewrite the remote migration ledger without a separately reviewed reconciliation.

## Access model
- Anonymous and authenticated SQL roles have read-only table privileges for listings and images; RLS limits public rows to non-expired active, reserved, or sold listings.
- Owners and active admin/manager accounts receive only their explicitly scoped read access.
- Favorites and inquiries are not exposed to anonymous users; authenticated reads are limited to the owner/participants.
- Direct client writes remain disabled. Current Cardrive customer sessions are signed HttpOnly cookies, not Supabase Auth JWTs; server actions use the server-only service-role client after verifying the session and ownership.
- used-car-images is public-read, limited to JPEG/PNG/WEBP and 8 MB. Upload and delete operations remain server-only. No public Storage write policy is added.
- The existing car-images bucket and new-car media policies remain unchanged.

## Release gates
- Merge the Avtobozor application branch only after CI and Vercel Preview pass.
- Run migrations against a disposable PostgreSQL 17 database and assert:
  - mileage 0 is accepted; negative mileage and NULL are rejected;
  - each condition enum value is accepted and an unknown value rejected;
  - anon can read only active, unexpired listing rows and related images;
  - anon cannot read favorites/inquiries or write to any marketplace table;
  - authenticated users cannot read another owner's pending listing or another buyer/seller's inquiry;
  - service-role server actions can create pending listings and upload images.
- Run Supabase Security and Performance Advisors after the migration.
- Production migration application is a separate release operation requiring a verified backup and an explicit deployment window. This PR does not apply SQL to Production, alter billing, or change Vercel Production.
