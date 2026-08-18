alter table public.orders
  add column if not exists financing_program_id uuid references public.financing_programs(id);

create index if not exists orders_financing_program_idx
  on public.orders(financing_program_id);
