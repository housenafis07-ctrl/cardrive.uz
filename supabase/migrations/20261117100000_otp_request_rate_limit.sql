-- Per-phone OTP issuance rate limit.
-- Apply only after migration-history reconciliation and isolated database validation.
create table if not exists public.otp_request_limits (
  phone text not null,
  purpose text not null check (purpose in ('login', 'order')),
  window_started_at timestamptz not null default pg_catalog.now(),
  request_count integer not null default 1 check (request_count between 1 and 5),
  last_requested_at timestamptz not null default pg_catalog.now(),
  primary key (phone, purpose)
);

alter table public.otp_request_limits enable row level security;
revoke all on table public.otp_request_limits from public, anon, authenticated;
grant all on table public.otp_request_limits to service_role;

create or replace function public.consume_otp_request_slot(
  p_phone text,
  p_purpose text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_allowed boolean := false;
begin
  if p_phone is null or length(p_phone) < 8 or p_phone !~ '^\+[0-9]+$' then
    return false;
  end if;

  if p_purpose is null or p_purpose not in ('login', 'order') then
    return false;
  end if;

  insert into public.otp_request_limits (
    phone, purpose, window_started_at, request_count, last_requested_at
  )
  values (
    p_phone, p_purpose, pg_catalog.now(), 1, pg_catalog.now()
  )
  on conflict (phone, purpose) do update
    set window_started_at = case
          when public.otp_request_limits.window_started_at <= pg_catalog.now() - interval '1 hour'
          then pg_catalog.now()
          else public.otp_request_limits.window_started_at
        end,
        request_count = case
          when public.otp_request_limits.window_started_at <= pg_catalog.now() - interval '1 hour'
          then 1
          else public.otp_request_limits.request_count + 1
        end,
        last_requested_at = pg_catalog.now()
    where public.otp_request_limits.window_started_at <= pg_catalog.now() - interval '1 hour'
       or (
         public.otp_request_limits.request_count < 5
         and public.otp_request_limits.last_requested_at <= pg_catalog.now() - interval '60 seconds'
       )
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$function$;

revoke all on function public.consume_otp_request_slot(text, text) from public, anon, authenticated;
grant execute on function public.consume_otp_request_slot(text, text) to service_role;
