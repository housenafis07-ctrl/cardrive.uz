alter table public.credit_applications
  add column if not exists oneid_consent_confirmed boolean not null default false,
  add column if not exists oneid_consent_confirmed_at timestamptz;

update public.credit_applications
set oneid_consent_confirmed_at = coalesce(oneid_consent_confirmed_at, created_at)
where oneid_consent_confirmed = true and oneid_consent_confirmed_at is null;

alter table public.credit_applications
  drop constraint if exists credit_applications_oneid_consent_check;

alter table public.credit_applications
  add constraint credit_applications_oneid_consent_check
  check ((oneid_consent_confirmed = false) or oneid_consent_confirmed_at is not null);

create index if not exists credit_applications_oneid_consent_idx
  on public.credit_applications(oneid_consent_confirmed, oneid_consent_confirmed_at);
