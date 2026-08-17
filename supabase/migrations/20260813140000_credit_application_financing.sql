alter table public.credit_applications
  add column financing_program_id uuid references public.financing_programs(id);

alter table public.credit_applications
  add constraint credit_applications_status_check
  check (status in ('pending','submitted','approved','rejected','cancelled','failed'));

create index credit_applications_financing_program_idx on public.credit_applications(financing_program_id);
