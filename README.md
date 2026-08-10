# Cardrive.uz

Cardrive.uz is the official marketplace foundation for new automobiles in Uzbekistan. Phase 1 provides the secure app, data, and integration foundation—not a complete marketplace UI.

## Stack

Next.js App Router, strict TypeScript, Tailwind CSS, Supabase/PostgreSQL/Storage, Zod, ESLint, and Prettier.

## Setup

Copy `.env.example` to `.env.local`, set the Supabase values, install dependencies with `npm install`, then run `npm run dev`. Use `npm run typecheck`, `npm run lint`, and `npm run build` before deployment.

## Architecture

`app/` holds UI routes; `schemas/` holds validation; `services/` business and provider contracts; `repositories/` data access; `lib/` environment and authorization; and `supabase/migrations/` database/RLS policy. UI must call server-side services, which call repositories—never database queries directly.

## Supabase, RLS, and Storage

Apply `supabase/migrations/20260810120000_initial_foundation.sql` in Supabase. It creates profiles, brands, car_models, cars, car_images, orders, order_status_history, otp_verifications, banks, credit_applications, and audit_logs with foreign keys and indexes. RLS is enabled on every application table. Catalog data is publicly readable; protected customer records are scoped to `auth.uid()`. Admin/manager access must be authorized server-side with `requireAdministrativeRole`; the service-role key is server-only.

The migration provisions the public `car-images` bucket. Store automobile assets at `cars/{carId}/{filename}`. No upload UI is included in this phase.

## Auth, SMS, and banks

The eventual auth flow is normalized Uzbekistan phone (`+998XXXXXXXXX`) → OTP → verification → Supabase session. OTP values must be hashed before insertion; plaintext codes are never stored. `SmsProvider` is an interface only; an approved `EskizSmsProvider` can be added later without guessing endpoints or sending real SMS today.

`BankProvider` and `BankProviderRegistry` permit future bank-specific providers without coupling marketplace logic to a bank. Phase 1 deliberately contains no bank integration, fake integration, passport, PINFL, or other sensitive credit data.

## Security and phases

Never commit `.env` files or credentials. Do not log secrets, OTPs, passports, PINFL, or sensitive values; the audit metadata schema blocks common sensitive keys. Phase 2 should implement catalog browsing/search/filter/detail UI; Phase 3 secure OTP ordering; Phase 4 approved bank integrations; Phase 5 administration and hardening.


## Phase 2: public catalog

Phase 2 adds `/`, `/cars`, and `/cars/[slug]`. The homepage, catalog, and vehicle detail pages consume the existing public RLS-safe data through `CatalogService` and `CatalogRepository`; components never query Supabase directly. Catalog search, filtering, sorting, and pagination are URL-backed and server-side. The UI deliberately supports an empty database, and the order CTA is a visual-only future entry point.


## Phase 3: protected administration

`/admin` is a server-protected management area. `getAdminUser` verifies the Supabase session and profile role; only `admin` and `manager` users proceed, while other visitors are redirected to `/forbidden`. The dashboard displays live counts and the Brands, Models, and Cars modules use server actions → `AdminCatalogService` → `AdminCatalogRepository`. Storage image management is server-only and stores objects in `car-images/cars/{carId}/...`.
