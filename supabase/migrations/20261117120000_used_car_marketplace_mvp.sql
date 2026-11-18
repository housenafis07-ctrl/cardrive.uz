-- Used-car marketplace MVP. Additive only; does not alter the existing new-car catalog.
create table if not exists public.used_car_listings (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  brand text not null check (char_length(brand) between 1 and 80),
  model text not null check (char_length(model) between 1 and 100),
  year smallint not null check (year between 1950 and 2100),
  mileage_km integer not null check (mileage_km between 1 and 2000000),
  price numeric(14,2) not null check (price > 0),
  currency char(3) not null default 'UZS' check (currency in ('UZS','USD')),
  region text not null,
  district text,
  body_type text,
  fuel_type text,
  transmission text,
  engine_volume numeric(5,2) check (engine_volume is null or engine_volume between 0 and 20),
  color text,
  description text not null check (char_length(description) between 20 and 5000),
  contact_name text not null,
  contact_phone text not null,
  seller_type text not null default 'private' check (seller_type in ('private','dealer')),
  is_negotiable boolean not null default true,
  status text not null default 'pending_review' check (status in ('draft','pending_review','active','rejected','reserved','sold','archived')),
  moderation_note text,
  view_count integer not null default 0 check (view_count >= 0),
  expires_at timestamptz not null default (now() + interval '30 days'),
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.used_car_listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.used_car_listings(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  alt_text text,
  sort_order smallint not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.used_car_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.used_car_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, listing_id)
);

create table if not exists public.used_car_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.used_car_listings(id) on delete cascade,
  seller_profile_id uuid not null references public.profiles(id) on delete cascade,
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 3 and 1000),
  status text not null default 'new' check (status in ('new','read','replied','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (seller_profile_id <> buyer_profile_id)
);

create index if not exists used_car_listings_public_search_idx on public.used_car_listings(status, region, created_at desc);
create index if not exists used_car_listings_brand_model_idx on public.used_car_listings(brand, model);
create index if not exists used_car_listings_price_idx on public.used_car_listings(price);
create index if not exists used_car_listings_year_idx on public.used_car_listings(year);
create index if not exists used_car_listings_owner_idx on public.used_car_listings(owner_profile_id, created_at desc);
create index if not exists used_car_images_listing_idx on public.used_car_listing_images(listing_id, sort_order);
create index if not exists used_car_inquiries_seller_idx on public.used_car_inquiries(seller_profile_id, status, created_at desc);
create index if not exists used_car_inquiries_buyer_idx on public.used_car_inquiries(buyer_profile_id, created_at desc);

create or replace function public.set_used_car_listing_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists used_car_listings_updated_at on public.used_car_listings;
create trigger used_car_listings_updated_at before update on public.used_car_listings
for each row execute function public.set_used_car_listing_updated_at();
drop trigger if exists used_car_inquiries_updated_at on public.used_car_inquiries;
create trigger used_car_inquiries_updated_at before update on public.used_car_inquiries
for each row execute function public.set_used_car_listing_updated_at();

alter table public.used_car_listings enable row level security;
alter table public.used_car_listing_images enable row level security;
alter table public.used_car_favorites enable row level security;
alter table public.used_car_inquiries enable row level security;

drop policy if exists "public read active used car listings" on public.used_car_listings;
create policy "public read active used car listings" on public.used_car_listings
for select to anon, authenticated using (status in ('active','reserved','sold') and expires_at > now());
drop policy if exists "owner read own used car listings" on public.used_car_listings;
create policy "owner read own used car listings" on public.used_car_listings
for select to authenticated using (owner_profile_id = (select auth.uid()));
drop policy if exists "admin read all used car listings" on public.used_car_listings;
create policy "admin read all used car listings" on public.used_car_listings
for select to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','manager') and p.is_active));

drop policy if exists "public read active used car images" on public.used_car_listing_images;
create policy "public read active used car images" on public.used_car_listing_images
for select to anon, authenticated using (exists (select 1 from public.used_car_listings l where l.id = listing_id and l.status in ('active','reserved','sold') and l.expires_at > now()));
drop policy if exists "owner read own used car images" on public.used_car_listing_images;
create policy "owner read own used car images" on public.used_car_listing_images
for select to authenticated using (exists (select 1 from public.used_car_listings l where l.id = listing_id and l.owner_profile_id = (select auth.uid())));
drop policy if exists "admin read all used car images" on public.used_car_listing_images;
create policy "admin read all used car images" on public.used_car_listing_images
for select to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','manager') and p.is_active));

drop policy if exists "owner read own used car favorites" on public.used_car_favorites;
create policy "owner read own used car favorites" on public.used_car_favorites for select to authenticated using (profile_id = (select auth.uid()));
drop policy if exists "participants read used car inquiries" on public.used_car_inquiries;
create policy "participants read used car inquiries" on public.used_car_inquiries for select to authenticated using (buyer_profile_id = (select auth.uid()) or seller_profile_id = (select auth.uid()));

-- Writes are intentionally performed only by server actions after validating the signed Cardrive customer session.
-- Do not add public INSERT/UPDATE policies: the current customer cookie is not a Supabase Auth JWT.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('used-car-images','used-car-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
