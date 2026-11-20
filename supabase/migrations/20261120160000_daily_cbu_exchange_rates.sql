create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency_code text not null,
  rate numeric(18,6) not null check (rate > 0),
  nominal integer not null default 1 check (nominal > 0),
  rate_date date not null,
  source text not null default 'CBU.uz',
  fetched_at timestamptz not null default now(),
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (currency_code, rate_date)
);

create index if not exists exchange_rates_currency_date_idx
  on public.exchange_rates (currency_code, rate_date desc);

create unique index if not exists exchange_rates_one_current_per_currency_idx
  on public.exchange_rates (currency_code) where is_current = true;

alter table public.exchange_rates enable row level security;
revoke all on public.exchange_rates from anon, authenticated;
grant all on public.exchange_rates to service_role;
