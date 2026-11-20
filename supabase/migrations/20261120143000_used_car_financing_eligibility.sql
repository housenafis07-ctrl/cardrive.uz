alter table public.financing_programs
  add column if not exists eligible_borrower_types text[] not null default '{}',
  add column if not exists eligible_vehicle_origins text[] not null default '{}',
  add column if not exists max_vehicle_age_years integer,
  add column if not exists max_collateral_ltv_percent numeric(5,2),
  add column if not exists special_conditions text;

alter table public.financing_programs
  add constraint financing_programs_max_vehicle_age_check
  check (max_vehicle_age_years is null or max_vehicle_age_years between 0 and 100),
  add constraint financing_programs_collateral_ltv_check
  check (max_collateral_ltv_percent is null or max_collateral_ltv_percent between 0 and 100);

alter table public.used_car_listings
  add column if not exists country_of_origin text not null default 'unknown'
  check (country_of_origin in ('uzbekistan','foreign','unknown'));

create index if not exists used_car_listings_origin_idx
  on public.used_car_listings(country_of_origin);
