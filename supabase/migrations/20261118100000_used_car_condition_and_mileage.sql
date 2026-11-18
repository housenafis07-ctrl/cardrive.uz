-- Reconcile mileage validation with the listing form and persist structured condition details.
-- Additive and safe for existing rows: old listings receive the default condition.
alter table public.used_car_listings
  drop constraint if exists used_car_listings_mileage_km_check;

alter table public.used_car_listings
  add constraint used_car_listings_mileage_km_check
  check (mileage_km between 0 and 2000000);

alter table public.used_car_listings
  add column if not exists vehicle_condition text not null default 'good'
  check (vehicle_condition in ('ideal','good','minor_defects','body_repair','major_repair','parts_only'));

alter table public.used_car_listings
  add column if not exists condition_description text not null default ''
  check (char_length(condition_description) <= 1200);
