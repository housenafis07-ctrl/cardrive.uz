-- Production counterpart of the Preview-only Telegram AI Avtobozor draft schema.
-- Additive only: does not modify existing CRM, used-car listing, OTP or moderation tables.

create table if not exists public.telegram_user_links (
  telegram_user_id text primary key,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.telegram_ai_listing_drafts (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text not null,
  telegram_chat_id text not null,
  source text not null check (source in ('forwarded_post','separate_photos')),
  status text not null default 'collecting'
    check (status in ('collecting','analyzing','review','submitted','cancelled','expired','failed')),
  source_text text not null default '',
  ai_payload jsonb,
  handoff_token_hash text not null unique,
  claimed_profile_id uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
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

create table if not exists public.telegram_ai_listing_draft_photos (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.telegram_ai_listing_drafts(id) on delete cascade,
  telegram_file_id text not null,
  telegram_file_unique_id text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (draft_id, telegram_file_unique_id)
);
create index if not exists telegram_ai_listing_draft_photos_order_idx
  on public.telegram_ai_listing_draft_photos(draft_id, sort_order, created_at);

alter table public.telegram_user_links enable row level security;
alter table public.telegram_ai_listing_drafts enable row level security;
alter table public.telegram_ai_listing_draft_photos enable row level security;

revoke all on public.telegram_user_links, public.telegram_ai_listing_drafts, public.telegram_ai_listing_draft_photos
  from public, anon, authenticated;
grant all on public.telegram_user_links, public.telegram_ai_listing_drafts, public.telegram_ai_listing_draft_photos
  to service_role;
