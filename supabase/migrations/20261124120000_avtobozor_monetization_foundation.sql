-- Avtobozor monetization foundation. Additive only; apply through reviewed staging migration flow.
create table if not exists public.monetization_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title_uz text not null,
  title_ru text not null,
  description_uz text,
  description_ru text,
  product_type text not null check (product_type in ('extra_listing','top','bump','highlight','premium')),
  duration_days integer check (duration_days is null or duration_days > 0),
  quantity integer not null default 1 check (quantity > 0),
  amount numeric(14,2) check (amount is null or amount >= 0),
  currency text not null default 'UZS' check (currency in ('UZS','USD')),
  is_active boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monetization_products_duration_by_type_check check (
    (product_type = 'extra_listing' and duration_days is null)
    or (product_type <> 'extra_listing' and duration_days is not null)
  ),
  constraint monetization_products_active_price_check check (
    not is_active or (amount is not null and amount > 0)
  )
);

create table if not exists public.monetization_orders (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  total_amount numeric(14,2) not null check (total_amount >= 0),
  currency text not null default 'UZS' check (currency in ('UZS','USD')),
  payment_provider text,
  provider_reference text,
  idempotency_key text not null unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monetization_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.monetization_orders(id) on delete cascade,
  product_id uuid not null references public.monetization_products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_amount numeric(14,2) not null check (unit_amount >= 0),
  currency text not null check (currency in ('UZS','USD')),
  product_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.monetization_entitlements (
  id uuid primary key default gen_random_uuid(),
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.monetization_products(id) on delete restrict,
  order_item_id uuid references public.monetization_order_items(id) on delete restrict,
  listing_id uuid references public.used_car_listings(id) on delete cascade,
  quantity_total integer not null default 1 check (quantity_total > 0),
  quantity_used integer not null default 0 check (quantity_used >= 0 and quantity_used <= quantity_total),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  consumed_at timestamptz,
  consumed_for_listing_id uuid, -- intentionally retained after listing deletion so release RPC can restore the slot
  status text not null default 'active' check (status in ('active','exhausted','expired','revoked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists monetization_entitlements_customer_available_idx
  on public.monetization_entitlements(customer_profile_id, product_id, starts_at)
  where status = 'active' and quantity_used < quantity_total;

create table if not exists public.used_car_listing_promotions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.used_car_listings(id) on delete cascade,
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  entitlement_id uuid not null references public.monetization_entitlements(id) on delete restrict,
  promotion_type text not null check (promotion_type in ('top','bump','highlight','premium')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists used_car_listing_promotions_live_idx
  on public.used_car_listing_promotions(listing_id, promotion_type, expires_at);

create table if not exists public.used_car_listing_quota_reservations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique,
  customer_profile_id uuid not null references public.profiles(id) on delete cascade,
  entitlement_id uuid references public.monetization_entitlements(id) on delete restrict,
  expires_at timestamptz not null default now() + interval '20 minutes',
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists used_car_listing_quota_reservations_customer_idx
  on public.used_car_listing_quota_reservations(customer_profile_id, expires_at)
  where consumed_at is null;

alter table public.monetization_products enable row level security;
alter table public.monetization_orders enable row level security;
alter table public.monetization_order_items enable row level security;
alter table public.monetization_entitlements enable row level security;
alter table public.used_car_listing_promotions enable row level security;
alter table public.used_car_listing_quota_reservations enable row level security;

revoke all on public.monetization_products, public.monetization_orders,
  public.monetization_order_items, public.monetization_entitlements,
  public.used_car_listing_promotions, public.used_car_listing_quota_reservations
  from anon, authenticated, public;
grant all on public.monetization_products, public.monetization_orders,
  public.monetization_order_items, public.monetization_entitlements,
  public.used_car_listing_promotions, public.used_car_listing_quota_reservations
  to service_role;

insert into public.monetization_products
  (code, title_uz, title_ru, product_type, duration_days, quantity, is_active, metadata)
values
  ('extra_listing', 'Qo‘shimcha e’lon', 'Дополнительное объявление', 'extra_listing', null, 1, false, '{"billing":"one_time_slot"}'),
  ('top_1d', 'TOP — 1 kun', 'TOP — 1 день', 'top', 1, 1, false, '{}'),
  ('top_3d', 'TOP — 3 kun', 'TOP — 3 дня', 'top', 3, 1, false, '{}'),
  ('top_7d', 'TOP — 7 kun', 'TOP — 7 дней', 'top', 7, 1, false, '{}'),
  ('top_14d', 'TOP — 14 kun', 'TOP — 14 дней', 'top', 14, 1, false, '{}'),
  ('top_30d', 'TOP — 30 kun', 'TOP — 30 дней', 'top', 30, 1, false, '{}'),
  ('bump_1d', 'UP — 1 kun', 'Поднять — 1 день', 'bump', 1, 1, false, '{}'),
  ('highlight_7d', 'Ajratib ko‘rsatish — 7 kun', 'Выделение — 7 дней', 'highlight', 7, 1, false, '{}'),
  ('premium_30d', 'Premium — 30 kun', 'Premium — 30 дней', 'premium', 30, 1, false, '{}')
on conflict (code) do nothing;

create or replace function public.reserve_used_car_listing_slot(
  p_customer_profile_id uuid,
  p_listing_id uuid
) returns table(allowed boolean, reservation_id uuid, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_live_count integer;
  v_entitlement_id uuid;
  v_reservation_id uuid;
begin
  if p_customer_profile_id is null or p_listing_id is null then
    return query select false, null::uuid, 'invalid_request';
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_customer_profile_id::text, 0));

  select count(*)::integer into v_live_count
  from public.used_car_listings l
  where l.owner_profile_id = p_customer_profile_id
    and l.status in ('pending_review','active','reserved')
    and l.expires_at > pg_catalog.now();

  select v_live_count + count(*)::integer into v_live_count
  from public.used_car_listing_quota_reservations r
  where r.customer_profile_id = p_customer_profile_id
    and r.consumed_at is null
    and r.expires_at > pg_catalog.now()
    and not exists (select 1 from public.used_car_listings l where l.id = r.listing_id);

  if v_live_count >= 3 then
    select e.id into v_entitlement_id
    from public.monetization_entitlements e
    join public.monetization_products p on p.id = e.product_id
    where e.customer_profile_id = p_customer_profile_id
      and p.code = 'extra_listing'
      and p.is_active = true
      and e.status = 'active'
      and e.starts_at <= pg_catalog.now()
      and (e.expires_at is null or e.expires_at > pg_catalog.now())
      and e.quantity_used < e.quantity_total
      and not exists (
        select 1 from public.used_car_listing_quota_reservations r
        where r.entitlement_id = e.id and r.consumed_at is null and r.expires_at > pg_catalog.now()
      )
    order by e.created_at
    limit 1
    for update of e;

    if v_entitlement_id is null then
      return query select false, null::uuid, 'free_limit_reached';
      return;
    end if;
  end if;

  insert into public.used_car_listing_quota_reservations(listing_id, customer_profile_id, entitlement_id)
  values (p_listing_id, p_customer_profile_id, v_entitlement_id)
  returning id into v_reservation_id;

  return query select true, v_reservation_id, 'reserved';
end;
$$;

create or replace function public.finalize_used_car_listing_slot(
  p_customer_profile_id uuid,
  p_listing_id uuid
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entitlement_id uuid;
begin
  select r.entitlement_id into v_entitlement_id
  from public.used_car_listing_quota_reservations r
  where r.customer_profile_id = p_customer_profile_id
    and r.listing_id = p_listing_id
    and r.consumed_at is null
    and r.expires_at > pg_catalog.now()
  for update;

  if not found then return false; end if;

  if v_entitlement_id is not null then
    update public.monetization_entitlements
      set quantity_used = quantity_used + 1,
          consumed_at = pg_catalog.now(),
          consumed_for_listing_id = p_listing_id,
          status = case when quantity_used + 1 >= quantity_total then 'exhausted' else 'active' end
    where id = v_entitlement_id
      and status = 'active'
      and quantity_used < quantity_total;
    if not found then return false; end if;
  end if;

  update public.used_car_listing_quota_reservations
    set consumed_at = pg_catalog.now()
    where listing_id = p_listing_id and customer_profile_id = p_customer_profile_id;
  return true;
end;
$$;

create or replace function public.release_used_car_listing_slot(
  p_customer_profile_id uuid,
  p_listing_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.used_car_listing_quota_reservations
  where customer_profile_id = p_customer_profile_id and listing_id = p_listing_id
    and (consumed_at is null or not exists (
      select 1 from public.used_car_listings l where l.id = p_listing_id
    ));

  update public.monetization_entitlements e
    set quantity_used = greatest(0, quantity_used - 1),
        consumed_at = null,
        consumed_for_listing_id = null,
        status = 'active'
  where e.consumed_for_listing_id = p_listing_id
    and e.customer_profile_id = p_customer_profile_id
    and not exists (select 1 from public.used_car_listings l where l.id = p_listing_id);
end;
$$;

revoke all on function public.reserve_used_car_listing_slot(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finalize_used_car_listing_slot(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_used_car_listing_slot(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_used_car_listing_slot(uuid, uuid) to service_role;
grant execute on function public.finalize_used_car_listing_slot(uuid, uuid) to service_role;
grant execute on function public.release_used_car_listing_slot(uuid, uuid) to service_role;
