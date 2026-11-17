\set ON_ERROR_STOP on

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
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

SELECT 'OTP rate-limit migration tests passed' AS result;
