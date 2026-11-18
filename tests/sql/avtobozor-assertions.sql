-- Fixtures: owner, another customer and an active moderator.
insert into public.profiles (id, role, is_active) values
  ('10000000-0000-4000-8000-000000000001','customer',true),
  ('10000000-0000-4000-8000-000000000002','customer',true),
  ('10000000-0000-4000-8000-000000000003','admin',true);

insert into public.used_car_listings
  (owner_profile_id,slug,brand,model,year,mileage_km,price,currency,region,description,contact_name,contact_phone,status,vehicle_condition,condition_description,expires_at)
values
  ('10000000-0000-4000-8000-000000000001','pending-owner','Chevrolet','Cobalt',2020,0,10000,'USD','Toshkent','Test description for pending vehicle','Owner','+998900000001','pending_review','ideal','Kuzov va salon nuqsonsiz, texnik holati yaxshi.',now()+interval '30 days'),
  ('10000000-0000-4000-8000-000000000001','active-public','Chevrolet','Nexia',2019,10000,8000,'USD','Toshkent','Test description for active vehicle','Owner','+998900000001','active','good','Tabiiy foydalanish izlari mavjud.',now()+interval '30 days'),
  ('10000000-0000-4000-8000-000000000001','reserved-public','Chevrolet','Gentra',2021,20000,12000,'USD','Toshkent','Test description for reserved vehicle','Owner','+998900000001','reserved','good','Tabiiy foydalanish izlari mavjud.',now()+interval '30 days'),
  ('10000000-0000-4000-8000-000000000002','sold-public','Chevrolet','Spark',2018,30000,5000,'USD','Samarqand','Test description for sold vehicle','Other','+998900000002','sold','minor_defects','Mayda tirnalishlar mavjud.',now()+interval '30 days'),
  ('10000000-0000-4000-8000-000000000002','expired-private','Chevrolet','Malibu',2022,5000,20000,'USD','Toshkent','Test description for expired vehicle','Other','+998900000002','active','good','Tabiiy foydalanish izlari mavjud.',now()-interval '1 day');

insert into public.used_car_listing_images (listing_id,storage_path,public_url,sort_order,is_primary)
select id,slug || '/photo.jpg','https://example.test/' || slug || '.jpg',0,true
from public.used_car_listings
where slug in ('pending-owner','active-public');

-- Explicitly test the valid 0 km boundary and reject invalid mileage/condition values.
do $$
begin
  insert into public.used_car_listings
    (owner_profile_id,slug,brand,model,year,mileage_km,price,currency,region,description,contact_name,contact_phone,vehicle_condition,condition_description)
  values
    ('10000000-0000-4000-8000-000000000001','zero-km-valid','Chevrolet','New',2026,0,15000,'USD','Toshkent','Test description for zero mileage','Owner','+998900000001','ideal','Yangi avtomobil, foydalanilmagan.');

  begin
    insert into public.used_car_listings
      (owner_profile_id,slug,brand,model,year,mileage_km,price,currency,region,description,contact_name,contact_phone)
    values
      ('10000000-0000-4000-8000-000000000001','negative-km-invalid','Chevrolet','Bad',2020,-1,1000,'USD','Toshkent','Test description invalid mileage','Owner','+998900000001');
    raise exception 'Negative mileage was unexpectedly accepted';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.used_car_listings
      (owner_profile_id,slug,brand,model,year,mileage_km,price,currency,region,description,contact_name,contact_phone,vehicle_condition)
    values
      ('10000000-0000-4000-8000-000000000001','bad-condition-invalid','Chevrolet','Bad',2020,10,1000,'USD','Toshkent','Test description invalid condition','Owner','+998900000001','not_a_condition');
    raise exception 'Invalid vehicle condition was unexpectedly accepted';
  exception when check_violation then
    null;
  end;
end
$$;

create function public.assert_equal(actual bigint, expected bigint, message text)
returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception '%: expected %, got %', message, expected, actual;
  end if;
end
$$;

-- Anonymous users see only active/reserved/sold, unexpired listings and their images.
set role anon;
select public.assert_equal((select count(*) from public.used_car_listings), 3, 'anon listing visibility');
select public.assert_equal((select count(*) from public.used_car_listing_images), 1, 'anon image visibility');
reset role;

-- Owners can read their own pending listing; other customers cannot.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
set role authenticated;
select public.assert_equal((select count(*) from public.used_car_listings where slug='pending-owner'), 1, 'owner pending listing visibility');
reset role;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',false);
set role authenticated;
select public.assert_equal((select count(*) from public.used_car_listings where slug='pending-owner'), 0, 'other customer cannot read pending listing');
reset role;

-- Admin sees all listings through the explicit admin policy.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
set role authenticated;
select public.assert_equal((select count(*) from public.used_car_listings), 6, 'admin listing visibility');
reset role;

-- Public roles cannot read private buyer/seller data or write marketplace records.
select public.assert_equal(case when has_table_privilege('anon','public.used_car_favorites','SELECT') then 1 else 0 end,0,'anon favorites privilege');
select public.assert_equal(case when has_table_privilege('anon','public.used_car_inquiries','SELECT') then 1 else 0 end,0,'anon inquiries privilege');
select public.assert_equal(case when has_table_privilege('anon','public.used_car_listings','INSERT') then 1 else 0 end,0,'anon listing insert privilege');
select public.assert_equal(case when has_table_privilege('authenticated','public.used_car_listings','UPDATE') then 1 else 0 end,0,'authenticated listing update privilege');

-- The server-only role retains the write privileges required by validated Server Actions.
select public.assert_equal(case when has_table_privilege('service_role','public.used_car_listings','INSERT') then 1 else 0 end,1,'service role insert privilege');

select public.assert_equal((select count(*) from storage.buckets where id='used-car-images' and public and file_size_limit=8388608 and allowed_mime_types=array['image/jpeg','image/png','image/webp']),1,'used-car image bucket configuration');
select public.assert_equal((select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('used_car_listings','used_car_listing_images','used_car_favorites','used_car_inquiries') and c.relrowsecurity),4,'RLS enabled on all marketplace tables');

drop function public.assert_equal(bigint,bigint,text);
