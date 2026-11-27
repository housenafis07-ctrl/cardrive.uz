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


-- Shared Payme/Click attempt lifecycle and callback idempotency.
do $$
declare
  v_listing_id uuid;
  v_order_id uuid;
  v_attempt_id uuid;
  v_amount numeric;
  v_prepare_id bigint;
  v_error integer;
  v_note text;
  v_confirm jsonb;
  v_count integer;
  v_status text;
  v_bind record;
begin
  select id into v_listing_id from public.used_car_listings
  where slug='pending-owner' and owner_profile_id='10000000-0000-4000-8000-000000000001';

  update public.monetization_products set amount=5000,currency='UZS',is_active=true where code='top_1d';

  -- Click: attempt is reserved once; Prepare retries return the same ID; Complete is idempotent.
  select order_id,total_amount into v_order_id,v_amount
  from public.create_monetization_order(
    '10000000-0000-4000-8000-000000000001','top_1d',v_listing_id,'shared-click-order-key-0001'
  );
  select id into v_attempt_id from public.create_monetization_payment_attempt(
    v_order_id,'10000000-0000-4000-8000-000000000001','click','shared-click-attempt-key-0001'
  );
  select error_code,error_note,merchant_prepare_id into v_error,v_note,v_prepare_id
  from public.prepare_monetization_click_payment(
    v_attempt_id,'900000000001','800000000001',v_amount,'test-service','{"action":"0"}'::jsonb
  );
  if v_error<>0 or v_prepare_id is null then raise exception 'Click Prepare failed: % %',v_error,v_note; end if;

  select error_code,merchant_prepare_id into v_error,v_prepare_id
  from public.prepare_monetization_click_payment(
    v_attempt_id,'900000000001','800000000001',v_amount,'test-service','{"action":"0"}'::jsonb
  );
  if v_error<>0 then raise exception 'Duplicate Click Prepare was not idempotent'; end if;

  v_confirm := public.confirm_monetization_payment_attempt(
    v_attempt_id,'900000000001','800000000001',v_amount,'UZS','{"click":{"action":"1"}}'::jsonb
  );
  if v_confirm->>'paid' <> 'true' then raise exception 'Click Complete did not confirm payment'; end if;
  v_confirm := public.confirm_monetization_payment_attempt(
    v_attempt_id,'900000000001','800000000001',v_amount,'UZS','{"click":{"action":"1"}}'::jsonb
  );
  if v_confirm->>'already_paid' <> 'true' then raise exception 'Duplicate Click Complete was not idempotent'; end if;
  select count(*) into v_count from public.monetization_entitlements
  where order_item_id in (select id from public.monetization_order_items where order_id=v_order_id);
  if v_count<>1 then raise exception 'Click duplicate callback granted multiple entitlements'; end if;

  -- Payme: bind its transaction ID to the pre-created attempt and confirm using the same RPC.
  select order_id,total_amount into v_order_id,v_amount
  from public.create_monetization_order(
    '10000000-0000-4000-8000-000000000001','top_1d',v_listing_id,'shared-payme-order-key-0001'
  );
  select id into v_attempt_id from public.create_monetization_payment_attempt(
    v_order_id,'10000000-0000-4000-8000-000000000001','payme','shared-payme-attempt-key-0001'
  );
  select * into v_bind from public.bind_payme_monetization_transaction(
    v_order_id,'payme-test-transaction-1',round(v_amount*100)::bigint,
    '{"id":"payme-test-transaction-1","amount":500000,"state":1}'::jsonb
  );
  if v_bind.error_code<>0 or v_bind.attempt_id<>v_attempt_id then
    raise exception 'Payme CreateTransaction binding failed';
  end if;
  v_confirm := public.confirm_monetization_payment_attempt(
    v_attempt_id,'payme-test-transaction-1',null,v_amount,'UZS',
    '{"payme":{"perform_time":1764151200000,"state":2}}'::jsonb
  );
  if v_confirm->>'paid'<>'true' then raise exception 'Payme PerformTransaction failed'; end if;

  -- Payme CancelTransaction after PerformTransaction records a refund and revokes access.
  v_confirm := public.cancel_monetization_payment_attempt(
    v_attempt_id,5,'{"payme":{"cancel_reason":5,"state":-2}}'::jsonb
  );
  select status into v_status from public.monetization_orders where id=v_order_id;
  if v_status<>'refunded' or v_confirm->>'state'<>'-2' then
    raise exception 'Payme post-perform cancellation did not refund the order';
  end if;
  select count(*) into v_count from public.monetization_entitlements
  where order_item_id in (select id from public.monetization_order_items where order_id=v_order_id)
    and status='revoked';
  if v_count<>1 then raise exception 'Payme refund did not revoke the entitlement'; end if;
  select count(*) into v_count from public.monetization_payment_events
  where order_id=v_order_id and event_type='payment.refunded';
  if v_count<>1 then raise exception 'Payme refund event was not recorded'; end if;

  -- Amount mismatch is rejected by the shared confirmation layer.
  begin
    perform public.confirm_monetization_payment_attempt(
      v_attempt_id,'payme-test-transaction-1',null,v_amount+1,'UZS','{}'::jsonb
    );
    raise exception 'Incorrect amount was accepted';
  exception when others then
    if sqlerrm='Incorrect amount was accepted' then raise; end if;
  end;

  if has_function_privilege('anon','public.create_monetization_payment_attempt(uuid,uuid,text,text)','EXECUTE')
     or has_function_privilege('authenticated','public.confirm_monetization_payment_attempt(uuid,text,text,numeric,text,jsonb)','EXECUTE')
     or has_function_privilege('anon','public.prepare_monetization_click_payment(uuid,text,text,numeric,text,jsonb)','EXECUTE') then
    raise exception 'A public role can execute privileged payment RPCs';
  end if;
end
$$;
