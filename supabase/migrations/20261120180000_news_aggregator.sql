create table if not exists public.news_sources (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 feed_url text not null unique,
 language text not null default 'auto' check(language in ('auto','uz','ru','en')),
 is_active boolean not null default true,
 fetch_interval_minutes integer not null default 1440 check(fetch_interval_minutes = 1440),
 last_fetched_at timestamptz,
 last_error text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.news_articles (
 id uuid primary key default gen_random_uuid(),
 source_id uuid not null references public.news_sources(id) on delete cascade,
 external_id text not null,
 source_url text not null,
 source_name text not null,
 original_language text not null default 'unknown',
 title_original text not null,
 summary_original text,
 title_uz text not null,
 summary_uz text,
 title_ru text not null,
 summary_ru text,
 title_en text not null,
 summary_en text,
 image_url text,
 published_at timestamptz,
 fetched_at timestamptz not null default now(),
 is_published boolean not null default true,
 created_at timestamptz not null default now(),
 unique(source_id, external_id)
);
create index if not exists news_articles_published_date_idx on public.news_articles(is_published,published_at desc);
create index if not exists news_articles_source_idx on public.news_articles(source_id,fetched_at desc);
alter table public.news_sources enable row level security;
alter table public.news_articles enable row level security;
revoke all on public.news_sources from anon,authenticated;
revoke all on public.news_articles from anon,authenticated;
grant all on public.news_sources to service_role;
grant all on public.news_articles to service_role;
