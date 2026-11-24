-- Provider-neutral monetization checkout and verified-payment lifecycle.
-- Prices are always read from monetization_products on the server.
alter table public.monetization_order_items
  add column if not exists target_listing_id uuid references public.used_car_listings(id) on delete restrict;

create table if not exists public.monetization_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  order_id uuid not null references public.monetization_orders(id) on delete restrict,
  event_type text not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null check (currency in ('UZS','USD')),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);

create index if not exists monetization_payment_events_order_idx
  on public.monetization_payment_events(order_id, created_at desc);

alter table public.monetization_payment_events enable row level security;
revoke all on public.monetization_payment_events from anon, authenticated, public;
grant all on public.monetization_payment_events to service_role;

create or replace function public.create_monetization_order(
  p_customer_profile_id uuid,
  p_product_code text,
  p_target_listing_id uuid,
  p_idempotency_key text
) returns table(order_id uuid, total_amount numeric, currency text, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.monetization_products%rowtype;
  v_order_id uuid;
begin
  if p_customer_profile_id is null or p_product_code is null or length(p_product_code) > 80
     or p_idempotency_key is null or length(p_idempotency_key) < 12 then
    raise exception 'invalid_order_request';
  end if;

  select * into v_product
  from public.monetization_products
  where code = p_product_code and is_active = true
    and amount is not null and amount > 0
  for share;

  if not found then raise exception 'product_unavailable'; end if;

  if v_product.product_type = 'extra_listing' then
    if p_target_listing_id is not null then raise exception 'listing_not_applicable'; end if;
  else
    if p_target_listing_id is null or not exists (
      select 1 from public.used_car_listings l
      where l.id = p_target_listing_id and l.owner_profile_id = p_customer_profile_id
        and l.status in ('pending_review','active','reserved')
        and l.expires_at > pg_catalog.now()
    ) then
      raise exception 'listing_not_owned_or_not_active';
    end if;
  end if;

  insert into public.monetization_orders
    (customer_profile_id, status, total_amount, currency, idempotency_key)
  values
    (p_customer_profile_id, 'pending', v_product.amount * v_product.quantity,
     v_product.currency, p_idempotency_key)
  on conflict (idempotency_key) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    select o.id into v_order_id
    from public.monetization_orders o
    where o.idempotency_key = p_idempotency_key
      and o.customer_profile_id = p_customer_profile_id;
    if v_order_id is null then raise exception 'idempotency_key_conflict'; end if;
    return query select o.id, o.total_amount, o.currency, o.status
      from public.monetization_orders o where o.id = v_order_id;
    return;
  end if;

  insert into public.monetization_order_items
    (order_id, product_id, quantity, unit_amount, currency, target_listing_id, product_snapshot)
  values
    (v_order_id, v_product.id, v_product.quantity, v_product.amount, v_product.currency,
     p_target_listing_id,
     pg_catalog.jsonb_build_object(
       'code', v_product.code, 'title_uz', v_product.title_uz,
       'title_ru', v_product.title_ru, 'product_type', v_product.product_type,
       'duration_days', v_product.duration_days, 'quantity', v_product.quantity
     ));

  return query select o.id, o.total_amount, o.currency, o.status
    from public.monetization_orders o where o.id = v_order_id;
end;
$$;

create or replace function public.confirm_monetization_payment(
  p_order_id uuid,
  p_provider text,
  p_provider_event_id text,
  p_provider_reference text,
  p_paid_amount numeric,
  p_currency text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.monetization_orders%rowtype;
  v_event_id uuid;
  v_item record;
  v_now timestamptz := pg_catalog.now();
begin
  if p_order_id is null or p_provider is null or length(p_provider) > 40
     or p_provider_event_id is null or length(p_provider_event_id) > 200
     or p_provider_reference is null or length(p_provider_reference) > 200
     or p_paid_amount is null or p_paid_amount < 0
     or p_currency not in ('UZS','USD') then
    raise exception 'invalid_payment_confirmation';
  end if;

  select * into v_order
  from public.monetization_orders
  where id = p_order_id
  for update;
  if not found then raise exception 'order_not_found'; end if;

  insert into public.monetization_payment_events
    (provider, provider_event_id, order_id, event_type, amount, currency)
  values (p_provider, p_provider_event_id, p_order_id, 'payment.succeeded', p_paid_amount, p_currency)
  on conflict (provider, provider_event_id) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return v_order.status = 'paid';
  end if;

  if v_order.status = 'paid' then
    update public.monetization_payment_events set processed_at = v_now where id = v_event_id;
    return true;
  end if;
  if v_order.status <> 'pending' then
    raise exception 'order_not_payable';
  end if;
  if v_order.total_amount <> p_paid_amount or v_order.currency <> p_currency then
    raise exception 'payment_amount_or_currency_mismatch';
  end if;

  update public.monetization_orders
    set status = 'paid', payment_provider = p_provider,
        provider_reference = p_provider_reference, paid_at = v_now, updated_at = v_now
  where id = p_order_id;

  for v_item in
    select oi.*, p.product_type, p.duration_days
    from public.monetization_order_items oi
    join public.monetization_products p on p.id = oi.product_id
    where oi.order_id = p_order_id
  loop
    if v_item.product_type = 'extra_listing' then
      insert into public.monetization_entitlements
        (customer_profile_id, product_id, order_item_id, quantity_total, starts_at, status)
      values
        (v_order.customer_profile_id, v_item.product_id, v_item.id, v_item.quantity, v_now, 'active');
    else
      if v_item.target_listing_id is null or not exists (
        select 1 from public.used_car_listings l
        where l.id = v_item.target_listing_id and l.owner_profile_id = v_order.customer_profile_id
      ) then
        raise exception 'promotion_listing_invalid';
      end if;

      insert into public.monetization_entitlements
        (customer_profile_id, product_id, order_item_id, listing_id, quantity_total,
         starts_at, expires_at, status)
      values
        (v_order.customer_profile_id, v_item.product_id, v_item.id, v_item.target_listing_id,
         v_item.quantity, v_now, v_now + pg_catalog.make_interval(days => v_item.duration_days), 'active');
    end if;
  end loop;

  update public.monetization_payment_events set processed_at = v_now where id = v_event_id;
  return true;
end;
$$;

revoke all on function public.create_monetization_order(uuid,text,uuid,text) from public, anon, authenticated;
revoke all on function public.confirm_monetization_payment(uuid,text,text,text,numeric,text) from public, anon, authenticated;
grant execute on function public.create_monetization_order(uuid,text,uuid,text) to service_role;
grant execute on function public.confirm_monetization_payment(uuid,text,text,text,numeric,text) to service_role;
