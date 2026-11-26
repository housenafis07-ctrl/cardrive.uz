-- Click Shop API: durable Prepare/Complete attempts and idempotent callbacks.
-- Additive migration; do not apply to Production until backup/PITR and migration review are approved.

create table if not exists public.monetization_click_attempts (
  merchant_prepare_id bigint generated always as identity primary key,
  click_trans_id text not null unique,
  click_paydoc_id text,
  order_id uuid not null references public.monetization_orders(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'UZS' check (currency = 'UZS'),
  service_id text not null,
  status text not null default 'prepared'
    check (status in ('prepared','completed','cancelled','failed')),
  click_error integer,
  sign_time text not null,
  prepared_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists monetization_click_one_prepared_attempt_per_order
  on public.monetization_click_attempts(order_id)
  where status = 'prepared';
create index if not exists monetization_click_attempts_order_idx
  on public.monetization_click_attempts(order_id, created_at desc);

alter table public.monetization_click_attempts enable row level security;
revoke all on public.monetization_click_attempts from anon, authenticated, public;
grant all on public.monetization_click_attempts to service_role;

create or replace function public.click_prepare_monetization_payment(
  p_click_trans_id text,
  p_click_paydoc_id text,
  p_order_id uuid,
  p_amount numeric,
  p_service_id text,
  p_sign_time text
) returns table(error_code integer, error_note text, merchant_prepare_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.monetization_orders%rowtype;
  v_attempt public.monetization_click_attempts%rowtype;
  v_prepare_id bigint;
begin
  if p_click_trans_id is null or p_click_trans_id !~ '^[0-9]{1,30}$'
     or p_order_id is null or p_amount is null or p_amount <= 0
     or p_service_id is null or length(p_service_id) > 64
     or p_sign_time is null or length(p_sign_time) > 64 then
    return query select -3, 'Invalid request parameters', null::bigint;
    return;
  end if;

  select * into v_order
  from public.monetization_orders o
  where o.id = p_order_id
  for update;

  if not found then
    return query select -5, 'Order not found', null::bigint;
    return;
  end if;

  if v_order.currency <> 'UZS' or v_order.total_amount <> p_amount then
    return query select -2, 'Incorrect amount', null::bigint;
    return;
  end if;

  select * into v_attempt
  from public.monetization_click_attempts a
  where a.click_trans_id = p_click_trans_id
  for update;

  if found then
    if v_attempt.order_id <> p_order_id or v_attempt.amount <> p_amount
       or v_attempt.service_id <> p_service_id then
      return query select -7, 'Transaction ID conflict', null::bigint;
      return;
    end if;
    if v_attempt.status = 'completed' then
      return query select -4, 'Already paid', v_attempt.merchant_prepare_id;
      return;
    end if;
    if v_attempt.status = 'prepared' then
      return query select 0, 'Success', v_attempt.merchant_prepare_id;
      return;
    end if;
    return query select -9, 'Transaction cancelled', v_attempt.merchant_prepare_id;
    return;
  end if;

  if v_order.status = 'paid' then
    return query select -4, 'Already paid', null::bigint;
    return;
  elsif v_order.status <> 'pending' then
    return query select -5, 'Order is not payable', null::bigint;
    return;
  end if;

  if exists (
    select 1 from public.monetization_click_attempts a
    where a.order_id = p_order_id and a.status = 'prepared'
  ) then
    return query select -7, 'Another Click transaction is already prepared', null::bigint;
    return;
  end if;

  insert into public.monetization_click_attempts
    (click_trans_id, click_paydoc_id, order_id, amount, service_id, sign_time)
  values
    (p_click_trans_id, p_click_paydoc_id, p_order_id, p_amount, p_service_id, p_sign_time)
  returning monetization_click_attempts.merchant_prepare_id into v_prepare_id;

  return query select 0, 'Success', v_prepare_id;
end;
$$;

create or replace function public.click_complete_monetization_payment(
  p_click_trans_id text,
  p_order_id uuid,
  p_merchant_prepare_id bigint,
  p_amount numeric,
  p_click_error integer
) returns table(error_code integer, error_note text, merchant_confirm_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.monetization_click_attempts%rowtype;
  v_order public.monetization_orders%rowtype;
  v_confirmed boolean;
begin
  if p_click_trans_id is null or p_order_id is null
     or p_merchant_prepare_id is null or p_amount is null or p_amount <= 0
     or p_click_error is null then
    return query select -3, 'Invalid request parameters', null::bigint;
    return;
  end if;

  select * into v_attempt
  from public.monetization_click_attempts a
  where a.click_trans_id = p_click_trans_id
  for update;

  if not found then
    return query select -6, 'Prepare transaction not found', null::bigint;
    return;
  end if;

  if v_attempt.order_id <> p_order_id
     or v_attempt.merchant_prepare_id <> p_merchant_prepare_id
     or v_attempt.amount <> p_amount then
    return query select -2, 'Transaction parameters mismatch', null::bigint;
    return;
  end if;

  if v_attempt.status = 'completed' then
    return query select 0, 'Success', v_attempt.merchant_prepare_id;
    return;
  elsif v_attempt.status = 'cancelled' or v_attempt.status = 'failed' then
    return query select -9, 'Transaction cancelled', v_attempt.merchant_prepare_id;
    return;
  end if;

  if p_click_error <> 0 then
    update public.monetization_click_attempts
      set status = 'cancelled', click_error = p_click_error,
          completed_at = pg_catalog.now(), updated_at = pg_catalog.now()
    where click_trans_id = p_click_trans_id;
    return query select -9, 'Payment cancelled by Click', v_attempt.merchant_prepare_id;
    return;
  end if;

  select * into v_order
  from public.monetization_orders o
  where o.id = p_order_id
  for update;

  if not found then
    return query select -5, 'Order not found', null::bigint;
    return;
  end if;

  if v_order.status = 'paid' and v_order.payment_provider <> 'click' then
    return query select -4, 'Order already paid by another provider', v_attempt.merchant_prepare_id;
    return;
  elsif v_order.status <> 'pending' and v_order.status <> 'paid' then
    return query select -9, 'Order is not payable', v_attempt.merchant_prepare_id;
    return;
  end if;

  v_confirmed := public.confirm_monetization_payment(
    p_order_id,
    'click',
    p_click_trans_id,
    p_click_trans_id,
    p_amount,
    'UZS'
  );

  if v_confirmed is distinct from true then
    return query select -8, 'Payment confirmation failed', v_attempt.merchant_prepare_id;
    return;
  end if;

  update public.monetization_click_attempts
    set status = 'completed', click_error = 0,
        completed_at = pg_catalog.now(), updated_at = pg_catalog.now()
  where click_trans_id = p_click_trans_id;

  return query select 0, 'Success', v_attempt.merchant_prepare_id;
end;
$$;

revoke all on function public.click_prepare_monetization_payment(text,text,uuid,numeric,text,text)
  from public, anon, authenticated;
revoke all on function public.click_complete_monetization_payment(text,uuid,bigint,numeric,integer)
  from public, anon, authenticated;
grant execute on function public.click_prepare_monetization_payment(text,text,uuid,numeric,text,text)
  to service_role;
grant execute on function public.click_complete_monetization_payment(text,uuid,bigint,numeric,integer)
  to service_role;
