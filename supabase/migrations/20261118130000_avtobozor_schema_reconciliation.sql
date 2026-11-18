-- Avtobozor schema reconciliation and least-privilege hardening.
-- Depends on 20261117120000_used_car_marketplace_mvp.sql.
-- Forward-only, additive, idempotent. Does not touch the curated new-car catalog.

do $$
begin
  if to_regclass('public.used_car_listings') is null
     or to_regclass('public.used_car_listing_images') is null
     or to_regclass('public.used_car_favorites') is null
     or to_regclass('public.used_car_inquiries') is null then
    raise exception 'Avtobozor base schema is missing. Apply 20261117120000_used_car_marketplace_mvp.sql before this reconciliation migration.';
  end if;
end
$$;

alter table public.used_car_listings
  drop constraint if exists used_car_listings_mileage_km_check;
alter table public.used_car_listings
  add constraint used_car_listings_mileage_km_check
  check (mileage_km between 0 and 2000000);

alter table public.used_car_listings
  add column if not exists vehicle_condition text not null default 'good';
alter table public.used_car_listings
  add column if not exists condition_description text not null
  default 'Avtomobilda foydalanish bilan bog‘liq tabiiy izlar bor. Jiddiy shikastlanishlar mavjud emas.';

update public.used_car_listings
set condition_description = 'Avtomobilda foydalanish bilan bog‘liq tabiiy izlar bor. Jiddiy shikastlanishlar mavjud emas.'
where condition_description is null or btrim(condition_description) = '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.used_car_listings'::regclass
      and conname = 'used_car_listings_vehicle_condition_check'
  ) then
    alter table public.used_car_listings
      add constraint used_car_listings_vehicle_condition_check
      check (vehicle_condition in ('ideal','good','minor_defects','body_repair','major_repair','parts_only'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.used_car_listings'::regclass
      and conname = 'used_car_listings_condition_description_length_check'
  ) then
    alter table public.used_car_listings
      add constraint used_car_listings_condition_description_length_check
      check (char_length(condition_description) between 10 and 1200);
  end if;
end
$$;

create index if not exists used_car_listings_public_search_idx
  on public.used_car_listings(status, region, created_at desc);
create index if not exists used_car_listings_brand_model_idx
  on public.used_car_listings(brand, model);
create index if not exists used_car_listings_price_idx
  on public.used_car_listings(price);
create index if not exists used_car_listings_year_idx
  on public.used_car_listings(year);
create index if not exists used_car_listings_owner_idx
  on public.used_car_listings(owner_profile_id, created_at desc);
create index if not exists used_car_images_listing_idx
  on public.used_car_listing_images(listing_id, sort_order);
create index if not exists used_car_inquiries_seller_idx
  on public.used_car_inquiries(seller_profile_id, status, created_at desc);
create index if not exists used_car_inquiries_buyer_idx
  on public.used_car_inquiries(buyer_profile_id, created_at desc);

alter table public.used_car_listings enable row level security;
alter table public.used_car_listing_images enable row level security;
alter table public.used_car_favorites enable row level security;
alter table public.used_car_inquiries enable row level security;

drop policy if exists "public read active used car listings" on public.used_car_listings;
create policy "public read active used car listings" on public.used_car_listings
  for select to anon, authenticated
  using (status in ('active','reserved','sold') and expires_at > now());

drop policy if exists "owner read own used car listings" on public.used_car_listings;
create policy "owner read own used car listings" on public.used_car_listings
  for select to authenticated
  using (owner_profile_id = (select auth.uid()));

drop policy if exists "admin read all used car listings" on public.used_car_listings;
create policy "admin read all used car listings" on public.used_car_listings
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin','manager')
        and p.is_active
    )
  );

drop policy if exists "public read active used car images" on public.used_car_listing_images;
create policy "public read active used car images" on public.used_car_listing_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.used_car_listings l
      where l.id = listing_id
        and l.status in ('active','reserved','sold')
        and l.expires_at > now()
    )
  );

drop policy if exists "owner read own used car images" on public.used_car_listing_images;
create policy "owner read own used car images" on public.used_car_listing_images
  for select to authenticated
  using (
    exists (
      select 1 from public.used_car_listings l
      where l.id = listing_id
        and l.owner_profile_id = (select auth.uid())
    )
  );

drop policy if exists "admin read all used car images" on public.used_car_listing_images;
create policy "admin read all used car images" on public.used_car_listing_images
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin','manager')
        and p.is_active
    )
  );

drop policy if exists "owner read own used car favorites" on public.used_car_favorites;
create policy "owner read own used car favorites" on public.used_car_favorites
  for select to authenticated
  using (profile_id = (select auth.uid()));

drop policy if exists "participants read used car inquiries" on public.used_car_inquiries;
create policy "participants read used car inquiries" on public.used_car_inquiries
  for select to authenticated
  using (
    buyer_profile_id = (select auth.uid())
    or seller_profile_id = (select auth.uid())
  );

-- Customer sessions are signed HttpOnly cookies, not Supabase Auth JWTs.
-- All writes remain server-side after session and ownership checks.
revoke all on table
  public.used_car_listings,
  public.used_car_listing_images,
  public.used_car_favorites,
  public.used_car_inquiries
from anon, authenticated;

grant select on table
  public.used_car_listings,
  public.used_car_listing_images
to anon, authenticated;

grant select on table
  public.used_car_favorites,
  public.used_car_inquiries
to authenticated;

-- Public-read images; uploads/deletes are performed only by the server-role client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'used-car-images',
  'used-car-images',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

revoke all on function public.set_used_car_listing_updated_at() from public, anon, authenticated;
