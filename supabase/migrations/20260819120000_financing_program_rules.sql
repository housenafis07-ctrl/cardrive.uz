create table if not exists public.financing_program_rules (
  id uuid primary key default gen_random_uuid(),
  financing_program_id uuid not null references public.financing_programs(id) on delete cascade,
  down_payment_percent numeric(5,2) not null check (down_payment_percent >= 0 and down_payment_percent <= 100),
  term_months integer not null check (term_months > 0),
  annual_interest_rate numeric(5,2) not null default 0 check (annual_interest_rate >= 0),
  is_available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(financing_program_id, down_payment_percent, term_months)
);

create index if not exists financing_program_rules_program_idx on public.financing_program_rules(financing_program_id);
create trigger financing_program_rules_updated_at before update on public.financing_program_rules for each row execute procedure public.set_updated_at();
alter table public.financing_program_rules enable row level security;
create policy "public active financing program rules" on public.financing_program_rules for select using (
  is_available and exists (
    select 1 from public.financing_programs p
    where p.id = financing_program_rules.financing_program_id and p.is_active
  )
);