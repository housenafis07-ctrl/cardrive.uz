-- Monetization quota regression tests.
do $$
declare
  v_allowed boolean;
  v_entitlement uuid;
  v_listing uuid;
  i integer;
begin
  -- Three live listings already exist for customer 1; a fourth requires a paid slot.
  select r.allowed into v_allowed
  from public.reserve_used_car_listing_slot(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001'
  ) r;
  if v_allowed is distinct from false then
    raise exception 'Free quota must reject a fourth live listing';
  end if;

  -- Activate one extra-listing product and grant one test entitlement.
  update public.monetization_products
  set is_active = true, amount = 1000
  where code = 'extra_listing';

  select id into v_entitlement
  from public.monetization_products where code = 'extra_listing';

  insert into public.monetization_entitlements
    (customer_profile_id, product_id, quantity_total)
  values
    ('10000000-0000-4000-8000-000000000001', v_entitlement, 1)
  returning id into v_entitlement;

  select r.allowed into v_allowed
  from public.reserve_used_car_listing_slot(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002'
  ) r;
  if v_allowed is distinct from true then
    raise exception 'Purchased extra slot should allow one additional listing';
  end if;

  insert into public.used_car_listings
    (id, owner_profile_id, slug, brand, model, year, mileage_km, price, currency,
     region, description, contact_name, contact_phone, status)
  values
    ('20000000-0000-4000-8000-000000000002',
     '10000000-0000-4000-8000-000000000001',
     'quota-extra-test','Test','Extra',2024,0,1000,'UZS',
     'Toshkent','Quota regression test listing','Owner','+998900000001','pending_review');

  if not public.finalize_used_car_listing_slot(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'Extra listing reservation did not finalize';
  end if;

  if (select quantity_used from public.monetization_entitlements where id = v_entitlement) <> 1 then
    raise exception 'Extra listing entitlement was not consumed';
  end if;

  -- The consumed listing reference must survive row deletion until the release RPC runs.
  delete from public.used_car_listings
  where id = '20000000-0000-4000-8000-000000000002';

  perform public.release_used_car_listing_slot(
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002'
  );

  if (select quantity_used from public.monetization_entitlements where id = v_entitlement) <> 0 then
    raise exception 'Deleting a listing must restore the consumed extra slot';
  end if;

  -- Customer 2 starts with no live listings. Three reservations/listings are allowed; the fourth is denied.
  for i in 1..3 loop
    v_listing := ('30000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid;
    select r.allowed into v_allowed
    from public.reserve_used_car_listing_slot(
      '10000000-0000-4000-8000-000000000002', v_listing
    ) r;
    if v_allowed is distinct from true then
      raise exception 'Free listing slot % was unexpectedly denied', i;
    end if;

    insert into public.used_car_listings
      (id, owner_profile_id, slug, brand, model, year, mileage_km, price, currency,
       region, description, contact_name, contact_phone, status)
    values
      (v_listing,
       '10000000-0000-4000-8000-000000000002',
       'quota-free-test-' || i,'Test','Free',2024,0,1000,'UZS',
       'Toshkent','Quota regression test listing','Owner','+998900000002','pending_review');

    if not public.finalize_used_car_listing_slot(
      '10000000-0000-4000-8000-000000000002', v_listing
    ) then
      raise exception 'Free listing reservation % did not finalize', i;
    end if;
  end loop;

  select r.allowed into v_allowed
  from public.reserve_used_car_listing_slot(
    '10000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000099'
  ) r;
  if v_allowed is distinct from false then
    raise exception 'Fourth free listing must be denied';
  end if;

  -- Public and authenticated roles must not invoke privileged quota RPCs.
  if has_function_privilege('anon','public.reserve_used_car_listing_slot(uuid,uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.reserve_used_car_listing_slot(uuid,uuid)','EXECUTE') then
    raise exception 'Quota reservation RPC is executable by a public role';
  end if;
end
$$;
