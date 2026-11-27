-- Shared provider-neutral payment attempts, following the proven RoyalHouse Payme/Click lifecycle.
-- This migration is additive and must be applied only after an independently verified backup.

create sequence if not exists public.monetization_click_prepare_seq;

create table if not exists public.monetization_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.monetization_orders(id) on delete restrict,
  customer_profile_id uuid not null references public.profiles(id) on delete restrict,
  provider text not null check (provider in ('payme','click')),
  provider_payment_id text,
  provider_prepare_id bigint,
  provider_paydoc_id text,
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled','refunded')),
  amount_uzs numeric(14,2) not null check (amount_uzs > 0),
  currency text not null default 'UZS' check (currency = 'UZS'),
  idempotency_key text not null unique,
  checkout_url text,
  provider_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists monetization_payment_attempts_provider_payment_key
  on public.monetization_payment_attempts(provider, provider_payment_id)
  where provider_payment_id is not null;
create unique index if not exists monetization_payment_attempts_active_order_provider_key
  on public.monetization_payment_attempts(order_id, provider)
  where status in ('pending','processing');
create index if not exists monetization_payment_attempts_order_idx
  on public.monetization_payment_attempts(order_id, created_at desc);

alter table public.monetization_payment_attempts enable row level security;
revoke all on public.monetization_payment_attempts from anon, authenticated, public;
grant all on public.monetization_payment_attempts to service_role;

create or replace function public.create_monetization_payment_attempt(
  p_order_id uuid,
  p_customer_profile_id uuid,
  p_provider text,
  p_idempotency_key text
) returns public.monetization_payment_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.monetization_orders%rowtype;
  v_attempt public.monetization_payment_attempts%rowtype;
  v_provider text := pg_catalog.lower(pg_catalog.btrim(pg_catalog.coalesce(p_provider,'')));
  v_key text := pg_catalog.btrim(pg_catalog.coalesce(p_idempotency_key,''));
begin
  if p_order_id is null or p_customer_profile_id is null or v_provider not in ('payme','click')
     or v_key = '' or pg_catalog.length(v_key) > 128 then
    raise exception 'invalid_payment_attempt_request' using errcode = '22023';
  end if;

  select * into v_order from public.monetization_orders
  where id = p_order_id and customer_profile_id = p_customer_profile_id
  for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if v_order.status <> 'pending' then raise exception 'order_not_payable' using errcode = 'P0001'; end if;
  if v_order.currency <> 'UZS' or v_order.total_amount <= 0 then
    raise exception 'payment_currency_or_amount_invalid' using errcode = '22023';
  end if;
  if v_order.payment_provider is not null and v_order.payment_provider <> v_provider then
    raise exception 'payment_provider_mismatch' using errcode = 'P0001';
  end if;

  select * into v_attempt from public.monetization_payment_attempts
  where idempotency_key = v_key;
  if found then
    if v_attempt.order_id <> p_order_id or v_attempt.customer_profile_id <> p_customer_profile_id
       or v_attempt.provider <> v_provider then
      raise exception 'payment_idempotency_key_conflict' using errcode = '23505';
    end if;
    return v_attempt;
  end if;

  select * into v_attempt from public.monetization_payment_attempts
  where order_id = p_order_id and provider = v_provider and status in ('pending','processing')
  order by created_at desc limit 1;
  if found then return v_attempt; end if;

  insert into public.monetization_payment_attempts
    (order_id, customer_profile_id, provider, amount_uzs, currency, idempotency_key)
  values
    (p_order_id, p_customer_profile_id, v_provider, v_order.total_amount, v_order.currency, v_key)
  returning * into v_attempt;

  update public.monetization_orders
    set payment_provider = v_provider, updated_at = pg_catalog.now()
  where id = p_order_id;
  return v_attempt;
end;
$$;

create or replace function public.allocate_monetization_click_prepare_id()
returns bigint
language sql
security definer
set search_path = ''
as $$ select pg_catalog.nextval('public.monetization_click_prepare_seq'); $$;

create or replace function public.prepare_monetization_click_payment(
  p_attempt_id uuid,
  p_click_trans_id text,
  p_click_paydoc_id text,
  p_amount numeric,
  p_service_id text,
  p_payload jsonb
) returns table(error_code integer, error_note text, merchant_prepare_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.monetization_payment_attempts%rowtype;
  v_order public.monetization_orders%rowtype;
  v_prepare bigint;
begin
  if p_attempt_id is null or p_click_trans_id is null or p_click_trans_id !~ '^[0-9]{1,30}$'
     or p_amount is null or p_amount <= 0 or p_service_id is null then
    return query select -3, 'Invalid request parameters', null::bigint; return;
  end if;
  select * into v_attempt from public.monetization_payment_attempts
    where id=p_attempt_id and provider='click' for update;
  if not found then return query select -5, 'Order not found', null::bigint; return; end if;
  select * into v_order from public.monetization_orders where id=v_attempt.order_id for update;
  if not found then return query select -5, 'Order not found', null::bigint; return; end if;
  if v_attempt.currency <> 'UZS' or v_attempt.amount_uzs <> p_amount then
    return query select -2, 'Incorrect amount', null::bigint; return;
  end if;
  if v_attempt.status='paid' then
    return query select -4, 'Already paid', v_attempt.provider_prepare_id; return;
  end if;
  if v_attempt.status='processing' then
    if v_attempt.provider_payment_id=p_click_trans_id and v_attempt.provider_prepare_id is not null then
      return query select 0, 'Success', v_attempt.provider_prepare_id; return;
    end if;
    return query select -7, 'Another transaction is in progress', null::bigint; return;
  end if;
  if v_attempt.status <> 'pending' or v_order.status <> 'pending' then
    return query select -5, 'Order is not payable', null::bigint; return;
  end if;
  v_prepare := pg_catalog.nextval('public.monetization_click_prepare_seq');
  update public.monetization_payment_attempts set
    status='processing', provider_payment_id=p_click_trans_id,
    provider_prepare_id=v_prepare, provider_paydoc_id=p_click_paydoc_id,
    provider_payload=coalesce(provider_payload,'{}'::jsonb)||jsonb_build_object('click',coalesce(p_payload,'{}'::jsonb)),
    updated_at=pg_catalog.now()
  where id=p_attempt_id;
  return query select 0, 'Success', v_prepare;
end;
$$;

create or replace function public.confirm_monetization_payment_attempt(
  p_attempt_id uuid,
  p_provider_payment_id text,
  p_provider_paydoc_id text,
  p_paid_amount numeric,
  p_currency text,
  p_provider_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.monetization_payment_attempts%rowtype;
  v_confirmed boolean;
begin
  select * into v_attempt from public.monetization_payment_attempts
    where id=p_attempt_id for update;
  if not found then raise exception 'payment_attempt_not_found' using errcode='P0002'; end if;
  if v_attempt.currency <> p_currency or v_attempt.amount_uzs <> p_paid_amount then
    raise exception 'payment_amount_or_currency_mismatch' using errcode='22023';
  end if;
  if v_attempt.provider_payment_id is not null and v_attempt.provider_payment_id <> p_provider_payment_id then
    raise exception 'provider_payment_id_mismatch' using errcode='23505';
  end if;
  if v_attempt.status='paid' then
    return pg_catalog.jsonb_build_object('paid',true,'already_paid',true,'order_id',v_attempt.order_id);
  end if;
  if v_attempt.status not in ('pending','processing') then
    raise exception 'payment_attempt_not_processing' using errcode='P0001';
  end if;

  v_confirmed := public.confirm_monetization_payment(
    v_attempt.order_id, v_attempt.provider, p_provider_payment_id,
    p_provider_payment_id, p_paid_amount, p_currency
  );
  if v_confirmed is distinct from true then raise exception 'payment_confirmation_failed'; end if;

  update public.monetization_payment_attempts set
    status='paid', provider_payment_id=p_provider_payment_id,
    provider_paydoc_id=p_provider_paydoc_id,
    provider_payload=coalesce(provider_payload,'{}'::jsonb)||jsonb_build_object('confirmation',coalesce(p_provider_payload,'{}'::jsonb)),
    paid_at=pg_catalog.now(), updated_at=pg_catalog.now()
  where id=p_attempt_id;
  return pg_catalog.jsonb_build_object('paid',true,'already_paid',false,'order_id',v_attempt.order_id);
end;
$$;


create or replace function public.bind_payme_monetization_transaction(
  p_order_id uuid,
  p_payme_transaction_id text,
  p_amount_tiyin bigint,
  p_payme_payload jsonb
) returns table(attempt_id uuid, attempt_status text, error_code integer)
language plpgsql
security definer
set search_path = ''
as $
declare
  v_order public.monetization_orders%rowtype;
  v_attempt public.monetization_payment_attempts%rowtype;
  v_amount numeric(14,2);
begin
  if p_order_id is null or p_payme_transaction_id is null or p_payme_transaction_id = ''
     or p_amount_tiyin is null or p_amount_tiyin < 1 then
    return query select null::uuid, null::text, -32602; return;
  end if;
  v_amount := p_amount_tiyin::numeric / 100;
  select * into v_order from public.monetization_orders where id=p_order_id for update;
  if not found then return query select null::uuid, null::text, -31050; return; end if;
  if v_order.currency <> 'UZS' or v_order.total_amount <> v_amount then
    return query select null::uuid, null::text, -31001; return;
  end if;
  if v_order.status='paid' then return query select null::uuid, 'paid', -31008; return; end if;
  if v_order.status <> 'pending' or v_order.payment_provider <> 'payme' then
    return query select null::uuid, null::text, -31008; return;
  end if;

  select * into v_attempt from public.monetization_payment_attempts
    where order_id=p_order_id and provider='payme' and status in ('pending','processing')
    order by created_at desc limit 1 for update;
  if not found then return query select null::uuid, null::text, -31008; return; end if;
  if v_attempt.provider_payment_id is not null then
    if v_attempt.provider_payment_id <> p_payme_transaction_id then
      return query select null::uuid, null::text, -31099; return;
    end if;
    return query select v_attempt.id, v_attempt.status, 0; return;
  end if;

  update public.monetization_payment_attempts set
    provider_payment_id=p_payme_transaction_id,
    status='processing',
    provider_payload=coalesce(provider_payload,'{}'::jsonb)||jsonb_build_object('payme',coalesce(p_payme_payload,'{}'::jsonb)),
    updated_at=pg_catalog.now()
  where id=v_attempt.id;
  return query select v_attempt.id, 'processing'::text, 0;
end;
$;

create or replace function public.cancel_monetization_payment_attempt(
  p_attempt_id uuid,
  p_cancel_reason integer,
  p_cancel_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $
declare
  v_attempt public.monetization_payment_attempts%rowtype;
  v_order public.monetization_orders%rowtype;
  v_item record;
begin
  select * into v_attempt from public.monetization_payment_attempts where id=p_attempt_id for update;
  if not found then raise exception 'payment_attempt_not_found'; end if;
  select * into v_order from public.monetization_orders where id=v_attempt.order_id for update;
  if v_attempt.status='cancelled' then
    return pg_catalog.jsonb_build_object('cancelled',true,'state',-1);
  end if;
  if v_attempt.status='refunded' then
    return pg_catalog.jsonb_build_object('cancelled',true,'state',-2);
  end if;
  if v_attempt.status='paid' then
    update public.monetization_payment_attempts set status='refunded',
      provider_payload=coalesce(provider_payload,'{}'::jsonb)||jsonb_build_object('cancel',coalesce(p_cancel_payload,'{}'::jsonb)),
      updated_at=pg_catalog.now()
    where id=p_attempt_id;
    update public.monetization_orders set status='refunded',updated_at=pg_catalog.now()
      where id=v_order.id and status='paid';
    update public.monetization_entitlements set status='revoked',quantity_used=quantity_total
      where order_item_id in (select id from public.monetization_order_items where order_id=v_order.id)
        and status in ('active','exhausted');
    update public.used_car_listing_promotions set expires_at=pg_catalog.now()
      where entitlement_id in (select id from public.monetization_entitlements
        where order_item_id in (select id from public.monetization_order_items where order_id=v_order.id));
    return pg_catalog.jsonb_build_object('cancelled',true,'state',-2);
  end if;
  update public.monetization_payment_attempts set status='cancelled',
    provider_payload=coalesce(provider_payload,'{}'::jsonb)||jsonb_build_object('cancel',coalesce(p_cancel_payload,'{}'::jsonb)),
    updated_at=pg_catalog.now()
  where id=p_attempt_id and status in ('pending','processing');
  update public.monetization_orders set status='cancelled',updated_at=pg_catalog.now()
    where id=v_order.id and status='pending';
  return pg_catalog.jsonb_build_object('cancelled',true,'state',-1);
end;
$;

revoke all on function public.bind_payme_monetization_transaction(uuid,text,bigint,jsonb) from public, anon, authenticated;
revoke all on function public.cancel_monetization_payment_attempt(uuid,integer,jsonb) from public, anon, authenticated;
grant execute on function public.bind_payme_monetization_transaction(uuid,text,bigint,jsonb) to service_role;
grant execute on function public.cancel_monetization_payment_attempt(uuid,integer,jsonb) to service_role;

revoke all on function public.create_monetization_payment_attempt(uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.allocate_monetization_click_prepare_id() from public, anon, authenticated;
revoke all on function public.prepare_monetization_click_payment(uuid,text,text,numeric,text,jsonb) from public, anon, authenticated;
revoke all on function public.confirm_monetization_payment_attempt(uuid,text,text,numeric,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_monetization_payment_attempt(uuid,uuid,text,text) to service_role;
grant execute on function public.allocate_monetization_click_prepare_id() to service_role;
grant execute on function public.prepare_monetization_click_payment(uuid,text,text,numeric,text,jsonb) to service_role;
grant execute on function public.confirm_monetization_payment_attempt(uuid,text,text,numeric,text,jsonb) to service_role;
