alter table public.financing_programs alter column bank_id drop not null;

alter table public.financing_programs
  add column if not exists insurance_type text,
  add column if not exists insurance_amount numeric,
  add column if not exists insurance_percent numeric,
  add column if not exists benefits_uz text,
  add column if not exists benefits_ru text;

alter table public.financing_programs
  drop constraint if exists financing_programs_insurance_percent_check,
  drop constraint if exists financing_programs_insurance_amount_check;

alter table public.financing_programs
  add constraint financing_programs_insurance_percent_check check (insurance_percent is null or (insurance_percent >= 0 and insurance_percent <= 100)),
  add constraint financing_programs_insurance_amount_check check (insurance_amount is null or insurance_amount >= 0),
  add constraint financing_programs_credit_bank_check check (type <> 'credit' or bank_id is not null);

alter table public.financing_programs enable row level security;
drop policy if exists "cardrive public active financing programs" on public.financing_programs;
drop policy if exists "public active financing programs" on public.financing_programs;
create policy "cardrive public active financing programs" on public.financing_programs for select using (is_active and (bank_id is null or exists (select 1 from public.banks b where b.id = financing_programs.bank_id and b.is_active and coalesce(b.integration_status,'information_only') <> 'disabled')));
