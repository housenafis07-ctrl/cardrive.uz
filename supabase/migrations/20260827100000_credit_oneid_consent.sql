alter table public.credit_applications
  add column if not exists oneid_consent_confirmed boolean not null default false,
  add column if not exists oneid_consent_confirmed_at timestamptz;

create index if not exists credit_applications_oneid_consent_idx
  on public.credit_applications(oneid_consent_confirmed, oneid_consent_confirmed_at);
