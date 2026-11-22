-- Avtobozor-specific credit application workflow.
-- Isolated from credit_applications used by the new-car catalogue.
create table if not exists public.used_car_credit_applications (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.used_car_listings(id) on delete restrict,
 applicant_id uuid not null references public.profiles(id) on delete restrict,
 bank_id uuid not null references public.banks(id) on delete restrict,
 financing_program_id uuid not null references public.financing_programs(id) on delete restrict,
 applicant_phone text not null,
 pinfl text not null check (pinfl ~ '^[0-9]{14}$'),
 document_type text not null check (document_type in ('passport','id_card')),
 document_series text,
 document_number text not null check (document_number ~ '^[A-Z0-9]{7,12}$'),
 document_front_path text not null,
 document_back_path text not null,
 personal_data_consent boolean not null default false,
 personal_data_consent_at timestamptz,
 car_price numeric(14,2) not null check (car_price > 0),
 car_currency text not null check (car_currency in ('UZS','USD')),
 credit_currency text not null check (credit_currency in ('UZS','USD')),
 annual_interest_rate numeric(7,3) not null check (annual_interest_rate between 0 and 100),
 down_payment_percent numeric(5,2) not null check (down_payment_percent between 0 and 100),
 term_months integer not null check (term_months between 1 and 120),
 estimated_monthly_payment numeric(14,2) not null check (estimated_monthly_payment >= 0),
 status text not null default 'pending' check (status in ('pending','under_review','sent_to_bank','approved','rejected','cancelled')),
 admin_notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint used_car_credit_personal_consent_check check (personal_data_consent and personal_data_consent_at is not null)
);
create index if not exists used_car_credit_applications_created_idx on public.used_car_credit_applications(created_at desc);
create index if not exists used_car_credit_applications_applicant_idx on public.used_car_credit_applications(applicant_id,created_at desc);
create index if not exists used_car_credit_applications_listing_idx on public.used_car_credit_applications(listing_id,created_at desc);
alter table public.used_car_credit_applications enable row level security;
revoke all on public.used_car_credit_applications from anon, authenticated;
grant all on public.used_car_credit_applications to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('used-car-credit-documents','used-car-credit-documents',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
-- No client storage policies: uploads and signed reads use the server-only service role
-- after the customer session or administrator role has been checked.
