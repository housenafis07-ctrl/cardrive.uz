\set ON_ERROR_STOP on

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END
$$;

-- Minimal disposable fixtures matching the objects touched by the security migration.
CREATE TABLE public.otp_verifications (
  id bigint generated always as identity primary key,
  phone text not null,
  purpose text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  verified_at timestamptz
);
CREATE TABLE public.audit_logs (id bigint generated always as identity primary key);
CREATE TABLE public.promo_codes (
  code text primary key,
  used boolean not null default false,
  used_at timestamptz
);
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE FUNCTION public.sync_all_car_category_items()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN RETURN; END $$;
CREATE FUNCTION public.sync_car_category_items(uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN RETURN; END $$;
CREATE FUNCTION public.sync_car_category_items_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN RETURN NEW; END $$;
CREATE FUNCTION public.redeem_promo_code(text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN RETURN false; END $$;

\ir ../../supabase/migrations/20261117090000_cardrive_security_foundation.sql

DO $$
DECLARE
  config text[];
BEGIN
  IF has_table_privilege('anon', 'public.otp_verifications', 'SELECT')
     OR has_table_privilege('authenticated', 'public.otp_verifications', 'SELECT')
     OR has_table_privilege('anon', 'public.audit_logs', 'SELECT')
     OR has_table_privilege('authenticated', 'public.audit_logs', 'SELECT')
     OR has_table_privilege('anon', 'public.promo_codes', 'SELECT')
     OR has_table_privilege('authenticated', 'public.promo_codes', 'SELECT') THEN
    RAISE EXCEPTION 'Client roles must not read protected Cardrive tables';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.otp_verifications', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.audit_logs', 'SELECT') THEN
    RAISE EXCEPTION 'service_role must retain server access to protected tables';
  END IF;

  IF has_function_privilege('anon', 'public.redeem_promo_code(text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.redeem_promo_code(text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.redeem_promo_code(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Promo redemption RPC grants are incorrect';
  END IF;

  IF has_function_privilege('anon', 'public.sync_all_car_category_items()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.sync_car_category_items(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Internal category sync functions must not be public RPCs';
  END IF;

  SELECT proconfig INTO config
    FROM pg_proc
   WHERE oid = 'public.redeem_promo_code(text)'::regprocedure;

  IF config IS NULL OR NOT (config @> ARRAY['search_path=""']) THEN
    RAISE EXCEPTION 'Promo redemption function must have an empty search_path';
  END IF;

  INSERT INTO public.promo_codes(code, used) VALUES ('TEST-CODE', false);
  IF public.redeem_promo_code('TEST-CODE') IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Server-side promo redemption should continue to work';
  END IF;
END
$$;

-- Trigger execution must remain functional even though clients cannot call the trigger function directly.
CREATE TABLE public.trigger_probe (updated_at timestamptz);
CREATE TRIGGER trigger_probe_updated_at
BEFORE UPDATE ON public.trigger_probe
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.trigger_probe(updated_at) VALUES ('2000-01-01T00:00:00Z');
UPDATE public.trigger_probe SET updated_at = '2001-01-01T00:00:00Z';
DO $$
BEGIN
  IF (SELECT updated_at FROM public.trigger_probe) <= '2001-01-01T00:00:00Z' THEN
    RAISE EXCEPTION 'set_updated_at trigger did not execute';
  END IF;
END
$$;

\ir ../../supabase/migrations/20261117100000_otp_request_rate_limit.sql

DO $$
DECLARE
  allowed boolean;
  current_count integer;
BEGIN
  IF has_table_privilege('anon', 'public.otp_request_limits', 'SELECT')
     OR has_table_privilege('authenticated', 'public.otp_request_limits', 'SELECT') THEN
    RAISE EXCEPTION 'Client roles must not read OTP request limits';
  END IF;

  IF has_function_privilege('anon', 'public.consume_otp_request_slot(text,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.consume_otp_request_slot(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Client roles must not execute OTP rate-limit function';
  END IF;

  IF NOT has_function_privilege('service_role', 'public.consume_otp_request_slot(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role must execute OTP rate-limit function';
  END IF;

  IF public.consume_otp_request_slot('not-a-phone', 'login') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Invalid phone must be rejected';
  END IF;

  IF public.consume_otp_request_slot('+998901234567', 'unknown') IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Invalid purpose must be rejected';
  END IF;

  IF public.consume_otp_request_slot('+998901234567', NULL) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Null purpose must be rejected';
  END IF;

  FOR current_count IN 1..5 LOOP
    allowed := public.consume_otp_request_slot('+998901234567', 'login');
    IF allowed IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'OTP request % should be allowed', current_count;
    END IF;
    UPDATE public.otp_request_limits
       SET last_requested_at = pg_catalog.now() - interval '61 seconds'
     WHERE phone = '+998901234567' AND purpose = 'login';
  END LOOP;

  allowed := public.consume_otp_request_slot('+998901234567', 'login');
  IF allowed IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Sixth OTP request in one hour must be rejected';
  END IF;

  UPDATE public.otp_request_limits
     SET window_started_at = pg_catalog.now() - interval '61 minutes',
         last_requested_at = pg_catalog.now() - interval '61 seconds'
   WHERE phone = '+998901234567' AND purpose = 'login';

  allowed := public.consume_otp_request_slot('+998901234567', 'login');
  IF allowed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'OTP request should be allowed after rolling-hour reset';
  END IF;

  SELECT request_count INTO current_count
    FROM public.otp_request_limits
   WHERE phone = '+998901234567' AND purpose = 'login';

  IF current_count <> 1 THEN
    RAISE EXCEPTION 'Rolling-hour reset must set request_count to 1, got %', current_count;
  END IF;
END
$$;

SELECT 'Cardrive security and OTP migration tests passed' AS result;
