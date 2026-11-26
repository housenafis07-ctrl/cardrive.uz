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


-- Order creation reads configured prices from the catalog; verified payment grants one entitlement.
do $$
declare
  v_listing_id uuid;
  v_order_id uuid;
  v_amount numeric;
  v_currency text;
  v_status text;
  v_confirmed boolean;
  v_entitlement_count integer;
  v_promotion_count integer;
begin
  update public.monetization_products
  set amount = 5000, currency = 'UZS', is_active = true
  where code = 'top_1d';

  select id into v_listing_id from public.used_car_listings
  where slug = 'pending-owner' and owner_profile_id = '10000000-0000-4000-8000-000000000001';

  select order_id, total_amount, currency, status
    into v_order_id, v_amount, v_currency, v_status
  from public.create_monetization_order(
    '10000000-0000-4000-8000-000000000001',
    'top_1d', v_listing_id, 'test-order-key-top-1d-0001'
  );

  if v_amount <> 5000 or v_currency <> 'UZS' or v_status <> 'pending' then
    raise exception 'Order did not snapshot configured catalog price';
  end if;

  v_confirmed := public.confirm_monetization_payment(
    v_order_id, 'test_provider', 'event-top-1d-0001',
    'provider-ref-top-1d-0001', 5000, 'UZS'
  );
  if v_confirmed is distinct from true then
    raise exception 'Verified payment confirmation failed';
  end if;

  select count(*) into v_entitlement_count
  from public.monetization_entitlements where order_item_id in (
    select id from public.monetization_order_items where order_id = v_order_id
  );
  select count(*) into v_promotion_count
  from public.used_car_listing_promotions where listing_id = v_listing_id
    and promotion_type = 'top' and expires_at > now();

  if v_entitlement_count <> 1 or v_promotion_count <> 1 then
    raise exception 'Paid TOP entitlement or promotion was not activated';
  end if;

  -- Replaying the same provider event must not create a second entitlement or promotion.
  v_confirmed := public.confirm_monetization_payment(
    v_order_id, 'test_provider', 'event-top-1d-0001',
    'provider-ref-top-1d-0001', 5000, 'UZS'
  );
  select count(*) into v_entitlement_count
  from public.monetization_entitlements where order_item_id in (
    select id from public.monetization_order_items where order_id = v_order_id
  );
  select count(*) into v_promotion_count
  from public.used_car_listing_promotions where listing_id = v_listing_id
    and promotion_type = 'top' and expires_at > now();

  if v_confirmed is distinct from true or v_entitlement_count <> 1 or v_promotion_count <> 1 then
    raise exception 'Duplicate payment event was not idempotent';
  end if;

  if has_function_privilege('anon','public.create_monetization_order(uuid,text,uuid,text)','EXECUTE')
     or has_function_privilege('authenticated','public.confirm_monetization_payment(uuid,text,text,text,numeric,text)','EXECUTE') then
    raise exception 'A public role can execute a privileged payment RPC';
  end if;
end
$$;


-- Click Shop API Prepare/Complete lifecycle: idempotency, amount validation and cancellation.
do $$
declare
  v_listing_id uuid;
  v_order_id uuid;
  v_amount numeric;
  v_currency text;
  v_status text;
  v_prepare_id bigint;
  v_prepare_repeat bigint;
  v_error integer;
  v_note text;
  v_confirm_id bigint;
  v_entitlement_count integer;
  v_order_status text;
begin
  select id into v_listing_id from public.used_car_listings
  where slug = 'pending-owner'
    and owner_profile_id = '10000000-0000-4000-8000-000000000001';

  select order_id, total_amount, currency, status
    into v_order_id, v_amount, v_currency, v_status
  from public.create_monetization_order(
    '10000000-0000-4000-8000-000000000001',
    'top_1d', v_listing_id, 'test-click-order-key-success-0001'
  );

  if v_currency <> 'UZS' or v_status <> 'pending' then
    raise exception 'Click test order was not created as pending UZS';
  end if;

  select error_code, error_note, merchant_prepare_id
    into v_error, v_note, v_prepare_id
  from public.click_prepare_monetization_payment(
    '900000000001', '800000000001', v_order_id, v_amount, 'test-service', '2026-11-26 10:00:00'
  );
  if v_error <> 0 or v_prepare_id is null then
    raise exception 'Click Prepare failed: % %', v_error, v_note;
  end if;

  select error_code, merchant_prepare_id
    into v_error, v_prepare_repeat
  from public.click_prepare_monetization_payment(
    '900000000001', '800000000001', v_order_id, v_amount, 'test-service', '2026-11-26 10:00:00'
  );
  if v_error <> 0 or v_prepare_repeat <> v_prepare_id then
    raise exception 'Duplicate Click Prepare did not return the original prepare ID';
  end if;

  select error_code, merchant_confirm_id
    into v_error, v_confirm_id
  from public.click_complete_monetization_payment(
    '900000000001', v_order_id, v_prepare_id, v_amount, 0
  );
  if v_error <> 0 or v_confirm_id <> v_prepare_id then
    raise exception 'Click Complete failed: %', v_error;
  end if;

  select error_code, merchant_confirm_id
    into v_error, v_confirm_id
  from public.click_complete_monetization_payment(
    '900000000001', v_order_id, v_prepare_id, v_amount, 0
  );
  if v_error <> 0 or v_confirm_id <> v_prepare_id then
    raise exception 'Duplicate Click Complete was not idempotent';
  end if;

  select status into v_order_status from public.monetization_orders where id = v_order_id;
  if v_order_status <> 'paid' then
    raise exception 'Click Complete did not mark order paid';
  end if;

  select count(*) into v_entitlement_count
  from public.monetization_entitlements
  where order_item_id in (
    select id from public.monetization_order_items where order_id = v_order_id
  );
  if v_entitlement_count <> 1 then
    raise exception 'Duplicate Click Complete granted duplicate entitlement';
  end if;

  -- Incorrect amount must be rejected before creating an attempt.
  select order_id into v_order_id
  from public.create_monetization_order(
    '10000000-0000-4000-8000-000000000001',
    'top_1d', v_listing_id, 'test-click-order-key-bad-amount-001'
  );
  select error_code into v_error
  from public.click_prepare_monetization_payment(
    '900000000002', '800000000002', v_order_id, 999999, 'test-service', '2026-11-26 10:01:00'
  );
  if v_error <> -2 then
    raise exception 'Click Prepare did not reject incorrect amount';
  end if;

  -- A negative Click Complete cancels only the payment attempt, never grants an entitlement.
  select order_id, total_amount into v_order_id, v_amount
  from public.create_monetization_order(
    '10000000-0000-4000-8000-000000000001',
    'top_1d', v_listing_id, 'test-click-order-key-cancel-0001'
  );
  select error_code, merchant_prepare_id into v_error, v_prepare_id
  from public.click_prepare_monetization_payment(
    '900000000003', '800000000003', v_order_id, v_amount, 'test-service', '2026-11-26 10:02:00'
  );
  if v_error <> 0 then
    raise exception 'Click Prepare for cancellation test failed';
  end if;

  select error_code into v_error
  from public.click_complete_monetization_payment(
    '900000000003', v_order_id, v_prepare_id, v_amount, -1
  );
  if v_error <> -9 then
    raise exception 'Negative Click Complete did not return cancellation code';
  end if;

  select status into v_order_status from public.monetization_orders where id = v_order_id;
  if v_order_status <> 'pending' then
    raise exception 'Failed Click attempt must not mark order paid or cancel the reusable order';
  end if;

  select count(*) into v_entitlement_count
  from public.monetization_entitlements
  where order_item_id in (
    select id from public.monetization_order_items where order_id = v_order_id
  );
  if v_entitlement_count <> 0 then
    raise exception 'Cancelled Click transaction granted an entitlement';
  end if;

  if has_function_privilege('anon','public.click_prepare_monetization_payment(text,text,uuid,numeric,text,text)','EXECUTE')
     or has_function_privilege('authenticated','public.click_complete_monetization_payment(text,uuid,bigint,numeric,integer)','EXECUTE') then
    raise exception 'A public role can execute Click payment RPCs';
  end if;
end
$$;
