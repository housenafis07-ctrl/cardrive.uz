-- Telegram account linking and AI-assisted Avtobozor drafts.
-- Preview reads/writes news_stage; Production uses public. No existing marketplace tables are changed.

create schema if not exists news_stage;

create table if not exists public.telegram_user_links (
  telegram_user_id text primary key,
  telegram_chat_id text not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  telegram_username text,
  verified_phone text not null,
  linked_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create unique index if not exists telegram_user_links_profile_unique
  on public.telegram_user_links(profile_id);
create index if not exists telegram_user_links_chat_idx
  on public.telegram_user_links(telegram_chat_id);

create table if not exists public.telegram_link_challenges (
  telegram_user_id text primary key,
  telegram_chat_id text not null,
  phone text not null,
  telegram_username text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.telegram_ai_listing_drafts (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text not null references public.telegram_user_links(telegram_user_id) on delete cascade,
  telegram_chat_id text not null,
  source text not null check (source in ('forwarded_post','separate_photos')),
  status text not null default 'collecting'
    check (status in ('collecting','analyzing','review','submitted','cancelled','expired','failed')),
  source_text text not null default '',
  photo_file_ids jsonb not null default '[]'::jsonb
    check (jsonb_typeof(photo_file_ids) = 'array' and jsonb_array_length(photo_file_ids) <= 8),
  ai_payload jsonb,
  missing_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);
create index if not exists telegram_ai_listing_drafts_user_created_idx
  on public.telegram_ai_listing_drafts(telegram_user_id, created_at desc);
create unique index if not exists telegram_ai_listing_drafts_one_open_per_user
  on public.telegram_ai_listing_drafts(telegram_user_id)
  where status in ('collecting','analyzing','review');

alter table public.telegram_user_links enable row level security;
alter table public.telegram_link_challenges enable row level security;
alter table public.telegram_ai_listing_drafts enable row level security;
revoke all on public.telegram_user_links, public.telegram_link_challenges, public.telegram_ai_listing_drafts from public, anon, authenticated;
grant all on public.telegram_user_links, public.telegram_link_challenges, public.telegram_ai_listing_drafts to service_role;

-- Isolated Preview copies. These continue to reference real profile IDs but cannot be
-- accessed by anon/authenticated; Preview handlers use service_role and news_stage.
create table if not exists news_stage.telegram_user_links (
  like public.telegram_user_links including all
);
alter table news_stage.telegram_user_links
  add constraint telegram_user_links_profile_fk
  foreign key (profile_id) references public.profiles(id) on delete cascade;
create unique index if not exists news_stage_telegram_user_links_profile_unique
  on news_stage.telegram_user_links(profile_id);
create index if not exists news_stage_telegram_user_links_chat_idx
  on news_stage.telegram_user_links(telegram_chat_id);

create table if not exists news_stage.telegram_link_challenges (
  like public.telegram_link_challenges including all
);
create table if not exists news_stage.telegram_ai_listing_drafts (
  like public.telegram_ai_listing_drafts including all
);
alter table news_stage.telegram_ai_listing_drafts
  add constraint telegram_ai_listing_drafts_user_fk
  foreign key (telegram_user_id) references news_stage.telegram_user_links(telegram_user_id) on delete cascade;
create index if not exists news_stage_telegram_ai_listing_drafts_user_created_idx
  on news_stage.telegram_ai_listing_drafts(telegram_user_id, created_at desc);
create unique index if not exists news_stage_telegram_ai_listing_drafts_one_open_per_user
  on news_stage.telegram_ai_listing_drafts(telegram_user_id)
  where status in ('collecting','analyzing','review');

alter table news_stage.telegram_user_links enable row level security;
alter table news_stage.telegram_link_challenges enable row level security;
alter table news_stage.telegram_ai_listing_drafts enable row level security;
revoke all on news_stage.telegram_user_links, news_stage.telegram_link_challenges, news_stage.telegram_ai_listing_drafts from public, anon, authenticated;
grant usage on schema news_stage to service_role;
grant all on news_stage.telegram_user_links, news_stage.telegram_link_challenges, news_stage.telegram_ai_listing_drafts to service_role;
