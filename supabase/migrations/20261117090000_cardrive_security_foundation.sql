-- Cardrive OTP proof consumption and database privilege hardening.
-- Apply only after migration-history reconciliation and isolated-database validation.

alter table public.otp_verifications
  add column if not exists consumed_at timestamptz;

-- OTP hashes and audit records are accessed only through trusted server code.
revoke all on table public.otp_verifications from public, anon, authenticated;
revoke all on table public.audit_logs from public, anon, authenticated;

-- Promo rows are not directly exposed. The RPC privilege is handled separately
-- after its callers have been audited; see docs/architecture/security-findings.md.
revoke all on table public.promo_codes from public, anon, authenticated;

-- A trigger utility should not be directly callable as a PostgREST RPC.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$function$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- These functions are invoked by already-installed database triggers and by
-- other owner-executed trigger helpers. They are not public RPC endpoints.
revoke execute on function public.sync_all_car_category_items() from public, anon, authenticated;
revoke execute on function public.sync_car_category_items(uuid) from public, anon, authenticated;
revoke execute on function public.sync_car_category_items_trigger() from public, anon, authenticated;

-- Pin the remaining promo-code function's search_path. Its EXECUTE grants
-- remain unchanged until all application call sites are verified.
alter function public.redeem_promo_code(text) set search_path = '';
create or replace function public.redeem_promo_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_updated integer;
begin
  update public.promo_codes
     set used = true,
         used_at = pg_catalog.now()
   where code = upper(trim(p_code))
     and used = false;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$function$;
