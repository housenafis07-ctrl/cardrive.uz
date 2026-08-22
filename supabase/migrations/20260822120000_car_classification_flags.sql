alter table public.cars add column if not exists is_premium boolean not null default false;
alter table public.cars add column if not exists is_commercial boolean not null default false;
create index if not exists cars_is_premium_idx on public.cars(is_premium) where is_premium = true;
create index if not exists cars_is_commercial_idx on public.cars(is_commercial) where is_commercial = true;
