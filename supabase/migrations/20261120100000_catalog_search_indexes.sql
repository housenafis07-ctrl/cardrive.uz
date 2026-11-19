-- Search performance indexes for the two independent Cardrive catalogs.
-- Additive only; no existing listing or vehicle data is modified.
create extension if not exists pg_trgm with schema extensions;

create index if not exists used_car_listings_public_currency_price_idx
  on public.used_car_listings (currency, price)
  where status = 'active';
create index if not exists used_car_listings_public_mileage_idx
  on public.used_car_listings (mileage_km)
  where status = 'active';
create index if not exists used_car_listings_public_year_idx
  on public.used_car_listings (year)
  where status = 'active';
create index if not exists used_car_listings_brand_trgm_idx
  on public.used_car_listings using gin (brand extensions.gin_trgm_ops)
  where status = 'active';
create index if not exists used_car_listings_model_trgm_idx
  on public.used_car_listings using gin (model extensions.gin_trgm_ops)
  where status = 'active';

create index if not exists cars_active_currency_price_idx
  on public.cars (currency, price)
  where is_active = true;
create index if not exists cars_active_brand_model_idx
  on public.cars (brand_id, model_id)
  where is_active = true;
