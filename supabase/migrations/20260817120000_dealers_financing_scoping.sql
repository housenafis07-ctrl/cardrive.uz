alter table public.banks
  add column if not exists name_ru text,
  add column if not exists phone text,
  add column if not exists description text;

alter table public.financing_programs
  add column if not exists name_ru text,
  add column if not exists commission_percent numeric(5,2) check (commission_percent is null or commission_percent >= 0);

create table if not exists public.dealers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  phone text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cars add column if not exists dealer_id uuid references public.dealers(id) on delete set null;

create table if not exists public.financing_program_cars (
  financing_program_id uuid not null references public.financing_programs(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  primary key (financing_program_id, car_id)
);

create table if not exists public.dealer_financing_programs (
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  financing_program_id uuid not null references public.financing_programs(id) on delete cascade,
  primary key (dealer_id, financing_program_id)
);

create index if not exists cars_dealer_id_idx on public.cars(dealer_id);
create index if not exists financing_program_cars_car_idx on public.financing_program_cars(car_id);
create index if not exists dealer_financing_programs_program_idx on public.dealer_financing_programs(financing_program_id);

create trigger dealers_updated_at before update on public.dealers for each row execute procedure public.set_updated_at();

alter table public.dealers enable row level security;
alter table public.financing_program_cars enable row level security;
alter table public.dealer_financing_programs enable row level security;

create policy "public active dealer financing links" on public.dealer_financing_programs for select using (
  exists (select 1 from public.dealers d where d.id = dealer_id and d.is_active)
  and exists (select 1 from public.financing_programs p where p.id = financing_program_id and p.is_active)
);

create policy "public active financing car links" on public.financing_program_cars for select using (
  exists (select 1 from public.financing_programs p where p.id = financing_program_id and p.is_active)
);

create policy "public active dealer cars" on public.dealers for select using (is_active);
