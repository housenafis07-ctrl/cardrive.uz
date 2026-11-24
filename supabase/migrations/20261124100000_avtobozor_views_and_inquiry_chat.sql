-- Additive Avtobozor view analytics and inquiry conversation messages.
-- Apply only through the normal reviewed migration process; never run against Production from this PR.

create table if not exists public.used_car_listing_view_events (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.used_car_listings(id) on delete cascade,
  visitor_hash text not null check (char_length(visitor_hash) = 64),
  viewed_on date not null default (timezone('utc', now())::date),
  created_at timestamptz not null default now(),
  unique (listing_id, visitor_hash, viewed_on)
);

create index if not exists used_car_listing_view_events_listing_day_idx
  on public.used_car_listing_view_events(listing_id, viewed_on desc);

alter table public.used_car_listing_view_events enable row level security;
revoke all on public.used_car_listing_view_events from anon, authenticated, public;
grant all on public.used_car_listing_view_events to service_role;

create or replace function public.record_used_car_listing_view(
  p_listing_id uuid,
  p_visitor_hash text
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_inserted integer;
begin
  if p_listing_id is null or p_visitor_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid view event';
  end if;

  insert into public.used_car_listing_view_events(listing_id, visitor_hash, viewed_on)
  select l.id, p_visitor_hash, timezone('utc', now())::date
  from public.used_car_listings l
  where l.id = p_listing_id
    and l.status = 'active'
    and l.expires_at > now()
  on conflict (listing_id, visitor_hash, viewed_on) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.used_car_listings
      set view_count = view_count + 1
      where id = p_listing_id and status = 'active' and expires_at > now();
  end if;

  select view_count into v_count
    from public.used_car_listings
    where id = p_listing_id and status = 'active' and expires_at > now();

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.record_used_car_listing_view(uuid, text) from public, anon, authenticated;
grant execute on function public.record_used_car_listing_view(uuid, text) to service_role;

create table if not exists public.used_car_inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.used_car_inquiries(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists used_car_inquiry_messages_thread_idx
  on public.used_car_inquiry_messages(inquiry_id, created_at asc);

alter table public.used_car_inquiry_messages enable row level security;
revoke all on public.used_car_inquiry_messages from anon, authenticated, public;
grant all on public.used_car_inquiry_messages to service_role;

-- Existing used_car_inquiries.message remains the opening message and is not rewritten.
