# Avtobozor — Used-car marketplace MVP

## Product decision
The public section is named **Avtobozor** (RU: **Авторынок**). It is a separate user-generated marketplace and does not reuse the curated new-car inventory tables.

## Buyer journey
- Browse active listings; search by make/model and filter by price, year, region, fuel, transmission and body type.
- Open a detail page with photo gallery, mileage, specifications, description, seller type and contact actions.
- Sign in to save favorites and send an enquiry (follow-up iteration).
- Contact the seller directly. Cardrive is a listing platform, not the legal seller or escrow agent.

## Seller journey
- Sign in with the existing Cardrive phone OTP flow (Eskiz remains unchanged).
- Create a listing with make/model, year, mileage, price, region, key technical attributes, description and up to 8 photos.
- New listings enter `pending_review`; they are not publicly visible until a moderator approves them.
- Manage own listings from `/account/my-listings`; mark sold or archive.
- Dealer identity is a future extension through organization membership; the MVP keeps private seller listings and records seller type for later migration.

## Moderation and trust
- Listing states: draft, pending_review, active, rejected, reserved, sold, archived.
- Public queries expose only active/reserved/sold listings within the 30-day validity period.
- A moderator reviews the listing before publication.
- The platform must not claim state-number ownership, accident-free status, or mileage verification unless a partner/state registry integration confirms it.
- AI duplicate/fraud detection is a later phase; MVP includes manual moderation and structured required fields.

## Data model
- `used_car_listings`: owner, vehicle attributes, price, location, contact and moderation lifecycle.
- `used_car_listing_images`: image objects attached to one listing.
- `used_car_favorites`: per-profile saved listings.
- `used_car_inquiries`: private buyer-to-seller messages.

## Security
- RLS enabled on every new table.
- Anonymous reads are limited to active/reserved/sold listings and their images.
- Owner/admin read policies are explicit.
- No client-side INSERT/UPDATE policies are created because the existing Cardrive customer session is a signed HttpOnly cookie, not a Supabase Auth JWT. Server actions use the service-role client only after resolving the signed session and checking ownership.
- Service-role key stays server-only. Upload paths are random UUIDs; images are limited to JPEG/PNG/WebP and 8 MB each.
- No schema changes are applied to Production by this PR.

## Delivery sequence
1. Schema and browse/search/detail/create/list-management MVP.
2. Admin moderation queue and inquiry inbox.
3. Favorites and saved-search notifications.
4. Dealer organizations, dealer inventory, CRM lead pipeline.
5. Registration-number assisted autofill, duplicate/fraud signals and vehicle-history partner integrations.
6. Financing, insurance, service and parts cross-sell flows.

## Legal and UX
- Clearly explain that the seller is responsible for the vehicle information and sale.
- Show a reminder that vehicle sale contracts and registration steps must follow Uzbekistan law, including notarial certification where required.
- Provide report-listing action and support contact in the next iteration.
