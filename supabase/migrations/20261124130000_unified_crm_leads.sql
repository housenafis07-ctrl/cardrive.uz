create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('jivo','telegram','new_car_advice','website_chat')),
  external_id text,
  customer_name text,
  phone text,
  telegram_username text,
  message text,
  car_id uuid references public.cars(id) on delete set null,
  car_name text,
  car_url text,
  status text not null default 'new' check (status in ('new','in_progress','contacted','resolved','spam')),
  assigned_to uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id)
);
create index if not exists crm_leads_created_at_idx on public.crm_leads(created_at desc);
create index if not exists crm_leads_source_status_idx on public.crm_leads(source,status,created_at desc);
create index if not exists crm_leads_assigned_to_idx on public.crm_leads(assigned_to);
alter table public.crm_leads enable row level security;
revoke all on public.crm_leads from anon, authenticated;
grant all on public.crm_leads to service_role;
create or replace function public.crm_leads_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists crm_leads_touch_updated_at on public.crm_leads;
create trigger crm_leads_touch_updated_at before update on public.crm_leads
for each row execute function public.crm_leads_touch_updated_at();
