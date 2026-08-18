alter table public.banks
  add column if not exists name_ru text,
  add column if not exists logo_url text,
  add column if not exists website_url text,
  add column if not exists phone text,
  add column if not exists description text,
  add column if not exists integration_status text not null default 'information_only' check (integration_status in ('information_only','connected','disabled')),
  add column if not exists display_order integer not null default 0;

alter table public.financing_programs
  add column if not exists description text,
  add column if not exists max_financing_percent numeric,
  add column if not exists min_amount numeric,
  add column if not exists max_amount numeric,
  add column if not exists currency char(3) not null default 'UZS',
  add column if not exists eligibility_notes text,
  add column if not exists source_url text,
  add column if not exists source_label text,
  add column if not exists last_verified_at timestamptz;

alter table public.banks enable row level security;
alter table public.financing_programs enable row level security;
alter table public.dealers enable row level security;
alter table public.financing_program_cars enable row level security;
alter table public.financing_program_dealers enable row level security;

create policy "public active banks" on public.banks for select using (is_active and coalesce(integration_status,'information_only') <> 'disabled');
create policy "public active financing programs" on public.financing_programs for select using (is_active and exists (select 1 from public.banks b where b.id=financing_programs.bank_id and b.is_active and coalesce(b.integration_status,'information_only') <> 'disabled'));
create policy "public active dealers" on public.dealers for select using (is_active);
create policy "public active financing car links" on public.financing_program_cars for select using (exists (select 1 from public.financing_programs p where p.id=financing_program_id and p.is_active));
create policy "public active financing dealer links" on public.financing_program_dealers for select using (exists (select 1 from public.dealers d where d.id=dealer_id and d.is_active) and exists (select 1 from public.financing_programs p where p.id=financing_program_id and p.is_active));
