alter table public.credit_applications
  add column if not exists personal_data_consent boolean not null default false,
  add column if not exists personal_data_consent_at timestamptz,
  add column if not exists applicant_phone text,
  add column if not exists pinfl text,
  add column if not exists passport_series text,
  add column if not exists passport_number text,
  add column if not exists passport_front_path text,
  add column if not exists passport_back_path text;

alter table public.credit_applications
  add constraint credit_applications_pinfl_format_check
  check (pinfl is null or pinfl ~ '^[0-9]{14}$'),
  add constraint credit_applications_passport_series_format_check
  check (passport_series is null or passport_series ~ '^[A-Z]{2}$'),
  add constraint credit_applications_passport_number_format_check
  check (passport_number is null or passport_number ~ '^[0-9]{7}$'),
  add constraint credit_applications_personal_consent_check
  check ((personal_data_consent = false) or personal_data_consent_at is not null);

create index if not exists credit_applications_pinfl_idx on public.credit_applications(pinfl);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('credit-application-documents','credit-application-documents',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

-- No client-facing storage policies are added. Uploads and short-lived signed reads
-- are performed server-side after customer/admin authorization.
