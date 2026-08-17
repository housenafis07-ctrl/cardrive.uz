alter table public.banks
  add column logo_url text,
  add column website_url text,
  add column integration_status text not null default 'information_only' check (integration_status in ('information_only','connected','disabled')),
  add column display_order integer not null default 0;

create table public.financing_programs (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid not null references public.banks(id),
  name text not null,
  description text,
  financing_type text not null check (financing_type in ('credit','installment','promotional')),
  annual_interest_rate numeric(5,2),
  min_down_payment_percent numeric(5,2),
  max_financing_percent numeric(5,2),
  min_term_months integer,
  max_term_months integer,
  min_amount numeric(14,2),
  max_amount numeric(14,2),
  currency char(3) not null default 'UZS',
  eligibility_notes text,
  source_url text,
  source_label text,
  last_verified_at timestamptz,
  applicable_brand_id uuid references public.brands(id),
  applicable_model_id uuid references public.car_models(id),
  min_car_price numeric(14,2),
  max_car_price numeric(14,2),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index financing_programs_bank_idx on public.financing_programs(bank_id);
create index financing_programs_brand_idx on public.financing_programs(applicable_brand_id);
create index financing_programs_model_idx on public.financing_programs(applicable_model_id);

create trigger financing_programs_updated_at before update on public.financing_programs for each row execute procedure public.set_updated_at();

alter table public.financing_programs enable row level security;

create policy "public active financing programs" on public.financing_programs for select using (
  is_active
  and exists (
    select 1 from public.banks b
    where b.id = financing_programs.bank_id
      and b.is_active
      and b.integration_status <> 'disabled'
  )
);
