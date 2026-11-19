create table if not exists public.used_car_listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.used_car_listings(id) on delete cascade,
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('video/mp4','video/quicktime')),
  size_bytes bigint not null check (size_bytes between 1 and 52428800),
  status text not null default 'pending_upload' check (status in ('pending_upload','pending_review','approved','rejected')),
  moderation_note text,
  upload_expires_at timestamptz not null default (now() + interval '20 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists used_car_listing_media_listing_idx on public.used_car_listing_media(listing_id,created_at);
alter table public.used_car_listing_media enable row level security;
revoke all on public.used_car_listing_media from anon, authenticated;
grant select,insert,update,delete on public.used_car_listing_media to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('used-car-videos','used-car-videos',false,52428800,array['video/mp4','video/quicktime'])
on conflict (id) do update set public=false,file_size_limit=52428800,allowed_mime_types=array['video/mp4','video/quicktime'];

create or replace function public.reserve_used_car_listing_video(
 p_listing_id uuid,p_owner_profile_id uuid,p_storage_path text,p_original_name text,p_mime_type text,p_size_bytes bigint
) returns table(media_id uuid,storage_path text)
language plpgsql security definer set search_path=''
as $$
declare v_owner uuid; v_status text; v_count integer; v_id uuid;
begin
 select l.owner_profile_id,l.status into v_owner,v_status from public.used_car_listings l where l.id=p_listing_id for update;
 if not found or v_owner<>p_owner_profile_id then raise exception 'listing_not_owned' using errcode='42501'; end if;
 if v_status in ('sold','archived') then raise exception 'listing_not_uploadable' using errcode='22023'; end if;
 if p_mime_type not in ('video/mp4','video/quicktime') or p_size_bytes<1 or p_size_bytes>52428800 then
  raise exception 'invalid_video_file' using errcode='22023';
 end if;
 select count(*) into v_count from public.used_car_listing_media m where m.listing_id=p_listing_id
 and (m.status in ('pending_review','approved','rejected') or (m.status='pending_upload' and m.upload_expires_at>now()));
 if v_count>=3 then raise exception 'video_limit_reached' using errcode='22023'; end if;
 insert into public.used_car_listing_media(listing_id,owner_profile_id,storage_path,original_name,mime_type,size_bytes)
 values(p_listing_id,p_owner_profile_id,p_storage_path,p_original_name,p_mime_type,p_size_bytes) returning id into v_id;
 return query select v_id,p_storage_path;
end $$;
revoke all on function public.reserve_used_car_listing_video(uuid,uuid,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_used_car_listing_video(uuid,uuid,text,text,text,bigint) to service_role;
