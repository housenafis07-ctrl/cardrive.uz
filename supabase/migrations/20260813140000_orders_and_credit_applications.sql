create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  car_id uuid not null references public.cars(id),
  purchase_type text not null default 'financing' check (purchase_type in ('financing','online')),
  status text not null default 'pending' check (status in ('pending','confirmed','processing','completed','cancelled')),
  financing_program_id uuid references public.financing_programs(id),
  car_price numeric(14,2) not null,
  down_payment numeric(14,2),
  financed_amount numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid,
  created_at timestamptz not null default now()
);

create table public.credit_applications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  bank_id uuid references public.banks(id),
  financing_program_id uuid references public.financing_programs(id),
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected','cancelled')),
  external_application_id text,
  status_synced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index credit_applications_customer_idx on public.credit_applications(customer_id);

alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.credit_applications enable row level security;

create policy "customers read own orders" on public.orders for select using (customer_id = auth.uid());
create policy "customers read own applications" on public.credit_applications for select using (customer_id = auth.uid());
