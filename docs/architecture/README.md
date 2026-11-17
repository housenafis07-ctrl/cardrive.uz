# Cardrive Architecture & Foundation

## Product direction

Cardrive is a single automotive ecosystem with five connected domains:

1. New-car marketplace — dealer inventory, model/trim catalog, pricing, test drives, orders and financing entry points.
2. Used-car marketplace — user-generated listings, owner dashboard, moderation, enquiries and listing lifecycle.
3. Auto finance — financing programs and applications, with bank adapters where partners expose supported APIs.
4. Auto insurance — insurer directory, quote requests and policy hand-off through authorized partners.
5. Auto service and parts — service locations/bookings and vehicle-compatible parts discovery/orders.

The homepage has two primary entry panels: **New cars** and **Used cars**. These are separate discovery funnels backed by a shared identity/account layer.

## Architecture decision

Use a **modular monolith** on the existing stack. Do not introduce microservices until traffic, deployment isolation, or partner integration requirements justify the operational cost.

- Next.js App Router + TypeScript for public, account, dealer and admin surfaces.
- Supabase PostgreSQL for transactional data and shared reference catalogs.
- Supabase Auth/session layer for identity; privileged operations remain server-side.
- Supabase Storage for listing and vehicle media with explicit access policies.
- Vercel for Preview and Production deployment.
- Domain modules own their schemas, validation, services and repositories.

## Current repository boundaries

The existing repository currently uses `app/`, `components/`, `lib/`, `repositories/`, `schemas/`, `services/`, `supabase/migrations/`, and `types/`. Keep these conventions during the foundation phase; avoid a broad directory rewrite.

## Domain boundaries

| Domain | Owns | Does not own |
| --- | --- | --- |
| Identity | user identity, sessions, profile | listing moderation or dealer inventory |
| New cars | curated catalog, dealer inventory, trims | user-generated used-car ads |
| Used cars | listings, images, moderation, enquiries | new-car dealer master catalog |
| CRM | leads, assignments, activities, tasks | authentication secrets |
| Finance | programs, applications, partner adapters | final bank credit decisions |
| Insurance | quote requests and partner hand-off | insurer underwriting |
| Service | service centers, offerings, bookings | vehicle ownership registry |
| Parts | parts catalog, OEM codes, fitment, orders | supplier source-of-truth inventory |
| Payments | transaction lifecycle, refunds, invoices | partner settlement logic unless contracted |

## Identity and account

One user account can act as a customer and, where authorized, as a seller or member of a partner organization. Organization membership and role-based permissions are separate from a personal profile. Used-car listings are owned by the authenticated profile; dealer inventory belongs to an organization/branch.

The existing `/account` area is the starting point for a personal dashboard. Add “My listings” there rather than creating a second user account system.

## Used-car marketplace — target model

A used listing should contain:

- owner profile and optional organization/branch
- brand/model and free-text fallback for uncommon vehicles
- year, mileage, price/currency, region, body/fuel/transmission
- description, contact preferences and multiple images
- lifecycle status: draft, pending_review, active, rejected, reserved, sold, archived
- moderation reason, timestamps and audit history

Public visitors can read active listings only. An owner can create and manage only their own listings. A moderator can review and change publication state through server-authorized actions. Do not expose a broad public INSERT/UPDATE policy.

## Homepage behavior

The homepage should lead with two equally prominent cards/panels:

- **New cars** → existing new-car catalog and dealer inventory.
- **Used cars** → dedicated second-hand listing search and “Place an ad” flow.

Keep the existing new-car catalog, financing routes, account routes and SEO URLs working. The two panels should be responsive and visible above the fold on desktop and mobile. Used-car pages should have their own filters and detail route.

## Delivery sequence

1. Foundation: security remediation, schema/migration reconciliation, Node/CI alignment and observability.
2. Used-car MVP: listing schema, RLS, owner actions, media, moderation, account “My listings”, and the two-panel homepage.
3. Dealer CRM: organizations, memberships, branches, inventory, leads and sales pipeline.
4. Finance/insurance integrations through partner adapters.
5. Service and parts domains.
6. Monetization, analytics and operational automation.

## Non-negotiable release controls

- No direct edits to `main`.
- No Production database DDL until migration history is reconciled and a verified backup/restore path exists.
- Every schema change is a reviewed, additive migration.
- Every tenant-owned table has explicit tenant/owner policies and tests.
- Preview smoke tests and CI must pass before a PR is marked ready.
- Production promotion is a separate release decision.
